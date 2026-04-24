import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import './auth.css';

const BASE = import.meta.env.VITE_BACKEND_URL;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused]           = useState("");
  const [formData, setFormData]         = useState({ identifier: "", password: "" });
  const [errors, setErrors]             = useState({});
  const [isLoading, setIsLoading]       = useState(false);
  const navigate = useNavigate();

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
        navigate("/");
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
    <div className="auth-page">
      {/* background orbs */}
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
          <motion.div
            className="auth-logo-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          >
            L
          </motion.div>
          <h1 className="auth-brand">Lumora</h1>
          <p className="auth-tagline">Focus deeper. Achieve more.</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button className="auth-tab active">Log In</button>
          <button className="auth-tab" onClick={() => navigate("/signup")}>Sign Up</button>
          <div className="auth-tab-indicator" style={{ left: 4 }} />
        </div>

        {/* General error */}
        <AnimatePresence>
          {errors.general && (
            <motion.div
              className="auth-error-banner"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {errors.general}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Identifier */}
          <div className="auth-field-wrap">
            <div className={`auth-field ${focused === "identifier" ? "focus" : ""} ${errors.identifier ? "error" : ""}`}>
              <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <input
                type="text"
                placeholder="Username or Email"
                value={formData.identifier}
                onChange={e => handleChange("identifier", e.target.value)}
                onFocus={() => setFocused("identifier")}
                onBlur={() => setFocused("")}
                className="auth-input"
                autoComplete="username"
              />
            </div>
            {errors.identifier && <p className="auth-field-error">{errors.identifier}</p>}
          </div>

          {/* Password */}
          <div className="auth-field-wrap">
            <div className={`auth-field ${focused === "password" ? "focus" : ""} ${errors.password ? "error" : ""}`}>
              <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={e => handleChange("password", e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
                className="auth-input"
                autoComplete="current-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 2l12 12M6.5 6.6A3 3 0 0111 11M4 4.8C2.7 5.9 1.7 7 1 8c1.5 2.5 4 4 7 4a8 8 0 002.7-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                    <path d="M12.3 11.5C13.5 10.4 14.4 9.3 15 8c-1.5-2.5-4-4-7-4a8 8 0 00-2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M1 8C2.5 5.5 5 4 8 4s5.5 1.5 7 4c-1.5 2.5-4 4-7 4S2.5 10.5 1 8z" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="auth-field-error">{errors.password}</p>}
          </div>

          <div className="auth-forgot-row">
            <a href="#" className="auth-forgot">Forgot password?</a>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="auth-submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {isLoading ? (
              <>
                <svg className="auth-spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/>
                  <path fill="currentColor" opacity="0.75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Logging in…
              </>
            ) : (
              <>
                Log In
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </motion.button>
        </form>

        <p className="auth-switch-text">
          Don't have an account?{" "}
          <button className="auth-switch-link" onClick={() => navigate("/signup")}>Sign Up</button>
        </p>
      </motion.div>
    </div>
  );
}
