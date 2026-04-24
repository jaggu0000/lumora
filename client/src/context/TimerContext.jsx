import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { logFocusSession, getTodayFocus } from '../api/userApi.js';

export const POMO_MODE_DEFS = [
  { key: 'work',  label: 'Focus',       color: '#8b5cf6' },
  { key: 'short', label: 'Short Break', color: '#22c55e' },
  { key: 'long',  label: 'Long Break',  color: '#06b6d4' },
];

const CUSTOM_KEY = 'lumora_pomo_custom';
export function loadCustomMins() {
  try { const s = localStorage.getItem(CUSTOM_KEY); if (s) return JSON.parse(s); } catch {}
  return { work: 25, short: 5, long: 15 };
}
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(v)));

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [customMins,    setCustomMins]    = useState(loadCustomMins);
  const [showCustomize, setShowCustomize] = useState(false);
  const [draft,         setDraft]         = useState(loadCustomMins);
  const [modeIdx,       setModeIdx]       = useState(0);
  const [running,       setRunning]       = useState(false);
  const [sessions,      setSessions]      = useState(0);
  const [focusSeconds,  setFocusSeconds]  = useState(0);

  const modes = POMO_MODE_DEFS.map(d => ({ ...d, mins: customMins[d.key] }));
  const mode  = modes[modeIdx];
  const total = mode.mins * 60;

  const [seconds, setSeconds] = useState(total);
  const secondsRef = useRef(total);
  const intervalRef = useRef(null);

  useEffect(() => {
    getTodayFocus().then(({ seconds: s }) => setFocusSeconds(s)).catch(console.error);
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          const next = s - 1;
          secondsRef.current = next;
          if (next <= 0) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode.key === 'work') {
              setSessions(n => n + 1);
              logFocusSession(total).then(() => setFocusSeconds(p => p + total)).catch(console.error);
            }
            return 0;
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode.key]);

  const logPartialAndStop = () => {
    const elapsed = total - secondsRef.current;
    if (elapsed > 0 && mode.key === 'work') {
      logFocusSession(elapsed).then(() => setFocusSeconds(p => p + elapsed)).catch(console.error);
    }
  };

  const switchMode = (idx) => {
    logPartialAndStop();
    clearInterval(intervalRef.current);
    setRunning(false);
    setModeIdx(idx);
    const newTotal = modes[idx].mins * 60;
    secondsRef.current = newTotal;
    setSeconds(newTotal);
  };

  const reset = () => {
    logPartialAndStop();
    clearInterval(intervalRef.current);
    setRunning(false);
    secondsRef.current = total;
    setSeconds(total);
  };

  const applyCustom = () => {
    const validated = {
      work:  clamp(draft.work,  1, 120),
      short: clamp(draft.short, 1,  60),
      long:  clamp(draft.long,  1,  60),
    };
    setCustomMins(validated);
    setDraft(validated);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(validated));
    setShowCustomize(false);
    clearInterval(intervalRef.current);
    setRunning(false);
    const newTotal = validated[mode.key] * 60;
    secondsRef.current = newTotal;
    setSeconds(newTotal);
  };

  const isActive = running || seconds !== total;

  return (
    <TimerContext.Provider value={{
      modes, mode, modeIdx, total,
      customMins, draft, setDraft,
      showCustomize, setShowCustomize,
      running, setRunning,
      sessions, setSessions,
      seconds,
      focusSeconds,
      switchMode, reset, applyCustom,
      isActive,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
