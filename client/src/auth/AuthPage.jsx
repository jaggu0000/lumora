import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import './auth.css';

const BASE = import.meta.env.VITE_BACKEND_URL;

async function apiFetch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  return { ok: res.ok, status: res.status, data };
}

const EyeIcon = ({ visible }) => visible ? (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M2 2l12 12M6.5 6.6A3 3 0 0111 11M4 4.8C2.7 5.9 1.7 7 1 8c1.5 2.5 4 4 7 4a8 8 0 002.7-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M12.3 11.5C13.5 10.4 14.4 9.3 15 8c-1.5-2.5-4-4-7-4a8 8 0 00-2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M1 8C2.5 5.5 5 4 8 4s5.5 1.5 7 4c-1.5 2.5-4 4-7 4S2.5 10.5 1 8z" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
);

const Spinner = () => (
  <svg className="auth-spinner" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
    <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const slideVariants = {
  enterFromRight: { opacity: 0, x: 32 },
  enterFromLeft:  { opacity: 0, x: -32 },
  center:         { opacity: 1, x: 0 },
  exitToLeft:     { opacity: 0, x: -32 },
  exitToRight:    { opacity: 0, x: 32 },
};

// Reusable OTP input + resend button
function OtpStep({ email, onVerify, onResend, onBack, isLoading, error }) {
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const startCooldown = () => {
    setCooldown(30);
    timerRef.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timerRef.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCooldown();
    return () => clearInterval(timerRef.current);
  }, []);

  const handleResend = async () => {
    if (cooldown > 0) return;
    await onResend();
    startCooldown();
  };

  return (
    <>
      <p className="auth-otp-hint">
        We sent a 6-digit code to <strong>{email}</strong>.<br />
        Enter it below to continue.
      </p>
      <AnimatePresence>
        {error && (
          <motion.div className="auth-error-banner"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={e => { e.preventDefault(); onVerify(otp); }} className="auth-form">
        <div className="auth-field-wrap">
          <div className="auth-field">
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input
              type="text"
              placeholder="6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="auth-input"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
            />
          </div>
        </div>

        <motion.button type="submit" disabled={isLoading || otp.length !== 6}
          className="auth-submit-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          {isLoading ? <><Spinner />Verifying…</> : <>Verify OTP <ArrowIcon /></>}
        </motion.button>
      </form>

      <div className="auth-otp-footer">
        <button
          className="auth-switch-link"
          onClick={handleResend}
          disabled={cooldown > 0}
          style={{ opacity: cooldown > 0 ? 0.5 : 1 }}
        >
          {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
        </button>
        {onBack && (
          <button className="auth-switch-link" onClick={onBack} style={{ marginLeft: 16 }}>
            ← Back
          </button>
        )}
      </div>
    </>
  );
}

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignup = location.pathname === "/signup";

  // mode: login | signup | otp-signup | forgot-email | otp-forgot | reset-password
  const [mode, setMode] = useState(isSignup ? "signup" : "login");
  const [direction, setDirection] = useState(1);
  const [pendingEmail, setPendingEmail] = useState("");

  const switchMode = (next, dir = null) => {
    if (next === mode) return;
    setDirection(dir ?? (next === "signup" ? 1 : -1));
    setMode(next);
    if (next === "login") navigate("/login", { replace: true });
    if (next === "signup") navigate("/signup", { replace: true });
  };

  const taglines = {
    login: "Focus deeper. Achieve more.",
    signup: "Create your workspace",
    "otp-signup": "Verify your email",
    "forgot-email": "Reset your password",
    "otp-forgot": "Enter the OTP",
    "reset-password": "Set a new password",
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <motion.div
        className="auth-card-wrap"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Logo */}
        <div className="auth-logo-block">
          <h1 className="auth-brand">Lumora</h1>
          <AnimatePresence mode="wait">
            <motion.p
              key={mode}
              className="auth-tagline"
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {taglines[mode]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Tab switcher — only show on login/signup */}
        {(mode === "login" || mode === "signup") && (
          <div className="auth-tabs">
            <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => switchMode("login")}>
              Log In
            </button>
            <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => switchMode("signup")}>
              Sign Up
            </button>
            <motion.div
              className="auth-tab-indicator"
              animate={{ left: mode === "login" ? 4 : "calc(50% + 2px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          </div>
        )}

        {/* Animated form area */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={mode}
            custom={direction}
            variants={slideVariants}
            initial={direction > 0 ? "enterFromRight" : "enterFromLeft"}
            animate="center"
            exit={direction > 0 ? "exitToLeft" : "exitToRight"}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          >
            {mode === "login" && (
              <LoginForm
                switchMode={switchMode}
                onForgotPassword={() => switchMode("forgot-email", 1)}
              />
            )}
            {mode === "signup" && (
              <SignupForm
                switchMode={switchMode}
                onOtpRequired={(email) => { setPendingEmail(email); switchMode("otp-signup", 1); }}
              />
            )}
            {mode === "otp-signup" && (
              <OtpSignupStep
                email={pendingEmail}
                onDone={() => switchMode("login", 1)}
              />
            )}
            {mode === "forgot-email" && (
              <ForgotEmailStep
                onOtpSent={(email) => { setPendingEmail(email); switchMode("otp-forgot", 1); }}
                onBack={() => switchMode("login", -1)}
              />
            )}
            {mode === "otp-forgot" && (
              <OtpForgotStep
                email={pendingEmail}
                onVerified={() => switchMode("reset-password", 1)}
                onBack={() => switchMode("forgot-email", -1)}
              />
            )}
            {mode === "reset-password" && (
              <ResetPasswordStep
                email={pendingEmail}
                onDone={() => switchMode("login", 1)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── Login Form ────────────────────────────────────────────────────────────────

function LoginForm({ switchMode, onForgotPassword }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState("");
  const [formData, setFormData]         = useState({ identifier: "", password: "" });
  const [errors, setErrors]             = useState({});
  const [isLoading, setIsLoading]       = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!formData.identifier.trim()) e.identifier = "Username or email is required";
    if (!formData.password.trim())   e.password   = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/login`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: formData.identifier, password: formData.password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.data);
        navigate(data.data?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } else if (data.errors) {
        const se = {};
        data.errors.forEach(e => { se[e.path] = e.msg; });
        setErrors(se);
      } else {
        setErrors({ general: data.message || "Login failed" });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {errors.general && (
          <motion.div className="auth-error-banner"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {errors.general}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "identifier" ? "focus" : ""} ${errors.identifier ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input type="text" placeholder="Username or Email"
              value={formData.identifier}
              onChange={e => handleChange("identifier", e.target.value)}
              onFocus={() => setFocused("identifier")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="username"
            />
          </div>
          {errors.identifier && <p className="auth-field-error">{errors.identifier}</p>}
        </div>

        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "password" ? "focus" : ""} ${errors.password ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
            </svg>
            <input type={showPassword ? "text" : "password"} placeholder="Password"
              value={formData.password}
              onChange={e => handleChange("password", e.target.value)}
              onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="current-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {errors.password && <p className="auth-field-error">{errors.password}</p>}
        </div>

        <div className="auth-forgot-row">
          <button type="button" className="auth-forgot" onClick={onForgotPassword}>
            Forgot password?
          </button>
        </div>

        <motion.button type="submit" disabled={isLoading}
          className="auth-submit-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          {isLoading ? <><Spinner />Logging in…</> : <>Log In <ArrowIcon /></>}
        </motion.button>
      </form>

      <p className="auth-switch-text">
        Don't have an account?{" "}
        <button className="auth-switch-link" onClick={() => switchMode("signup")}>Sign Up</button>
      </p>
    </>
  );
}

// ── Signup Form ───────────────────────────────────────────────────────────────

function SignupForm({ switchMode, onOtpRequired }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [focused, setFocused]           = useState("");
  const [formData, setFormData]         = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors]             = useState({});
  const [isLoading, setIsLoading]       = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!formData.username.trim())                              e.username        = "Username is required";
    else if (formData.username.length < 3)                     e.username        = "At least 3 characters";
    else if (formData.username.length > 20)                    e.username        = "Max 20 characters";
    else if (!/^[a-z0-9_]+$/i.test(formData.username))        e.username        = "Letters, numbers and underscores only";
    if (!formData.email.trim())                                e.email           = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email        = "Invalid email address";
    if (!formData.password)                                    e.password        = "Password is required";
    else if (formData.password.length < 6)                     e.password        = "At least 6 characters";
    if (!formData.confirmPassword)                             e.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)   e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const res  = await fetch(`${BASE}/auth/signup`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username, email: formData.email,
          password: formData.password, confirmPassword: formData.confirmPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onOtpRequired(formData.email);
      } else if (data.errors) {
        const se = {};
        data.errors.forEach(e => { se[e.path] = e.msg; });
        setErrors(se);
      } else {
        setErrors({ general: data.message || "Registration failed" });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {errors.general && (
          <motion.div className="auth-error-banner"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {errors.general}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "username" ? "focus" : ""} ${errors.username ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1.5 14c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Username"
              value={formData.username}
              onChange={e => handleChange("username", e.target.value)}
              onFocus={() => setFocused("username")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="username"
            />
          </div>
          {errors.username && <p className="auth-field-error">{errors.username}</p>}
        </div>

        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "email" ? "focus" : ""} ${errors.email ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input type="email" placeholder="Email"
              value={formData.email}
              onChange={e => handleChange("email", e.target.value)}
              onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="email"
            />
          </div>
          {errors.email && <p className="auth-field-error">{errors.email}</p>}
        </div>

        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "password" ? "focus" : ""} ${errors.password ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
            </svg>
            <input type={showPassword ? "text" : "password"} placeholder="Password"
              value={formData.password}
              onChange={e => handleChange("password", e.target.value)}
              onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
              <EyeIcon visible={showPassword} />
            </button>
          </div>
          {errors.password && <p className="auth-field-error">{errors.password}</p>}
        </div>

        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "confirm" ? "focus" : ""} ${errors.confirmPassword ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input type={showConfirm ? "text" : "password"} placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={e => handleChange("confirmPassword", e.target.value)}
              onFocus={() => setFocused("confirm")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(v => !v)}>
              <EyeIcon visible={showConfirm} />
            </button>
          </div>
          {errors.confirmPassword && <p className="auth-field-error">{errors.confirmPassword}</p>}
        </div>

        <motion.button type="submit" disabled={isLoading}
          className="auth-submit-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          {isLoading ? <><Spinner />Creating account…</> : <>Create Account <ArrowIcon /></>}
        </motion.button>
      </form>

      <p className="auth-switch-text">
        Already have an account?{" "}
        <button className="auth-switch-link" onClick={() => switchMode("login")}>Log In</button>
      </p>
    </>
  );
}

// ── OTP step after signup ─────────────────────────────────────────────────────

function OtpSignupStep({ email, onDone }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const handleVerify = async (otp) => {
    setIsLoading(true);
    setError("");
    try {
      const { ok, data } = await apiFetch("/auth/verify-otp", { email, otp });
      if (ok) {
        setSuccess("Email verified! Redirecting to login…");
        setTimeout(onDone, 1500);
      } else {
        setError(data.message || "Verification failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try { await apiFetch("/auth/resend-otp", { email }); } catch { /* silent */ }
  };

  if (success) {
    return (
      <motion.p className="auth-success-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {success}
      </motion.p>
    );
  }

  return (
    <OtpStep
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      isLoading={isLoading}
      error={error}
    />
  );
}

// ── Forgot password: email step ───────────────────────────────────────────────

function ForgotEmailStep({ onOtpSent, onBack }) {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setIsLoading(true);
    setError("");
    try {
      const { ok, data } = await apiFetch("/auth/forgot-password", { email });
      if (ok) {
        onOtpSent(email);
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <p className="auth-otp-hint">Enter your registered email and we'll send you an OTP to reset your password.</p>
      <AnimatePresence>
        {error && (
          <motion.div className="auth-error-banner"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-field-wrap">
          <div className={`auth-field ${focused ? "focus" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input type="email" placeholder="Your email address"
              value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              className="auth-input" autoComplete="email"
            />
          </div>
        </div>
        <motion.button type="submit" disabled={isLoading}
          className="auth-submit-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          {isLoading ? <><Spinner />Sending…</> : <>Send OTP <ArrowIcon /></>}
        </motion.button>
      </form>
      <div className="auth-otp-footer">
        <button className="auth-switch-link" onClick={onBack}>← Back to Login</button>
      </div>
    </>
  );
}

// ── Forgot password: OTP step ─────────────────────────────────────────────────

function OtpForgotStep({ email, onVerified, onBack }) {
  const [pendingOtp, setPendingOtp] = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState("");

  const handleVerify = async (otp) => {
    // Just validate OTP exists on server by attempting reset with placeholder —
    // we store otp in parent and move to next step
    setPendingOtp(otp);
    onVerified(otp);
  };

  const handleResend = async () => {
    try { await apiFetch("/auth/forgot-password", { email }); } catch { /* silent */ }
  };

  return (
    <OtpStep
      email={email}
      onVerify={handleVerify}
      onResend={handleResend}
      onBack={onBack}
      isLoading={isLoading}
      error={error}
    />
  );
}

// ── Reset password step ───────────────────────────────────────────────────────

function ResetPasswordStep({ email, onDone }) {
  const [otp, setOtp]                 = useState("");
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConf, setShowConf]       = useState(false);
  const [focused, setFocused]         = useState("");
  const [errors, setErrors]           = useState({});
  const [isLoading, setIsLoading]     = useState(false);
  const [success, setSuccess]         = useState("");

  const validate = () => {
    const e = {};
    if (!otp || otp.length !== 6)    e.otp     = "Enter the 6-digit OTP from your email";
    if (!password)                    e.password = "Password is required";
    else if (password.length < 6)    e.password = "At least 6 characters";
    if (password !== confirm)         e.confirm  = "Passwords do not match";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { ok, data } = await apiFetch("/auth/reset-password", { email, otp, newPassword: password });
      if (ok) {
        setSuccess("Password reset! Redirecting to login…");
        setTimeout(onDone, 1500);
      } else {
        setErrors({ general: data.message || "Reset failed" });
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.p className="auth-success-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {success}
      </motion.p>
    );
  }

  return (
    <>
      <p className="auth-otp-hint">Enter the OTP sent to <strong>{email}</strong> and choose a new password.</p>
      <AnimatePresence>
        {errors.general && (
          <motion.div className="auth-error-banner"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {errors.general}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* OTP field */}
        <div className="auth-field-wrap">
          <div className={`auth-field ${errors.otp ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="5" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 5V4a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input type="text" placeholder="6-digit OTP"
              value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors(p => ({ ...p, otp: "" })); }}
              className="auth-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
            />
          </div>
          {errors.otp && <p className="auth-field-error">{errors.otp}</p>}
        </div>

        {/* New password */}
        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "password" ? "focus" : ""} ${errors.password ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
            </svg>
            <input type={showPass ? "text" : "password"} placeholder="New password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: "" })); }}
              onFocus={() => setFocused("password")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowPass(v => !v)}>
              <EyeIcon visible={showPass} />
            </button>
          </div>
          {errors.password && <p className="auth-field-error">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div className="auth-field-wrap">
          <div className={`auth-field ${focused === "confirm" ? "focus" : ""} ${errors.confirm ? "error" : ""}`}>
            <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
            <input type={showConf ? "text" : "password"} placeholder="Confirm new password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: "" })); }}
              onFocus={() => setFocused("confirm")} onBlur={() => setFocused("")}
              className="auth-input" autoComplete="new-password"
            />
            <button type="button" className="auth-eye-btn" onClick={() => setShowConf(v => !v)}>
              <EyeIcon visible={showConf} />
            </button>
          </div>
          {errors.confirm && <p className="auth-field-error">{errors.confirm}</p>}
        </div>

        <motion.button type="submit" disabled={isLoading}
          className="auth-submit-btn" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          {isLoading ? <><Spinner />Resetting…</> : <>Reset Password <ArrowIcon /></>}
        </motion.button>
      </form>
    </>
  );
}
