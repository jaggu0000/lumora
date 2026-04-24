import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './VideoSession.css';

const SOCKET_URL = 'http://localhost:3000';
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/* ── Peer video tile ─────────────────────────────────────────────── */
function PeerTile({ peer }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream;
    }
  }, [peer.stream]);

  return (
    <div className="vs-tile">
      <video ref={videoRef} autoPlay playsInline />
      {!peer.stream && (
        <div className="vs-connecting">
          <div className="vs-connecting-spinner" />
          <span>Connecting…</span>
        </div>
      )}
      <div className="vs-label">{peer.username || 'Peer'}</div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function VideoSession({ roomId, userId, username, onLeave }) {
  const [peers, setPeers]         = useState({});
  const [localStream, setLocalStream] = useState(null);
  const [error, setError]         = useState(null);
  const [camOn, setCamOn]         = useState(true);

  const socketRef      = useRef(null);
  const localVideoRef  = useRef(null);
  const localStreamRef = useRef(null);
  const pcsRef         = useRef({});
  // Buffer ICE candidates that arrive before remote description is set
  const iceQueues      = useRef({});

  /* Create a peer connection for remoteSocketId */
  const makePC = (remoteId, socket) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local video tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Remote video arrives
    pc.ontrack = ({ streams: [stream] }) => {
      setPeers(prev => ({
        ...prev,
        [remoteId]: { ...prev[remoteId], stream },
      }));
    };

    // Send ICE candidates to the peer
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        socket.emit('ice-candidate', { to: remoteId, candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') pc.restartIce();
    };

    pcsRef.current[remoteId] = pc;
    iceQueues.current[remoteId] = iceQueues.current[remoteId] ?? [];
    return pc;
  };

  /* Drain any queued ICE candidates once remote description is ready */
  const drainQueue = async (remoteId) => {
    const queue = iceQueues.current[remoteId] ?? [];
    const pc    = pcsRef.current[remoteId];
    if (!pc) return;
    for (const c of queue) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
    }
    iceQueues.current[remoteId] = [];
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }

      localStreamRef.current = stream;
      setLocalStream(stream);

      const socket = io(SOCKET_URL, { withCredentials: true });
      socketRef.current = socket;

      socket.emit('join-video-room', { roomId, userId, username });

      /* ── Existing peers: WE create offers to each one ── */
      socket.on('existing-peers', async (existingPeers) => {
        for (const peer of existingPeers) {
          setPeers(prev => ({ ...prev, [peer.socketId]: { username: peer.username } }));
          const pc = makePC(peer.socketId, socket);
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('offer', { to: peer.socketId, offer });
          } catch (e) {
            console.error('[WebRTC] offer failed', e);
          }
        }
      });

      /* ── New peer joined: just record them, wait for their offer ── */
      socket.on('peer-joined', ({ socketId, username: peerName }) => {
        setPeers(prev => ({ ...prev, [socketId]: { username: peerName } }));
        iceQueues.current[socketId] = [];
      });

      /* ── Receive offer → answer ── */
      socket.on('offer', async ({ from, offer }) => {
        // Ensure peer entry exists
        setPeers(prev => prev[from] ? prev : { ...prev, [from]: { username: 'Peer' } });

        const pc = makePC(from, socket);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await drainQueue(from);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { to: from, answer });
        } catch (e) {
          console.error('[WebRTC] answer failed', e);
        }
      });

      /* ── Receive answer ── */
      socket.on('answer', async ({ from, answer }) => {
        const pc = pcsRef.current[from];
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainQueue(from);
        } catch (e) {
          console.error('[WebRTC] setRemoteDescription(answer) failed', e);
        }
      });

      /* ── ICE candidate: queue if remote desc not set yet ── */
      socket.on('ice-candidate', async ({ from, candidate }) => {
        if (!candidate) return;
        const pc = pcsRef.current[from];
        if (pc?.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* ignore */ }
        } else {
          iceQueues.current[from] = iceQueues.current[from] ?? [];
          iceQueues.current[from].push(candidate);
        }
      });

      /* ── Peer left ── */
      socket.on('peer-left', ({ socketId }) => {
        pcsRef.current[socketId]?.close();
        delete pcsRef.current[socketId];
        delete iceQueues.current[socketId];
        setPeers(prev => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      });

      socket.on('room-full', () => {
        setError('Room is full — max 4 participants.');
      });
    };

    init().catch(err => setError(err.message));

    return () => {
      cancelled = true;
      Object.values(pcsRef.current).forEach(pc => pc.close());
      pcsRef.current  = {};
      iceQueues.current = {};
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
    };
  }, [roomId, userId, username]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleLeave = () => {
    socketRef.current?.emit('leave-video-room', { roomId });
    Object.values(pcsRef.current).forEach(pc => pc.close());
    pcsRef.current = {};
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    socketRef.current?.disconnect();
    onLeave();
  };

  const toggleCamera = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  if (error) {
    return (
      <div className="vs-overlay">
        <div className="vs-error-card">
          <div className="vs-error-icon">📹</div>
          <p className="vs-error-msg">{error}</p>
          <button className="vs-leave-btn" onClick={onLeave}>Close</button>
        </div>
      </div>
    );
  }

  const peerList   = Object.entries(peers);
  const totalCount = 1 + peerList.length;

  return (
    <div className="vs-overlay">
      <div className="vs-container">

        <div className="vs-header">
          <div className="vs-header-left">
            <span className="vs-live-dot" />
            <span className="vs-title">Silent Video Session</span>
          </div>
          <div className="vs-header-right">
            <button
              className={`vs-cam-btn ${camOn ? '' : 'off'}`}
              onClick={toggleCamera}
              title={camOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {camOn ? '📹' : '🚫'}
            </button>
            <button className="vs-leave-btn" onClick={handleLeave}>Leave</button>
          </div>
        </div>

        <div className={`vs-grid count-${totalCount}`}>
          <div className="vs-tile local">
            <video ref={localVideoRef} autoPlay muted playsInline />
            {!localStream && (
              <div className="vs-connecting">
                <div className="vs-connecting-spinner" />
                <span>Starting camera…</span>
              </div>
            )}
            {!camOn && (
              <div className="vs-cam-off">
                <span>📷</span>
                <span>Camera off</span>
              </div>
            )}
            <div className="vs-label">You</div>
          </div>

          {peerList.map(([socketId, peer]) => (
            <PeerTile key={socketId} peer={peer} />
          ))}
        </div>

        <div className="vs-footer">
          Video only · Audio is disabled in this session
        </div>
      </div>
    </div>
  );
}
