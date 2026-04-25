import { useState, useEffect, useCallback } from 'react';
import AppSidebar from '../components/AppSidebar/AppSidebar.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getTodos, getCompletedTodos, addTodo, editTodo, deleteTodo, toggleTodo, getJoinedCommunities, getPublicCommunities } from '../api/userApi.js';
import { joinCommunity } from '../api/communityApi.js';
import CreateCommunityModal from '../components/CreateCommunityModal/CreateCommunityModal.jsx';
import { useTimer, POMO_MODE_DEFS } from '../context/TimerContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Dashboard.css';

/* ── Date helpers ────────────────────────────────────────────────── */
const todayTs = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const dayTs   = (v)  => { const d = new Date(v); d.setHours(0, 0, 0, 0); return d.getTime(); };
const isTodayOrPast = (todo) => !!todo.dueDate && dayTs(todo.dueDate) <= todayTs();

const COMMUNITY_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
const communityColor = (id) => COMMUNITY_COLORS[(id?.charCodeAt(id.length - 1) ?? 0) % COMMUNITY_COLORS.length];

const MOCK_STREAK_WEEK = [true, true, true, false, true, true, true]; // Sun–Sat

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
  { icon: '◎', label: 'Focus',     path: '/focus'     },
  { icon: '⬡', label: 'Community', path: '/community' },
  { icon: '◈', label: 'Goals',     path: '/goals'     },
  { icon: '✦', label: 'Analytics', path: '/analytics' },
];


/* ── Helpers ─────────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');
const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const DAYS = ['S','M','T','W','T','F','S'];

/* ── Pomodoro Timer ──────────────────────────────────────────────── */
function PomodoroTimer() {
  const {
    modes, mode, modeIdx, total,
    customMins, draft, setDraft,
    showCustomize, setShowCustomize,
    running, setRunning,
    sessions, seconds,
    switchMode, reset, applyCustom,
  } = useTimer();

  const progress = seconds / total;
  const R        = 88;
  const CIRC     = 2 * Math.PI * R;

  return (
    <div className="pomo-card">
      <div className="pomo-header">
        <span className="pomo-title">Pomodoro Timer</span>
        <div className="pomo-header-right">
          <span className="pomo-sessions">{sessions} sessions today</span>
          <button
            className={`pomo-customize-btn ${showCustomize ? 'active' : ''}`}
            onClick={() => { setShowCustomize(v => !v); setDraft(customMins); }}
            title="Customize durations"
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Customize panel */}
      <AnimatePresence>
        {showCustomize && (
          <motion.div
            className="pomo-customize-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {POMO_MODE_DEFS.map(d => (
              <div key={d.key} className="pomo-customize-row">
                <span className="pomo-customize-label" style={{ color: d.color }}>{d.label}</span>
                <div className="pomo-customize-input-wrap">
                  <input
                    type="number"
                    className="pomo-customize-input"
                    value={draft[d.key]}
                    min={1} max={d.key === 'work' ? 120 : 60}
                    onChange={e => setDraft(prev => ({ ...prev, [d.key]: Number(e.target.value) }))}
                  />
                  <span className="pomo-customize-unit">min</span>
                </div>
              </div>
            ))}
            <button className="pomo-customize-save" onClick={applyCustom}>Apply</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mode tabs */}
      <div className="pomo-modes">
        {modes.map((m, i) => (
          <button
            key={m.key}
            className={`pomo-mode-btn ${modeIdx === i ? 'active' : ''}`}
            style={modeIdx === i ? { borderColor: m.color, color: m.color, background: `${m.color}18` } : {}}
            onClick={() => switchMode(i)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="pomo-ring-wrap">
        <svg className="pomo-ring" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r={R} className="pomo-ring-bg" />
          <circle
            cx="100" cy="100" r={R}
            className="pomo-ring-progress"
            style={{
              stroke: mode.color,
              strokeDasharray: CIRC,
              strokeDashoffset: CIRC * (1 - progress),
              filter: `drop-shadow(0 0 8px ${mode.color}88)`,
            }}
          />
        </svg>
        <div className="pomo-time-display">
          <span className="pomo-time">{pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}</span>
          <span className="pomo-mode-label" style={{ color: mode.color }}>{mode.label}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="pomo-controls">
        <button className="pomo-ctrl-btn" onClick={reset} title="Reset">↺</button>
        <motion.button
          className="pomo-play-btn"
          style={{ background: `linear-gradient(135deg, ${mode.color}cc, ${mode.color})` }}
          onClick={() => setRunning(r => !r)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {running ? '⏸' : '▶'}
        </motion.button>
        {(running || seconds !== total) && (
          <button className="pomo-ctrl-btn" onClick={reset} title="Stop">⏹</button>
        )}
      </div>

      {/* Session dots */}
      <div className="pomo-session-dots">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`pomo-dot ${i < sessions % 4 ? 'filled' : ''}`} />
        ))}
      </div>
    </div>
  );
}


/* ── Stats Row ───────────────────────────────────────────────────── */
function fmtFocus(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return '0m';
}

function StatsRow({ todos, completedTodos, streak, focusSeconds }) {
  const todayActive    = todos.filter(isTodayOrPast);
  const todayCompleted = completedTodos.filter(t => dayTs(t.createdAt) === todayTs());
  const otherCompleted = completedTodos.filter(t => dayTs(t.createdAt) !== todayTs());

  const progressDone  = todayCompleted.length + otherCompleted.length;
  const progressTotal = todayActive.length + todayCompleted.length + otherCompleted.length;

  const stats = [
    { icon: '⏱', val: fmtFocus(focusSeconds ?? 0),          label: 'Focus today',  color: '#8b5cf6' },
    { icon: '✅', val: `${progressDone} / ${progressTotal}`, label: 'Tasks done',   color: '#22c55e' },
    { icon: '🔥', val: String(streak),                       label: 'Day streak',   color: '#f59e0b' },
    { icon: '📈', val: '+12%',                               label: 'vs last week', color: '#ec4899' },
  ];

  return (
    <div className="stats-row-grid">
      {stats.map((s, i) => (
        <motion.div
          key={i}
          className="stat-mini-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          whileHover={{ y: -3 }}
        >
          <span className="stat-mini-icon" style={{ color: s.color }}>{s.icon}</span>
          <span className="stat-mini-val">{s.val}</span>
          <span className="stat-mini-label">{s.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Explore Communities Modal ───────────────────────────────────── */
function ExploreModal({ onClose, joinedIds, onJoined }) {
  const [communities, setCommunities] = useState([]);
  const [joining,     setJoining]     = useState(null);
  const [joined,      setJoined]      = useState(new Set(joinedIds));
  const [requested,   setRequested]   = useState(new Set());

  useEffect(() => {
    getPublicCommunities()
      .then(({ communities }) => setCommunities(communities))
      .catch(console.error);
  }, []);

  const handleJoin = async (c) => {
    setJoining(c._id);
    try {
      const response = await joinCommunity(c._id);
      const didRequest = response?.message?.toLowerCase().includes('request');
      if (didRequest) {
        setRequested(prev => new Set([...prev, c._id]));
      } else {
        setJoined(prev => new Set([...prev, c._id]));
        onJoined();
      }
    } catch (e) { console.error(e); }
    setJoining(null);
  };

  return (
    <motion.div
      className="explore-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="explore-modal"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="explore-modal-header">
          <div>
            <span className="explore-modal-title">Explore Communities</span>
            <span className="explore-modal-sub">{communities.length} public communities</span>
          </div>
          <button className="explore-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="explore-modal-list">
          {communities.length === 0 && (
            <div className="explore-empty">No public communities yet</div>
          )}
          {communities.map((c, i) => {
            const color    = communityColor(c._id);
            const isMember = joined.has(c._id);
            const isRequested = requested.has(c._id);
            const joinLabel = joining === c._id ? 'Requesting...' : isMember ? 'Joined' : isRequested ? 'Request Sent' : 'Join';
            return (
              <motion.div
                key={c._id}
                className="explore-community-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="community-avatar" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, color }}>
                  {getInitials(c.communityName)}
                </div>
                <div className="community-info" style={{ flex: 1 }}>
                  <span className="community-name">{c.communityName}</span>
                  <span className="community-tag">#{c.communityTag}</span>
                  {c.description && <span className="explore-community-desc">{c.description}</span>}
                </div>
                <div className="explore-community-right">
                  <span className="explore-member-count">{c.members?.length ?? 0} members</span>
                  <span className="explore-mode-badge">{c.membershipMode === 'open' ? 'Open' : 'Request'}</span>
                  <motion.button
                    className={`explore-join-btn ${isMember || isRequested ? 'joined' : ''}`}
                    disabled={isMember || isRequested || joining === c._id}
                    onClick={() => handleJoin(c)}
                    whileHover={!isMember && !isRequested ? { scale: 1.04 } : {}}
                    whileTap={!isMember && !isRequested ? { scale: 0.96 } : {}}
                  >
                    {joinLabel}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Communities Panel ───────────────────────────────────────────── */
function CommunitiesPanel({ navigate, communities, onExplore }) {
  const [showAll, setShowAll] = useState(false);
  const preview  = showAll ? communities : communities.slice(0, 3);

  return (
    <div className="dash-card communities-card">
      <div className="card-header">
        <span className="card-title">Your Communities</span>
        {communities.length > 3 && (
          <button className="card-action-btn" onClick={() => setShowAll(v => !v)}>
            {showAll ? 'Show less' : `View all (${communities.length}) →`}
          </button>
        )}
      </div>
      <div className="communities-list">
        {communities.length === 0 && (
          <div className="todo-empty">You haven't joined any communities yet</div>
        )}
        <AnimatePresence initial={false}>
          {preview.map((c, i) => {
            const color = communityColor(c._id);
            return (
              <motion.div
                key={c._id}
                className="community-row"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate('/community', { state: { communityId: c._id } })}
              >
                <div className="community-avatar" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, color }}>
                  {getInitials(c.communityName)}
                </div>
                <div className="community-info">
                  <span className="community-name">{c.communityName}</span>
                  <span className="community-tag">#{c.communityTag}</span>
                </div>
                <div className="community-stats">
                  <span className="community-online">
                    <span className="online-dot" />
                    {c.members?.length ?? 0}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      <motion.button
        className="explore-communities-btn"
        onClick={onExplore}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <span>⬡</span> Explore Communities
      </motion.button>
    </div>
  );
}

/* ── Todo Widget ─────────────────────────────────────────────────── */
function TaskCompletePopup({ onClose }) {
  const popperColors = ['#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#38bdf8', '#f97316'];

  return (
    <motion.div
      className="task-complete-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="task-complete-popup"
        initial={{ opacity: 0, scale: 0.88, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="task-complete-close" onClick={onClose} aria-label="Close celebration">
          x
        </button>
        <div className="task-complete-poppers" aria-hidden="true">
          {popperColors.map((color, index) => (
            <span
              key={`${color}-${index}`}
              className="task-complete-confetti"
              style={{
                '--confetti-color': color,
                '--confetti-x': `${(index - 2.5) * 22}px`,
                '--confetti-rotate': `${index % 2 === 0 ? '-' : ''}${18 + index * 6}deg`,
                '--confetti-delay': `${index * 0.04}s`,
              }}
            />
          ))}
          <span className="task-complete-popper task-complete-popper-left" />
          <span className="task-complete-popper task-complete-popper-right" />
        </div>
        <div className="task-complete-badge">Task Complete</div>
        <h3 className="task-complete-title">Yay!, you completed a task</h3>
      </motion.div>
    </motion.div>
  );
}

const BLANK_FORM = { title: '', description: '', dueDate: '', originalDueDate: '' };

function sortTodos(list) {
  return [...list].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });
}

function TodoWidget({ todos, setTodos, completedTodos, setCompletedTodos, onComplete, onTaskCelebration }) {
  const [tab,       setTab]       = useState('today');
  const [showForm,  setShowForm]  = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [saving,    setSaving]    = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const today = todayTs();

  // Active todos that belong to "today" (today or past-due)
  const todayActive    = todos.filter(isTodayOrPast).map(t => ({ ...t, isCompleted: false }));
  // Completed todos completed today
  const todayCompleted = completedTodos
    .filter(t => dayTs(t.createdAt) === today)
    .map(t => ({ ...t, isCompleted: true }));
  // All active + completed merged with isCompleted flag
  const allActive    = todos.map(t => ({ ...t, isCompleted: false }));
  const allCompleted = completedTodos.map(t => ({ ...t, isCompleted: true }));

  // Progress: today active total + any completed todos (today or others) done today or in other tabs
  const otherCompleted    = completedTodos.filter(t => dayTs(t.createdAt) !== today);
  const progressDone      = todayCompleted.length + otherCompleted.length;
  const progressTotal     = todayActive.length + progressDone;

  const displayList = sortTodos(
    tab === 'today'     ? [...todayActive, ...todayCompleted] :
    tab === 'all'       ? [...allActive, ...allCompleted] :
    /* completed tab */   allCompleted
  );

  const openAdd = () => { setEditingId(null); setForm(BLANK_FORM); setShowForm(true); };
  const openEdit = (todo) => {
    if (todo.isCompleted) return; // can't edit completed todos
    setEditingId(todo._id);
    const dueDateStr = todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '';
    setForm({ title: todo.title, description: todo.description || '', dueDate: dueDateStr, originalDueDate: dueDateStr });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(BLANK_FORM); };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const dueDateChanged = form.dueDate !== form.originalDueDate;
      const body = {
        title: form.title.trim(),
        ...(form.description.trim() && { description: form.description.trim() }),
        ...(form.dueDate && (dueDateChanged || !editingId) && { dueDate: `${form.dueDate}T23:59:00` }),
      };
      if (editingId) {
        await editTodo(editingId, body);
        setTodos(prev => prev.map(t => t._id === editingId
          ? { ...t, ...body, dueDate: form.dueDate ? new Date(form.dueDate) : undefined }
          : t));
      } else {
        await addTodo(body);
        const { data } = await getTodos();
        setTodos(data);
      }
      closeForm();
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleToggle = async (todo) => {
    try {
      await toggleTodo(todo._id);
      if (!todo.isCompleted) {
        // Active → Completed: remove from todos, add to completedTodos
        setTodos(prev => prev.filter(t => t._id !== todo._id));
        setCompletedTodos(prev => [{ ...todo, isCompleted: true, createdAt: new Date().toISOString() }, ...prev]);
        onTaskCelebration?.();
        await onComplete(); // await so streak card re-renders with fresh DB value
      } else {
        // Completed → Active: remove from completedTodos, add to todos
        setCompletedTodos(prev => prev.filter(t => t._id !== todo._id));
        setTodos(prev => [{ ...todo, isCompleted: false }, ...prev]);
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (todoId, isCompleted) => {
    try {
      await deleteTodo(todoId);
      if (isCompleted) setCompletedTodos(prev => prev.filter(t => t._id !== todoId));
      else             setTodos(prev => prev.filter(t => t._id !== todoId));
    } catch (e) { console.error(e); }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const emptyMsg = tab === 'today' ? 'No tasks for today' : tab === 'all' ? 'No tasks yet' : 'No completed tasks';

  return (
    <div className="dash-card todo-card">
      <div className="card-header">
        <div className="todo-tabs">
          <button className={`todo-tab ${tab === 'today'     ? 'active' : ''}`} onClick={() => setTab('today')}>Today</button>
          <button className={`todo-tab ${tab === 'all'       ? 'active' : ''}`} onClick={() => setTab('all')}>All</button>
          <button className={`todo-tab ${tab === 'completed' ? 'active' : ''}`} onClick={() => setTab('completed')}>Done</button>
        </div>
        <div className="todo-header-right">
          <span className="todo-progress">{progressDone}/{progressTotal}</span>
          {tab !== 'completed' && !collapsed && (
            <button className="todo-add-icon-btn" onClick={showForm && !editingId ? closeForm : openAdd}>
              <span>{showForm && !editingId ? '✕' : '+'}</span>
            </button>
          )}
          <button className="todo-collapse-btn" onClick={() => { setCollapsed(v => !v); setShowForm(false); }} title={collapsed ? 'Expand' : 'Collapse'}>
            {collapsed ? '▾' : '▴'}
          </button>
        </div>
      </div>

      <div className="todo-progress-bar-wrap">
        <div className="todo-progress-bar" style={{ width: progressTotal ? `${(progressDone / progressTotal) * 100}%` : '0%' }} />
      </div>

      <AnimatePresence>
        {!collapsed && showForm && tab !== 'completed' && (
          <motion.div
            className="todo-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              className="todo-input"
              placeholder="Task title *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <textarea
              className="todo-input todo-textarea"
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
            />
            <div className="todo-form-row">
              <input
                type="date"
                className="todo-input todo-date-input"
                value={form.dueDate}
                min={todayStr}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              />
              <button className="todo-save-btn" onClick={handleSave} disabled={saving || !form.title.trim()}>
                {saving ? '…' : editingId ? 'Save' : 'Add'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!collapsed && <div className="todo-list">
        <AnimatePresence>
          {displayList.length === 0 && (
            <div className="todo-empty">{emptyMsg}</div>
          )}
          {displayList.map(t => {
            const due    = t.dueDate ? new Date(t.dueDate) : null;
            const dueTs  = due ? dayTs(due) : null;
            const isPast = dueTs !== null && dueTs < today;
            return (
              <motion.div
                key={t._id}
                className={`todo-item ${t.isCompleted ? 'done' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                layout
              >
                <button className={`todo-check ${t.isCompleted ? 'checked' : ''}`} onClick={() => handleToggle(t)}>
                  {t.isCompleted && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </button>
                <div className="todo-content">
                  <span className="todo-title">{t.title}</span>
                  {due && (
                    <span className={`todo-due ${isPast && !t.isCompleted ? 'overdue' : ''}`}>
                      {isPast && !t.isCompleted ? '⚠ ' : '📅 '}
                      {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="todo-actions">
                  {!t.isCompleted && (
                    <button className="todo-action-btn" onClick={() => openEdit(t)} title="Edit">✎</button>
                  )}
                  <button className="todo-action-btn todo-action-delete" onClick={() => handleDelete(t._id, t.isCompleted)} title="Delete">✕</button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>}
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate  = useNavigate();
  const { logout } = useAuth();
  const { focusSeconds } = useTimer();

  const handleLogout = async () => {
    try {
      const BASE = import.meta.env.VITE_BACKEND_URL;
      await fetch(`${BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };
  const [user,           setUser]           = useState(null);
  const [todos,          setTodos]          = useState([]);
  const [completedTodos, setCompletedTodos] = useState([]);
  const [communities,    setCommunities]    = useState([]);
  const [showExplore,    setShowExplore]    = useState(false);
  const [showCreate,     setShowCreate]     = useState(false);
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [showTaskCompletePopup, setShowTaskCompletePopup] = useState(false);

  const fetchUser           = useCallback(() => getUserProfile().then(({ userMetadata }) => setUser(userMetadata)).catch(console.error), []);
  const fetchTodos          = useCallback(() => getTodos().then(({ data }) => setTodos(data)).catch(console.error), []);
  const fetchCompletedTodos = useCallback(() => getCompletedTodos().then(({ data }) => setCompletedTodos(data)).catch(console.error), []);
  const fetchCommunities    = useCallback(() => getJoinedCommunities().then(({ communities }) => setCommunities(communities)).catch(console.error), []);

  useEffect(() => { fetchUser(); fetchTodos(); fetchCompletedTodos(); fetchCommunities(); }, [fetchUser, fetchTodos, fetchCompletedTodos, fetchCommunities]);
  useEffect(() => {
    if (!showTaskCompletePopup) return undefined;
    const timeoutId = window.setTimeout(() => setShowTaskCompletePopup(false), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [showTaskCompletePopup]);

  return (
    <div className="dash-root">
      {/* background orbs */}
      <div className="dash-orb dash-orb-1" />
      <div className="dash-orb dash-orb-2" />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <AppSidebar
        onExplore={() => { setShowExplore(true); setSidebarOpen(false); }}
        onCreate={() => { setShowCreate(true); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="dash-main">

        {/* Top bar */}
        <header className="dash-topbar">
          <button className="dash-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <div className="dash-topbar-left">
            <h1 className="dash-greeting">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},
              <em> {user?.profile?.fullName || user?.userId?.username || '…'}</em> 👋
            </h1>
            <p className="dash-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-logout-btn" onClick={handleLogout}>Log Out</button>
          </div>
        </header>

        {/* Stats */}
        <StatsRow todos={todos} completedTodos={completedTodos} streak={user?.streakCount ?? 0} focusSeconds={focusSeconds} />

        {/* Main grid */}
        <div className="dash-grid">

          {/* Left column */}
          <div className="dash-col-right">
            <TodoWidget
              todos={todos}
              setTodos={setTodos}
              completedTodos={completedTodos}
              setCompletedTodos={setCompletedTodos}
              onComplete={fetchUser}
              onTaskCelebration={() => setShowTaskCompletePopup(true)}
            />
            <CommunitiesPanel navigate={navigate} communities={communities} onExplore={() => setShowExplore(true)} />
          </div>

          {/* Right column */}
          <div className="dash-col-left">
            <PomodoroTimer />
          </div>

        </div>
      </main>

      {/* ── Explore Communities Modal ────────────────────────────── */}
      <AnimatePresence>
        {showExplore && (
          <ExploreModal
            onClose={() => setShowExplore(false)}
            joinedIds={communities.map(c => c._id)}
            onJoined={fetchCommunities}
          />
        )}
        {showCreate && (
          <CreateCommunityModal
            onClose={() => setShowCreate(false)}
            onCreated={fetchCommunities}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTaskCompletePopup && (
          <TaskCompletePopup onClose={() => setShowTaskCompletePopup(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}


