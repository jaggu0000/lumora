import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../context/TimerContext.jsx';
import './FloatingTimerOverlay.css';

const pad = (n) => String(n).padStart(2, '0');

export default function FloatingTimerOverlay() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, seconds, total, running, setRunning, reset, isActive } = useTimer();

  const visible = isActive && location.pathname !== '/dashboard';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="ft-overlay"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg className="ft-ring" width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" className="ft-ring-bg" />
            <circle
              cx="30" cy="30" r="24"
              className="ft-ring-progress"
              style={{
                stroke: mode.color,
                strokeDasharray: 2 * Math.PI * 24,
                strokeDashoffset: 2 * Math.PI * 24 * (1 - seconds / total),
              }}
            />
          </svg>

          <div className="ft-info">
            <span className="ft-time" style={{ color: mode.color }}>
              {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
            </span>
            <span className="ft-label">{mode.label}</span>
          </div>

          <div className="ft-controls">
            <button className="ft-btn" onClick={() => setRunning(r => !r)} title={running ? 'Pause' : 'Resume'}>
              {running ? '⏸' : '▶'}
            </button>
            <button className="ft-btn ft-btn-stop" onClick={reset} title="Stop">⏹</button>
          </div>

          <button className="ft-dash-link" onClick={() => navigate('/dashboard')} title="Go to Dashboard">
            ⊞
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
