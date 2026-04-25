import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import './CommunityChat.css';
import VideoSession from '../VideoSession/VideoSession.jsx';
import { approveCommunityJoinRequest, fetchCommunityJoinRequests, leaveCommunity, reportCommunity } from '../../api/communityApi.js';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL?.replace('/api', '') || 'http://localhost:3000';
const BASE_URL   = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';

const EMOJIS = ['😀','😂','🥰','😎','🤔','😮','👍','👎','❤️','🔥','✨','🎉',
                 '🙌','💯','🚀','🎨','💡','⚡','🌟','😊','🤣','😜','🥳','🤩',
                 '👀','💪','🙏','✅','❌','💎','🎯','🌈'];

/* ── Helpers ─────────────────────────────────────────────────────── */
const getInitials = (name) =>
  (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = [
  '#7c3aed','#2563eb','#059669','#dc2626','#d97706',
  '#0891b2','#9333ea','#16a34a','#ea580c','#db2777',
];
const getAvatarColor = (userId) => {
  let hash = 0;
  for (const c of (userId || '')) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const FILE_ICONS = {
  pdf:'📄', fig:'🎨', sketch:'✏️', png:'🖼️', jpg:'🖼️', jpeg:'🖼️',
  mp4:'🎬', mov:'🎬', mp3:'🎵', wav:'🎵', zip:'📦', rar:'📦',
  doc:'📝', docx:'📝', xls:'📊', xlsx:'📊', ppt:'📽️', pptx:'📽️',
};
const getFileIcon = (filename = '') => {
  const ext = filename.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📎';
};

const isImageUrl = (url = '') =>
  /\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/i.test(url);

const resolveUrl = (url) =>
  url?.startsWith('http') ? url : `${BASE_URL.replace('/api', '')}${url}`;

const NON_MEDIA_FILE_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.zip,.rar,.7z,.tar,.gz,.json,.xml,.md,.fig,.sketch,.psd,.ai,.eps,.js,.jsx,.ts,.tsx,.css,.scss,.sass,.html,.htm';

const getFileCategory = (file) => {
  const mimeType = file?.type || '';

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
};

/* ── Sub-components ──────────────────────────────────────────────── */
const Avatar = ({ userId, name, size = 34, className = '' }) => (
  <div
    className={`msg-avatar ${className}`}
    style={{
      width: size, height: size,
      background: `linear-gradient(135deg, ${getAvatarColor(userId)}, ${getAvatarColor(userId + '_')}cc)`,
    }}
  >
    {getInitials(name)}
  </div>
);

const RoleBadge = ({ role }) => {
  if (role === 'member') return null;
  return <span className={`msg-sender-role-badge ${role}`}>{role}</span>;
};

const ReplyPreview = ({ replyToId, messages, onClick }) => {
  const replied = messages.find(m => m._id === replyToId);
  if (!replied) return null;
  return (
    <div className="reply-preview" onClick={onClick}>
      <span className="reply-icon">↩</span>
      <div className="reply-info">
        <div className="reply-author">{replied.senderId.username}</div>
        <div className="reply-text">
          {replied.messageType !== 'text'
            ? `📎 ${replied.attachments?.[0]?.filename || 'Attachment'}`
            : replied.content}
        </div>
      </div>
    </div>
  );
};

const ImageAttachment = ({ attachment }) => {
  const [open, setOpen] = useState(false);
  const src = resolveUrl(attachment.url);
  return (
    <>
      <img
        className="chat-image"
        src={src}
        alt={attachment.filename || 'image'}
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="image-lightbox" onClick={() => setOpen(false)}>
          <img src={src} alt={attachment.filename || 'image'} className="image-lightbox-img" />
          <button className="image-lightbox-close" onClick={() => setOpen(false)}>✕</button>
          <a
            className="image-lightbox-dl"
            href={src}
            download={attachment.filename}
            onClick={e => e.stopPropagation()}
          >⬇ Download</a>
        </div>
      )}
    </>
  );
};

const AttachmentCard = ({ attachment }) => (
  <a
    className="attachment-card"
    href={resolveUrl(attachment.url)}
    download={attachment.filename}
    target="_blank"
    rel="noreferrer"
  >
    <span className="attachment-icon-big">{getFileIcon(attachment.filename)}</span>
    <div className="attachment-details">
      <div className="attachment-name">{attachment.filename}</div>
      {attachment.size && (
        <div className="attachment-size">{formatFileSize(attachment.size)}</div>
      )}
    </div>
    <span className="attachment-download">⬇</span>
  </a>
);

const MessageBubble = ({ message, messages, isOwn, showAvatar, showName, onReply }) => (
  <div className={`message-item ${isOwn ? 'own' : ''}`}>
    <Avatar
      userId={message.senderId._id}
      name={message.senderId.username}
      className={showAvatar ? '' : 'hidden'}
    />
    <div className="message-content-wrap">
      {showName && !isOwn && (
        <div className="msg-sender-name">
          {message.senderId.username}
          <RoleBadge role={message.senderId.role} />
        </div>
      )}
      <div className="bubble">
        {message.replyTo && (
          <ReplyPreview replyToId={message.replyTo} messages={messages} onClick={() => {}} />
        )}
        {message.content && <div className="bubble-text">{message.content}</div>}
        {message.attachments?.map((att, i) =>
          isImageUrl(att.url) || att.type === 'image'
            ? <ImageAttachment key={i} attachment={att} />
            : <AttachmentCard key={i} attachment={att} />
        )}
        <div className="bubble-footer">
          {message.isEdited && <span className="edited-tag">edited</span>}
          <span className="msg-time">{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
    <div className="message-actions">
      <button className="action-btn" title="Reply" onClick={() => onReply(message)}>↩</button>
      <button className="action-btn" title="React">😊</button>
      {isOwn && <button className="action-btn delete" title="Delete">🗑</button>}
    </div>
  </div>
);

const TypingIndicator = ({ username }) => (
  <div className="typing-indicator">
    <div className="typing-avatar">{getInitials(username)}</div>
    <div className="typing-bubble">
      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
    </div>
    <span className="typing-name">{username} is typing…</span>
  </div>
);

const REASON_TYPES = [
  'violation of community guidelines',
  'Spam',
  'Harassment',
  'Inappropriate Content',
  'Impersonation',
  'Hate speech or Discrimination',
  'Other',
];

function ReportCommunityModal({ community, onClose }) {
  const [reasonType, setReasonType] = useState(REASON_TYPES[0]);
  const [reason,     setReason]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError('Please describe the issue.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await reportCommunity(community._id, reasonType, reason.trim());
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    }
    setSubmitting(false);
  };

  return (
    <div className="leave-confirm-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3 className="report-modal-title">Report Community</h3>
          <button className="details-close-btn" onClick={onClose}>✕</button>
        </div>

        {success ? (
          <div className="report-success">
            <div className="report-success-icon">✓</div>
            <p>Your report has been submitted. Our team will review it shortly.</p>
            <button className="leave-confirm-cancel" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="report-form" onSubmit={handleSubmit}>
            <div className="report-community-info">
              <strong>{community.communityName}</strong>
              <span className="details-tag"> #{community.communityTag}</span>
            </div>

            <label className="report-label">Reason</label>
            <select
              className="report-select"
              value={reasonType}
              onChange={e => setReasonType(e.target.value)}
            >
              {REASON_TYPES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <label className="report-label">Details <span className="report-chars">{reason.length}/500</span></label>
            <textarea
              className="report-textarea"
              placeholder="Describe the issue in detail…"
              value={reason}
              maxLength={500}
              rows={4}
              onChange={e => setReason(e.target.value)}
            />

            {error && <p className="details-leave-err">{error}</p>}

            <div className="leave-confirm-actions">
              <button type="button" className="leave-confirm-cancel" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="report-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Community Details Panel ─────────────────────────────────────── */
function CommunityDetailsPanel({ community, messages, currentUser, onClose, onLeave, onCommunityUpdated }) {
  const [tab,          setTab]          = useState('about');
  const [leaving,      setLeaving]      = useState(false);
  const [leaveErr,     setLeaveErr]     = useState('');
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [showReport,   setShowReport]   = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState(null);
  const [requestsError, setRequestsError] = useState('');

  const membersData   = community.membersData ?? [];
  const isAdmin       = membersData.find(m => m._id === currentUser._id)?.role === 'admin';

  const mediaMessages = messages.filter(m =>
    m.attachments?.some(a => isImageUrl(a.url) || a.type === 'image')
  );
  const fileMessages = messages.filter(m =>
    m.attachments?.some(a => !isImageUrl(a.url) && a.type !== 'image')
  );

  useEffect(() => {
    if (!isAdmin || tab !== 'requests') return;

    let cancelled = false;
    setLoadingRequests(true);
    setRequestsError('');

    fetchCommunityJoinRequests(community._id)
      .then(({ joinRequests: pendingRequests = [] }) => {
        if (!cancelled) setJoinRequests(pendingRequests);
      })
      .catch((error) => {
        if (!cancelled) setRequestsError(error.message || 'Failed to load join requests.');
      })
      .finally(() => {
        if (!cancelled) setLoadingRequests(false);
      });

    return () => {
      cancelled = true;
    };
  }, [community._id, isAdmin, tab]);

  const confirmLeave = async () => {
    setLeaving(true);
    setLeaveErr('');
    try {
      await leaveCommunity(community._id);
      onLeave();
    } catch (e) {
      setLeaveErr(e.message || 'Failed to leave');
      setShowConfirm(false);
    }
    setLeaving(false);
  };

  const handleApproveRequest = async (requestUserId) => {
    setApprovingRequestId(requestUserId);
    setRequestsError('');

    try {
      await approveCommunityJoinRequest(community._id, requestUserId);
      setJoinRequests((prev) => prev.filter((requestUser) => requestUser._id !== requestUserId));
      await onCommunityUpdated?.();
    } catch (error) {
      setRequestsError(error.message || 'Failed to approve join request.');
    }

    setApprovingRequestId(null);
  };

  const TABS = [
    { key: 'about',   label: 'About'   },
    { key: 'members', label: `Members (${membersData.length})` },
    ...(isAdmin ? [{ key: 'requests', label: `Requests (${joinRequests.length})` }] : []),
    { key: 'media',   label: 'Media'   },
    { key: 'files',   label: 'Files'   },
  ];

  return (
    <div className="details-panel">
      <div className="details-panel-header">
        <div className="details-panel-title">
          <div
            className="details-avatar"
            style={{ background: `linear-gradient(135deg, ${getAvatarColor(community._id)}, ${getAvatarColor(community._id + '_')}cc)` }}
          >
            {getInitials(community.communityName)}
          </div>
          <div>
            <div className="details-name">{community.communityName}</div>
            <div className="details-tag">#{community.communityTag}</div>
          </div>
        </div>
        <button className="details-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="details-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`details-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="details-body">

        {tab === 'about' && (
          <div className="details-about">
            <div className="details-stat-grid">
              <div className="details-stat">
                <span className="details-stat-val">{membersData.length}</span>
                <span className="details-stat-label">Members</span>
              </div>
              <div className="details-stat">
                <span className="details-stat-val">{messages.length}</span>
                <span className="details-stat-label">Messages</span>
              </div>
              <div className="details-stat">
                <span className="details-stat-val">{mediaMessages.length}</span>
                <span className="details-stat-label">Media</span>
              </div>
              <div className="details-stat">
                <span className="details-stat-val">{fileMessages.length}</span>
                <span className="details-stat-label">Files</span>
              </div>
            </div>

            <div className="details-info-row">
              <span className="details-info-label">Privacy</span>
              <span className={`details-badge ${community.isPrivate ? 'private' : 'public'}`}>
                {community.isPrivate ? '🔒 Private' : '🌐 Public'}
              </span>
            </div>
            <div className="details-info-row">
              <span className="details-info-label">Membership</span>
              <span className="details-badge neutral">
                {community.membershipMode === 'open' ? '✓ Open to join' :
                 community.membershipMode === 'request-to-join' ? '✉ Request required' :
                 '🔑 Invite only'}
              </span>
            </div>

            {community.description && (
              <div className="details-description">
                <span className="details-info-label">About</span>
                <p>{community.description}</p>
              </div>
            )}

            {!isAdmin && (
              <div className="details-leave-section">
                {leaveErr && <p className="details-leave-err">{leaveErr}</p>}
                <button
                  className="details-leave-btn"
                  onClick={() => setShowConfirm(true)}
                  disabled={leaving}
                >
                  ↩ Leave Community
                </button>
              </div>
            )}
            {isAdmin && (
              <p className="details-admin-note">You are the admin of this community.</p>
            )}

            <div className="details-report-section">
              <button className="details-report-btn" onClick={() => setShowReport(true)}>
                ⚑ Report Community
              </button>
            </div>
          </div>
        )}

        {tab === 'members' && (
          <div className="details-members-list">
            {membersData.map(m => (
              <div key={m._id} className="details-member-row">
                <div
                  className="details-member-avatar"
                  style={{ background: `linear-gradient(135deg, ${getAvatarColor(m._id)}, ${getAvatarColor(m._id + '_')}cc)` }}
                >
                  {getInitials(m.username)}
                </div>
                <div className="details-member-info">
                  <span className="details-member-name">
                    {m.username}
                    {m._id === currentUser._id && <span className="details-you-tag"> (you)</span>}
                  </span>
                  <span className="details-member-role">{m.role}</span>
                </div>
                {m.role !== 'member' && (
                  <span className={`role-badge ${m.role}`}>{m.role}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'requests' && isAdmin && (
          <div className="details-requests-list">
            {loadingRequests && (
              <p className="details-empty">Loading join requests...</p>
            )}

            {!loadingRequests && requestsError && (
              <p className="details-request-error">{requestsError}</p>
            )}

            {!loadingRequests && !requestsError && joinRequests.length === 0 && (
              <p className="details-empty">No pending join requests</p>
            )}

            {!loadingRequests && !requestsError && joinRequests.map((requestUser) => (
              <div key={requestUser._id} className="details-request-row">
                <div
                  className="details-member-avatar"
                  style={{ background: `linear-gradient(135deg, ${getAvatarColor(requestUser._id)}, ${getAvatarColor(requestUser._id + '_')}cc)` }}
                >
                  {getInitials(requestUser.username)}
                </div>
                <div className="details-member-info">
                  <span className="details-member-name">{requestUser.username}</span>
                  <span className="details-member-role">Pending join request</span>
                </div>
                <button
                  className="details-request-approve-btn"
                  onClick={() => handleApproveRequest(requestUser._id)}
                  disabled={approvingRequestId === requestUser._id}
                >
                  {approvingRequestId === requestUser._id ? 'Approving...' : 'Accept'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'media' && (
          <div className="details-media-grid">
            {mediaMessages.length === 0 && (
              <p className="details-empty">No images shared yet</p>
            )}
            {mediaMessages.flatMap((m, mi) =>
              m.attachments
                .filter(a => isImageUrl(a.url) || a.type === 'image')
                .map((a, ai) => (
                  <ImageAttachment key={`${mi}-${ai}`} attachment={a} />
                ))
            )}
          </div>
        )}

        {tab === 'files' && (
          <div className="details-files-list">
            {fileMessages.length === 0 && (
              <p className="details-empty">No files shared yet</p>
            )}
            {fileMessages.flatMap((m, mi) =>
              m.attachments
                .filter(a => !isImageUrl(a.url) && a.type !== 'image')
                .map((a, ai) => (
                  <div key={`${mi}-${ai}`} className="details-file-row">
                    <span className="details-file-icon">{getFileIcon(a.filename)}</span>
                    <div className="details-file-info">
                      <span className="details-file-name">{a.filename}</span>
                      <span className="details-file-meta">
                        {formatFileSize(a.size)} · {formatTime(m.createdAt)}
                      </span>
                    </div>
                    <a
                      className="details-file-dl"
                      href={resolveUrl(a.url)}
                      download={a.filename}
                      target="_blank"
                      rel="noreferrer"
                    >⬇</a>
                  </div>
                ))
            )}
          </div>
        )}
      </div>

      {/* ── Report dialog ───────────────────────────────────────── */}
      {showReport && (
        <ReportCommunityModal community={community} onClose={() => setShowReport(false)} />
      )}

      {/* ── Leave confirmation dialog ────────────────────────────── */}
      {showConfirm && (
        <div className="leave-confirm-overlay" onClick={() => !leaving && setShowConfirm(false)}>
          <div className="leave-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="leave-confirm-icon">↩</div>
            <h3 className="leave-confirm-title">Leave community?</h3>
            <p className="leave-confirm-body">
              You'll lose access to <strong>{community.communityName}</strong> and its messages.
              You can rejoin later if it's public.
            </p>
            {leaveErr && <p className="leave-confirm-err">{leaveErr}</p>}
            <div className="leave-confirm-actions">
              <button
                className="leave-confirm-cancel"
                onClick={() => setShowConfirm(false)}
                disabled={leaving}
              >
                Cancel
              </button>
              <button
                className="leave-confirm-ok"
                onClick={confirmLeave}
                disabled={leaving}
              >
                {leaving ? 'Leaving…' : 'Yes, leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────── */
export default function CommunityChat({ community, currentUser, onLeave, onCommunityUpdated }) {
  const communityId   = community._id;
  const communityName = community.communityName;
  const communityTag  = community.communityTag;
  const membersData   = community.membersData ?? [];

  const [messages,      setMessages]      = useState([]);
  const [inputText,     setInputText]     = useState('');
  const [replyingTo,    setReplyingTo]    = useState(null);
  const [showEmoji,     setShowEmoji]     = useState(false);
  const [showAttach,    setShowAttach]    = useState(false);
  const [typingUsers,   setTypingUsers]   = useState({});
  const [videoSession,  setVideoSession]  = useState(null);
  const [showDetails,   setShowDetails]   = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [attachAccept,  setAttachAccept]  = useState('');
  const [attachType,    setAttachType]    = useState('file');

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const socketRef      = useRef(null);
  const typingTimer    = useRef(null);
  const fileInputRef   = useRef(null);

  /* ── Socket setup ────────────────────────────────────────────── */
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join-community', {
      communityId,
      userId: currentUser._id,
      username: currentUser.username,
    });

    socket.on('message-history', (history) => setMessages(history));
    socket.on('new-message',     (msg)     => setMessages(prev => [...prev, msg]));

    socket.on('user-typing',      ({ userId, username }) =>
      setTypingUsers(prev => ({ ...prev, [userId]: username })));
    socket.on('user-stop-typing', ({ userId }) =>
      setTypingUsers(prev => { const n = { ...prev }; delete n[userId]; return n; }));

    socket.on('message-deleted', ({ messageId }) =>
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m)));

    return () => {
      socket.emit('leave-community', { communityId });
      socket.disconnect();
    };
  }, [communityId, currentUser._id, currentUser.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const closePopovers = useCallback(() => {
    setShowEmoji(false);
    setShowAttach(false);
  }, []);

  /* ── Typing ──────────────────────────────────────────────────── */
  const emitTyping = useCallback(() => {
    socketRef.current?.emit('typing', { communityId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { communityId });
    }, 2000);
  }, [communityId]);

  /* ── Send text ───────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const localMsg = {
      _id: `local-${Date.now()}`,
      senderId: { _id: currentUser._id, username: currentUser.username, role: 'member' },
      content: text,
      messageType: 'text',
      attachments: [],
      replyTo: replyingTo?._id ?? null,
      isEdited: false,
      isDeleted: false,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, localMsg]);
    socketRef.current?.emit('send-message', {
      communityId,
      content: text,
      messageType: 'text',
      replyTo: replyingTo?._id ?? null,
      attachments: [],
    });

    clearTimeout(typingTimer.current);
    socketRef.current?.emit('stop-typing', { communityId });
    setInputText('');
    setReplyingTo(null);
    closePopovers();
  }, [communityId, currentUser, inputText, replyingTo, closePopovers]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  /* ── File upload ─────────────────────────────────────────────── */
  const triggerFileInput = (accept, type) => {
    setAttachAccept(accept);
    setAttachType(type);
    setShowAttach(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const fileCategory = getFileCategory(file);
    if (attachType === 'file' && fileCategory !== 'file') {
      console.warn(`Blocked ${fileCategory} upload from file-only picker.`);
      return;
    }

    if (attachType !== 'file' && fileCategory !== attachType) {
      console.warn(`Blocked ${fileCategory || 'unknown'} upload from ${attachType} picker.`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res  = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Upload failed');

      const attachment = {
        url:      data.url,
        filename: data.filename,
        size:     data.size,
        mimeType: data.mimeType,
        type:     data.type,
      };

      const localMsg = {
        _id: `local-${Date.now()}`,
        senderId: { _id: currentUser._id, username: currentUser.username, role: 'member' },
        content: '',
        messageType: data.type,
        attachments: [attachment],
        replyTo: replyingTo?._id ?? null,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, localMsg]);
      socketRef.current?.emit('send-message', {
        communityId,
        content: '',
        messageType: data.type,
        replyTo: replyingTo?._id ?? null,
        attachments: [attachment],
      });
      setReplyingTo(null);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [attachType, communityId, currentUser, replyingTo]);

  const handleEmojiClick = useCallback((emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }, []);

  /* Group consecutive messages from the same sender */
  const groupedMessages = messages.reduce((groups, msg) => {
    const last = groups[groups.length - 1];
    if (last && last[0].senderId._id === msg.senderId._id) last.push(msg);
    else groups.push([msg]);
    return groups;
  }, []);

  const ATTACH_OPTIONS = [
    { icon: '🖼️', label: 'Image', accept: 'image/*', type: 'image' },
    { icon: '🎬', label: 'Video', accept: 'video/*', type: 'video' },
    { icon: '🎵', label: 'Audio', accept: 'audio/*', type: 'audio' },
    { icon: '📎', label: 'File',  accept: NON_MEDIA_FILE_ACCEPT, type: 'file' },
  ];

  return (
    <>
    <div className="chat-layout" onClick={closePopovers}>

      {/* ── Main Chat ───────────────────────────────────────────── */}
      <div className="chat-main">

        {/* Header */}
        <header className="chat-header">
          <div
            className="header-info clickable-header"
            onClick={e => { e.stopPropagation(); setShowDetails(v => !v); }}
            title="View community details"
          >
            <div className="header-community-name">
              # {communityTag}
              <span className="live-badge">LIVE</span>
            </div>
            <div className="header-subtitle">{communityName} · {messages.length} messages</div>
          </div>
          <div className="header-actions">
            <div className="online-pill">
              <span className="online-dot-small" />
              {membersData.length} members
            </div>
            {/* <button className="header-btn" title="Search">🔍</button> */}
            <button
              className="header-btn"
              title="Start video session"
              onClick={e => {
                e.stopPropagation();
                setVideoSession({ roomId: `community-${communityId}`, userId: currentUser._id, username: currentUser.username });
              }}
            >📹</button>
            <button
              className={`header-btn ${showDetails ? 'active' : ''}`}
              title="Community details"
              onClick={e => { e.stopPropagation(); setShowDetails(v => !v); }}
            >ℹ</button>
          </div>
        </header>

        {/* Messages */}
        <div className="messages-area">
          <div className="day-divider">
            <div className="day-divider-line" />
            <span className="day-divider-text">Today</span>
            <div className="day-divider-line" />
          </div>

          {groupedMessages.map((group) => {
            const isOwn = group[0].senderId._id === currentUser._id;
            return (
              <div className="message-group" key={group[0]._id}>
                {group.map((msg, idx) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    messages={messages}
                    isOwn={isOwn}
                    showAvatar={idx === group.length - 1}
                    showName={idx === 0}
                    onReply={setReplyingTo}
                  />
                ))}
              </div>
            );
          })}

          {Object.entries(typingUsers).map(([uid, uname]) => (
            <TypingIndicator key={uid} username={uname} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area" onClick={e => e.stopPropagation()}>
          {uploading && (
            <div className="upload-progress-bar">
              <div className="upload-progress-fill" />
              <span className="upload-progress-text">Uploading…</span>
            </div>
          )}

          {replyingTo && (
            <div className="reply-bar">
              <span className="reply-bar-icon">↩</span>
              <div className="reply-bar-info">
                <div className="reply-bar-author">Replying to {replyingTo.senderId.username}</div>
                <div className="reply-bar-text">
                  {replyingTo.messageType !== 'text'
                    ? `📎 ${replyingTo.attachments?.[0]?.filename}`
                    : replyingTo.content}
                </div>
              </div>
              <button className="reply-bar-close" onClick={() => setReplyingTo(null)}>✕</button>
            </div>
          )}

          <div className="input-row">
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder="Send a message…"
              value={inputText}
              onChange={e => { setInputText(e.target.value); emitTyping(); }}
              onKeyDown={handleKey}
              rows={1}
            />

            <div className="input-actions">
              {/* Emoji */}
              <div style={{ position: 'relative' }}>
                <button
                  className="input-icon-btn"
                  title="Emoji"
                  onClick={e => { e.stopPropagation(); setShowEmoji(v => !v); setShowAttach(false); }}
                >😊</button>
                {showEmoji && (
                  <div className="emoji-picker-wrap" onClick={e => e.stopPropagation()}>
                    <div className="emoji-grid">
                      {EMOJIS.map(em => (
                        <button key={em} className="emoji-btn-cell" onClick={() => handleEmojiClick(em)}>
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attach */}
              <div className="attach-wrapper">
                <button
                  className="input-icon-btn"
                  title="Attach file"
                  onClick={e => { e.stopPropagation(); setShowAttach(v => !v); setShowEmoji(false); }}
                >📎</button>
                {showAttach && (
                  <div className="attach-dropdown" onClick={e => e.stopPropagation()}>
                    {ATTACH_OPTIONS.map(opt => (
                      <button
                        key={opt.label}
                        className="attach-option"
                        onClick={() => triggerFileInput(opt.accept, opt.type)}
                      >
                        <span className="attach-option-icon">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={attachAccept}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />

              {/* Send */}
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!inputText.trim() || uploading}
                title="Send"
              >➤</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Community Details Panel ──────────────────────────────── */}
      {showDetails && (
        <CommunityDetailsPanel
          community={community}
          messages={messages}
          currentUser={currentUser}
          onClose={() => setShowDetails(false)}
          onLeave={() => { setShowDetails(false); onLeave?.(); }}
          onCommunityUpdated={onCommunityUpdated}
        />
      )}
    </div>

    {videoSession && (
      <VideoSession
        roomId={videoSession.roomId}
        userId={videoSession.userId}
        username={videoSession.username}
        onLeave={() => setVideoSession(null)}
      />
    )}
    </>
  );
}
