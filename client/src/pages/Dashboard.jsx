import { useState, useEffect, useRef, useCallback } from 'react';
import AICoach from '../components/AICoach/AICoach.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../api/userApi.js';
import './Dashboard.css';

const MOCK_COMMUNITIES = [
  { _id: '1', communityName: 'Lumora Design',    communityTag: 'design',   members: 142, online: 8,  lastMsg: '2m ago',  color: '#8b5cf6' },
  { _id: '2', communityName: 'Deep Work Club',   communityTag: 'deepwork', members: 89,  online: 12, lastMsg: '15m ago', color: '#ec4899' },
  { _id: '3', communityName: 'Builders Hub',     communityTag: 'builders', members: 230, online: 5,  lastMsg: '1h ago',  color: '#06b6d4' },
  { _id: '4', communityName: 'Study Together',   communityTag: 'study',    members: 67,  online: 3,  lastMsg: '3h ago',  color: '#22c55e' },
];

const MOCK_STREAK_WEEK = [true, true, true, false, true, true, true]; // Sun–Sat
const MOCK_TODOS = [
  { _id: 't1', title: 'Review design mockups',     done: true  },
  { _id: 't2', title: 'Complete backend API docs',  done: false },
  { _id: 't3', title: 'Write weekly report',        done: false },
  { _id: 't4', title: 'Push community feature',     done: true  },
  { _id: 't5', title: 'Team sync at 4pm',           done: false },
];

const NAV_ITEMS = [
  { icon: '⊞', label: 'Dashboard', path: '/dashboard' },
  { icon: '◎', label: 'Focus',     path: '/focus'     },
  { icon: '⬡', label: 'Community', path: '/community' },
  { icon: '◈', label: 'Goals',     path: '/goals'     },
  { icon: '✦', label: 'Analytics', path: '/analytics' },
];

const POMO_MODES = [
  { key: 'work',       label: 'Focus',      mins: 25, color: '#8b5cf6' },
  { key: 'short',      label: 'Short Break', mins: 5,  color: '#22c55e' },
  { key: 'long',       label: 'Long Break',  mins: 15, color: '#06b6d4' },
];

/* ── Helpers ─────────────────────────────────────────────────────── */
const pad = (n) => String(n).padStart(2, '0');
const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const DAYS = ['S','M','T','W','T','F','S'];

/* ── Pomodoro Timer ──────────────────────────────────────────────── */
function PomodoroTimer() {
  const [modeIdx, setModeIdx]     = useState(0);
  const [seconds, setSeconds]     = useState(POMO_MODES[0].mins * 60);
  const [running, setRunning]     = useState(false);
  const [sessions, setSessions]   = useState(0);
  const intervalRef               = useRef(null);
  const mode                      = POMO_MODES[modeIdx];
  const total                     = mode.mins * 60;
  const progress                  = seconds / total;
  const R                         = 88;
  const CIRC                      = 2 * Math.PI * R;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode.key === 'work') setSessions(n => n + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode.key]);

  const switchMode = (idx) => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setModeIdx(idx);
    setSeconds(POMO_MODES[idx].mins * 60);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setSeconds(mode.mins * 60);
  };

  return (
    <div className="pomo-card">
      <div className="pomo-header">
        <span className="pomo-title">Pomodoro Timer</span>
        <span className="pomo-sessions">{sessions} sessions today</span>
      </div>

      {/* Mode tabs */}
      <div className="pomo-modes">
        {POMO_MODES.map((m, i) => (
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
        <button className="pomo-ctrl-btn" onClick={() => switchMode((modeIdx + 1) % 3)} title="Skip">⏭</button>
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

/* ── Streak Card ─────────────────────────────────────────────────── */
function StreakCard({ streak = 0, longest = 0 }) {
  const today = new Date().getDay();

  return (
    <div className="dash-card streak-card">
      <div className="card-header">
        <span className="card-title">Streak</span>
        <span className="streak-fire">🔥</span>
      </div>

      <div className="streak-number-row">
        <span className="streak-number">{streak}</span>
        <div className="streak-meta">
          <span className="streak-label">day streak</span>
          <span className="streak-best">Best: {longest} days</span>
        </div>
      </div>

      <div className="streak-week">
        {DAYS.map((d, i) => (
          <div key={i} className="streak-day-col">
            <div className={`streak-day-dot ${MOCK_STREAK_WEEK[i] ? 'active' : ''} ${i === today ? 'today' : ''}`} />
            <span className="streak-day-label">{d}</span>
          </div>
        ))}
      </div>

      <div className="streak-bar-wrap">
        <div className="streak-bar" style={{ width: `${(streak / longest) * 100}%` }} />
        <span className="streak-bar-label">{streak}/{longest} personal best</span>
      </div>
    </div>
  );
}

/* ── Stats Row ───────────────────────────────────────────────────── */
function StatsRow() {
  const stats = [
    { icon: '⏱', val: '4h 20m', label: 'Focus today',   color: '#8b5cf6' },
    { icon: '✅', val: '2 / 5',  label: 'Tasks done',    color: '#22c55e' },
    { icon: '⬡',  val: '4',      label: 'Communities',   color: '#06b6d4' },
    { icon: '📈', val: '+12%',   label: 'vs last week',  color: '#ec4899' },
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

/* ── Communities Panel ───────────────────────────────────────────── */
function CommunitiesPanel({ navigate }) {
  return (
    <div className="dash-card communities-card">
      <div className="card-header">
        <span className="card-title">Your Communities</span>
        <button className="card-action-btn" onClick={() => navigate('/community')}>View all →</button>
      </div>
      <div className="communities-list">
        {MOCK_COMMUNITIES.map((c, i) => (
          <motion.div
            key={c._id}
            className="community-row"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ x: 4 }}
            onClick={() => navigate('/community')}
          >
            <div className="community-avatar" style={{ background: `linear-gradient(135deg, ${c.color}cc, ${c.color}66)`, color: c.color }}>
              {getInitials(c.communityName)}
            </div>
            <div className="community-info">
              <span className="community-name">{c.communityName}</span>
              <span className="community-tag">#{c.communityTag}</span>
            </div>
            <div className="community-stats">
              <span className="community-online">
                <span className="online-dot" />
                {c.online}
              </span>
              <span className="community-time">{c.lastMsg}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Todo Widget ─────────────────────────────────────────────────── */
function TodoWidget() {
  const [todos, setTodos] = useState(MOCK_TODOS);
  const [input, setInput] = useState('');

  const toggle = (id) => setTodos(prev => prev.map(t => t._id === id ? { ...t, done: !t.done } : t));
  const add = () => {
    if (!input.trim()) return;
    setTodos(prev => [...prev, { _id: `t${Date.now()}`, title: input.trim(), done: false }]);
    setInput('');
  };

  const done  = todos.filter(t => t.done).length;
  const total = todos.length;

  return (
    <div className="dash-card todo-card">
      <div className="card-header">
        <span className="card-title">Today's Tasks</span>
        <span className="todo-progress">{done}/{total}</span>
      </div>

      <div className="todo-progress-bar-wrap">
        <div className="todo-progress-bar" style={{ width: total ? `${(done / total) * 100}%` : '0%' }} />
      </div>

      <div className="todo-list">
        <AnimatePresence>
          {todos.map(t => (
            <motion.div
              key={t._id}
              className={`todo-item ${t.done ? 'done' : ''}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              layout
            >
              <button className={`todo-check ${t.done ? 'checked' : ''}`} onClick={() => toggle(t._id)}>
                {t.done && <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </button>
              <span className="todo-title">{t.title}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="todo-input-row">
        <input
          className="todo-input"
          placeholder="Add a task…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button className="todo-add-btn" onClick={add}>+</button>
      </div>
    </div>
  );
}

/* ── Main Dashboard ──────────────────────────────────────────────── */
export default function Dashboard() {
  const navigate  = useNavigate();
  const [active, setActive] = useState('/dashboard');
  const [user, setUser]     = useState(null);

  useEffect(() => {
    getUserProfile()
      .then(({ userMetadata }) => setUser(userMetadata))
      .catch(console.error);
  }, []);

  return (
    <div className="dash-root">
      <AICoach />
      {/* background orbs */}
      <div className="dash-orb dash-orb-1" />
      <div className="dash-orb dash-orb-2" />

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <div className="dash-logo-icon">L</div>
          <span className="dash-logo-text">Lumora</span>
        </div>

        <nav className="dash-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.path}
              className={`dash-nav-item ${active === item.path ? 'active' : ''}`}
              onClick={() => { setActive(item.path); navigate(item.path); }}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              <span className="dash-nav-label">{item.label}</span>
              {active === item.path && <motion.div className="dash-nav-indicator" layoutId="navIndicator" />}
            </button>
          ))}
        </nav>

        <div className="dash-sidebar-bottom">
          <div className="dash-user-card">
            <div className="dash-user-avatar">
              {user ? getInitials(user.profile?.fullName || user.userId?.username || '?') : '…'}
            </div>
            <div className="dash-user-info">
              <span className="dash-user-name">{user?.userId?.username ?? '—'}</span>
              <span className="dash-user-role">{user?.userId?.role ?? '—'}</span>
            </div>
            <button className="dash-user-menu">⋯</button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="dash-main">

        {/* Top bar */}
        <header className="dash-topbar">
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
            <button className="dash-icon-btn">🔔</button>
            <button className="dash-icon-btn">⚙</button>
          </div>
        </header>

        {/* Stats */}
        <StatsRow />

        {/* Main grid */}
        <div className="dash-grid">

          {/* Left column */}
          <div className="dash-col-left">
            <PomodoroTimer />
            <StreakCard streak={user?.streakCount ?? 0} longest={user?.maxStreakCount ?? 0} />
          </div>

          {/* Right column */}
          <div className="dash-col-right">
            <TodoWidget />
            <CommunitiesPanel navigate={navigate} />
          </div>

        </div>
      </main>
    </div>
  );
}
