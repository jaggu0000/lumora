import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import './AICoach.css';

const API_BASE = 'http://localhost:3000/api';

const SUGGESTIONS = [
  "Help me plan a 2-hour focus session",
  "I keep getting distracted — what should I do?",
  "Break down my task into small steps",
  "Suggest a Pomodoro schedule for today",
];

/* ── Robot SVG icon ──────────────────────────────────────────────── */
function RobotIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="9" y="12" width="14" height="11" rx="3" fill="currentColor" opacity="0.9"/>
      <rect x="12" y="15" width="3" height="3" rx="1" fill="#080812"/>
      <rect x="17" y="15" width="3" height="3" rx="1" fill="#080812"/>
      <rect x="14" y="20" width="4" height="1.5" rx="0.75" fill="#080812"/>
      <rect x="14" y="8" width="4" height="4" rx="1" fill="currentColor" opacity="0.9"/>
      <rect x="15.5" y="6" width="1" height="2.5" rx="0.5" fill="currentColor" opacity="0.7"/>
      <circle cx="16" cy="5.5" r="1.2" fill="currentColor" opacity="0.6"/>
      <rect x="5" y="14" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.7"/>
      <rect x="24" y="14" width="3" height="5" rx="1.5" fill="currentColor" opacity="0.7"/>
      <rect x="12" y="23" width="3" height="3" rx="1" fill="currentColor" opacity="0.7"/>
      <rect x="17" y="23" width="3" height="3" rx="1" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

/* ── Message bubble ──────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      className={`ai-msg ${isUser ? 'user' : 'assistant'}`}
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
    >
      {!isUser && (
        <div className="ai-msg-avatar">
          <RobotIcon size={14} />
        </div>
      )}
      <div className="ai-msg-bubble">
        {msg.content}
        {msg.streaming && <span className="ai-cursor" />}
      </div>
    </motion.div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */
export default function AICoach() {
  const { user } = useAuth();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const draggedRef              = useRef(false);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 320);
  }, [open]);

  /* ── Send message ─────────────────────────────────────────────── */
  const send = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    const streamId = `stream-${Date.now()}`;
    setMessages(prev => [...prev, { id: streamId, role: 'assistant', content: '', streaming: true }]);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error('AI error');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const { content: delta } = JSON.parse(data);
            if (delta) {
              full += delta;
              setMessages(prev => prev.map(m =>
                m.id === streamId ? { ...m, content: full } : m
              ));
            }
          } catch { /* skip */ }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === streamId ? { ...m, content: full, streaming: false } : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamId
          ? { ...m, content: "Sorry, I couldn't reach the server. Try again.", streaming: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const clearChat = () => setMessages([]);

  if (!user) return null;

  return (
    <>
      {/* ── Floating button ───────────────────────────────────────── */}
      <motion.div
        className={`ai-fab ${open ? 'open' : ''}`}
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => { draggedRef.current = true; }}
        onClick={() => { if (draggedRef.current) { draggedRef.current = false; return; } setOpen(v => !v); }}
        whileDrag={{ scale: 1.08 }}
        style={{ cursor: 'grab' }}
        title="Luma — AI Focus Coach"
      >
        <div className="ai-fab-glow" />
        <div className="ai-fab-inner">
          <RobotIcon size={26} />
        </div>
        <AnimatePresence>
          {!open && (
            <motion.span
              className="ai-fab-pulse"
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.7, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Side panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="ai-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.aside
              className="ai-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              {/* Panel header */}
              <div className="ai-panel-header">
                <div className="ai-panel-title">
                  <div className="ai-panel-avatar">
                    <RobotIcon size={18} />
                  </div>
                  <div>
                    <span className="ai-panel-name">Luma</span>
                    <span className="ai-panel-subtitle">AI Focus Coach</span>
                  </div>
                </div>
                <div className="ai-panel-actions">
                  {messages.length > 0 && (
                    <button className="ai-header-btn" onClick={clearChat} title="Clear chat">↺</button>
                  )}
                  <button className="ai-header-btn" onClick={() => setOpen(false)} title="Close">✕</button>
                </div>
              </div>

              {/* Messages area */}
              <div className="ai-messages">
                {messages.length === 0 ? (
                  <div className="ai-welcome">
                    <motion.div
                      className="ai-welcome-icon"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <RobotIcon size={40} />
                    </motion.div>
                    <h3 className="ai-welcome-title">Hey, I'm Luma!</h3>
                    <p className="ai-welcome-desc">Your personal focus coach. Ask me anything about productivity, deep work, or planning your day.</p>

                    <div className="ai-suggestions">
                      {SUGGESTIONS.map((s, i) => (
                        <motion.button
                          key={i}
                          className="ai-suggestion-btn"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          onClick={() => send(s)}
                        >
                          {s}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, i) => <MessageBubble key={msg.id || i} msg={msg} />)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="ai-input-area">
                <div className="ai-input-wrap">
                  <textarea
                    ref={inputRef}
                    className="ai-input"
                    placeholder="Ask Luma anything…"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                    disabled={loading}
                  />
                  <motion.button
                    className="ai-send-btn"
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <svg className="ai-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                        <path d="M12 3a9 9 0 019 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </motion.button>
                </div>
                <p className="ai-input-hint">Enter to send · Shift+Enter for new line</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
