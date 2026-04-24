import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import './CommunityChat.css';
import VideoSession from '../VideoSession/VideoSession.jsx';

/* ── Session identity (replace with real auth later) ─────────────── */
const SOCKET_URL     = 'http://localhost:3000';
const COMMUNITY_ID   = 'lumora-design-community';   // swap for real ObjectId later
const CURRENT_USER_ID = 'currentUser';
const CURRENT_USERNAME = 'You';

const MOCK_MEMBERS = [
  { _id: 'user1',       username: 'Alex Rivera', online: true,  role: 'admin'     },
  { _id: 'user2',       username: 'Maya Chen',   online: true,  role: 'moderator' },
  { _id: 'user3',       username: 'Jordan Lee',  online: false, role: 'member'    },
  { _id: 'user4',       username: 'Sam Torres',  online: true,  role: 'member'    },
  { _id: 'user5',       username: 'Riley Park',  online: false, role: 'member'    },
  { _id: CURRENT_USER_ID, username: 'You',       online: true,  role: 'member'    },
];


const EMOJIS = ['😀','😂','🥰','😎','🤔','😮','👍','👎','❤️','🔥','✨','🎉',
                 '🙌','💯','🚀','🎨','💡','⚡','🌟','😊','🤣','😜','🥳','🤩',
                 '👀','💪','🙏','✅','❌','💎','🎯','🌈'];

/* ── Helpers ─────────────────────────────────────────────────────── */
const getInitials = (name) =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_COLORS = [
  '#7c3aed','#2563eb','#059669','#dc2626','#d97706',
  '#0891b2','#9333ea','#16a34a','#ea580c','#db2777',
];
const getAvatarColor = (userId) => {
  let hash = 0;
  for (const c of userId) hash = (hash * 31 + c.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatFileSize = (bytes) => {
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
          {replied.messageType === 'file'
            ? `📎 ${replied.attachments[0]?.filename || 'Attachment'}`
            : replied.content}
        </div>
      </div>
    </div>
  );
};

const AttachmentCard = ({ attachment }) => (
  <a className="attachment-card" href={attachment.url} onClick={e => e.preventDefault()}>
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
          <ReplyPreview
            replyToId={message.replyTo}
            messages={messages}
            onClick={() => {}}
          />
        )}
        {message.content && <div className="bubble-text">{message.content}</div>}
        {message.attachments?.map((att, i) => (
          <AttachmentCard key={i} attachment={att} />
        ))}
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
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
    <span className="typing-name">{username} is typing…</span>
  </div>
);

/* ── Main Component ──────────────────────────────────────────────── */
export default function CommunityChat() {
  const [messages, setMessages]         = useState([]);
  const [inputText, setInputText]       = useState('');
  const [replyingTo, setReplyingTo]     = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [showEmoji, setShowEmoji]       = useState(false);
  const [showAttach, setShowAttach]     = useState(false);
  const [typingUsers, setTypingUsers]   = useState({});  // userId -> username
  const [videoSession, setVideoSession] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const socketRef      = useRef(null);
  const typingTimer    = useRef(null);

  const onlineCount = MOCK_MEMBERS.filter(m => m.online).length;

  /* ── Socket setup ────────────────────────────────────────────── */
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join-community', {
      communityId: COMMUNITY_ID,
      userId: CURRENT_USER_ID,
      username: CURRENT_USERNAME,
    });

    socket.on('message-history', (history) => {
      setMessages(history);
    });

    socket.on('new-message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('user-typing', ({ userId, username }) => {
      setTypingUsers(prev => ({ ...prev, [userId]: username }));
    });

    socket.on('user-stop-typing', ({ userId }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev =>
        prev.map(m => m._id === messageId ? { ...m, isDeleted: true, content: '' } : m)
      );
    });

    return () => {
      socket.emit('leave-community', { communityId: COMMUNITY_ID });
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const closePopovers = useCallback(() => {
    setShowEmoji(false);
    setShowAttach(false);
  }, []);

  /* ── Typing indicator emission ───────────────────────────────── */
  const emitTyping = useCallback(() => {
    socketRef.current?.emit('typing', { communityId: COMMUNITY_ID });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit('stop-typing', { communityId: COMMUNITY_ID });
    }, 2000);
  }, []);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const localMsg = {
      _id: `local-${Date.now()}`,
      senderId: { _id: CURRENT_USER_ID, username: CURRENT_USERNAME, role: 'member' },
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
      communityId: COMMUNITY_ID,
      content: text,
      messageType: 'text',
      replyTo: replyingTo?._id ?? null,
    });

    clearTimeout(typingTimer.current);
    socketRef.current?.emit('stop-typing', { communityId: COMMUNITY_ID });
    setInputText('');
    setReplyingTo(null);
    closePopovers();
  }, [inputText, replyingTo, closePopovers]);

  const handleKey = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleEmojiClick = useCallback((emoji) => {
    setInputText(prev => prev + emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  }, []);

  /* Group consecutive messages from the same sender */
  const groupedMessages = messages.reduce((groups, msg) => {
    const last = groups[groups.length - 1];
    if (last && last[0].senderId._id === msg.senderId._id) {
      last.push(msg);
    } else {
      groups.push([msg]);
    }
    return groups;
  }, []);

  const ATTACH_OPTIONS = [
    { icon: '🖼️', label: 'Image' },
    { icon: '🎬', label: 'Video' },
    { icon: '📎', label: 'File'  },
    { icon: '🎵', label: 'Audio' },
  ];

  return (
    <>
    <div className="chat-layout" onClick={closePopovers}>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">Community</div>
          <div className="community-info">
            <div className="community-avatar">L</div>
            <div>
              <div className="community-name">Lumora Design</div>
              <div className="community-tag">#design-general</div>
            </div>
          </div>
        </div>
        <div className="sidebar-members">
          <div className="members-section-label">Online — {onlineCount}</div>
          {MOCK_MEMBERS.filter(m => m.online).map((m, i) => (
            <div
              className="member-item"
              key={m._id}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className="member-avatar"
                style={{ background: `linear-gradient(135deg, ${getAvatarColor(m._id)}, ${getAvatarColor(m._id + '_')}cc)` }}
              >
                {getInitials(m.username)}
                <span className="member-status-dot online" />
              </div>
              <div className="member-info">
                <div className="member-name">{m.username}</div>
                <div className="member-role">{m.role}</div>
              </div>
              {(m.role === 'admin' || m.role === 'moderator') && (
                <span className={`role-badge ${m.role}`}>{m.role}</span>
              )}
            </div>
          ))}

          <div className="members-section-label" style={{ marginTop: 12 }}>
            Offline — {MOCK_MEMBERS.filter(m => !m.online).length}
          </div>
          {MOCK_MEMBERS.filter(m => !m.online).map((m, i) => (
            <div
              className="member-item"
              key={m._id}
              style={{ animationDelay: `${i * 0.05 + 0.15}s`, opacity: 0.6 }}
            >
              <div
                className="member-avatar"
                style={{ background: `linear-gradient(135deg, ${getAvatarColor(m._id)}80, ${getAvatarColor(m._id + '_')}50)` }}
              >
                {getInitials(m.username)}
                <span className="member-status-dot offline" />
              </div>
              <div className="member-info">
                <div className="member-name">{m.username}</div>
                <div className="member-role">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main Chat ───────────────────────────────────────────── */}
      <div className="chat-main">

        {/* Header */}
        <header className="chat-header">
          <button
            className="header-toggle-btn"
            onClick={e => { e.stopPropagation(); setSidebarOpen(o => !o); }}
            title="Toggle members"
          >
            ☰
          </button>
          <div className="header-info">
            <div className="header-community-name">
              # design-general
              <span className="live-badge">LIVE</span>
            </div>
            <div className="header-subtitle">Lumora Design Community · {messages.length} messages</div>
          </div>
          <div className="header-actions">
            <div className="online-pill">
              <span className="online-dot-small" />
              {onlineCount} online
            </div>
            <button className="header-btn" title="Search">🔍</button>
            <button
              className="header-btn"
              title="Start silent video session"
              onClick={e => {
                e.stopPropagation();
                setVideoSession({
                  roomId: 'community-lumora-design',
                  userId: CURRENT_USER_ID,
                  username: 'You',
                });
              }}
            >📹</button>
            <button className="header-btn" title="Pinned messages">📌</button>
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
            const isOwn = group[0].senderId._id === CURRENT_USER_ID;
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
          {replyingTo && (
            <div className="reply-bar">
              <span className="reply-bar-icon">↩</span>
              <div className="reply-bar-info">
                <div className="reply-bar-author">Replying to {replyingTo.senderId.username}</div>
                <div className="reply-bar-text">
                  {replyingTo.messageType === 'file'
                    ? `📎 ${replyingTo.attachments[0]?.filename}`
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
                >
                  😊
                </button>
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
                  title="Attach"
                  onClick={e => { e.stopPropagation(); setShowAttach(v => !v); setShowEmoji(false); }}
                >
                  📎
                </button>
                {showAttach && (
                  <div className="attach-dropdown" onClick={e => e.stopPropagation()}>
                    {ATTACH_OPTIONS.map(opt => (
                      <button key={opt.label} className="attach-option" onClick={() => setShowAttach(false)}>
                        <span className="attach-option-icon">{opt.icon}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send */}
              <button
                className="send-btn"
                onClick={handleSend}
                disabled={!inputText.trim()}
                title="Send"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
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
