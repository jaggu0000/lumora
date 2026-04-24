import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import './auth.css';

const BASE = import.meta.env.VITE_BACKEND_URL;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [focused, setFocused]           = useState("");
  const [agreed, setAgreed]             = useState(false);
  const [formData, setFormData]         = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors]             = useState({});
  const [isLoading, setIsLoading]       = useState(false);
  const navigate = useNavigate();

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
    if (!agreed)                                               e.agreed          = "You must agree to the Terms";
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
        navigate("/login");
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
          <p className="auth-tagline">Create your workspace</p>
        </div>

        <div className="auth-tabs">
          <button className="auth-tab" onClick={() => navigate("/login")}>Log In</button>
          <button className="auth-tab active">Sign Up</button>
          <div className="auth-tab-indicator" style={{ left: "calc(50% + 2px)" }} />
        </div>

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
          {/* Username */}
          <div className="auth-field-wrap">
            <div className={`auth-field ${focused === "username" ? "focus" : ""} ${errors.username ? "error" : ""}`}>
              <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1.5 14c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              <input
                type="text" placeholder="Username"
                value={formData.username}
                onChange={e => handleChange("username", e.target.value)}
                onFocus={() => setFocused("username")} onBlur={() => setFocused("")}
                className="auth-input" autoComplete="username"
              />
            </div>
            {errors.username && <p className="auth-field-error">{errors.username}</p>}
          </div>

          {/* Email */}
          <div className="auth-field-wrap">
            <div className={`auth-field ${focused === "email" ? "focus" : ""} ${errors.email ? "error" : ""}`}>
              <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <input
                type="email" placeholder="Email"
                value={formData.email}
                onChange={e => handleChange("email", e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                className="auth-input" autoComplete="email"
              />
            </div>
            {errors.email && <p className="auth-field-error">{errors.email}</p>}
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
                type={showPassword ? "text" : "password"} placeholder="Password"
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

          {/* Confirm Password */}
          <div className="auth-field-wrap">
            <div className={`auth-field ${focused === "confirm" ? "focus" : ""} ${errors.confirmPassword ? "error" : ""}`}>
              <svg className="auth-field-icon" width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <input
                type={showConfirm ? "text" : "password"} placeholder="Confirm Password"
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

          {/* Terms */}
          <label className="auth-terms-row">
            <div
              className={`auth-checkbox ${agreed ? "checked" : ""}`}
              onClick={() => { setAgreed(v => !v); if (errors.agreed) setErrors(p => ({ ...p, agreed: "" })); }}
            >
              <AnimatePresence>
                {agreed && (
                  <motion.svg
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    transition={{ duration: 0.15 }}
                    width="9" height="9" viewBox="0 0 10 10" fill="none"
                  >
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>
            <span className="auth-terms-text">
              I agree to the{" "}
              <a href="#" className="auth-terms-link">Terms & Conditions</a>
              {" "}and{" "}
              <a href="#" className="auth-terms-link">Privacy Policy</a>
            </span>
          </label>
          {errors.agreed && <p className="auth-field-error" style={{ marginTop: -8 }}>{errors.agreed}</p>}

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
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </motion.button>
        </form>

        <p className="auth-switch-text">
          Already have an account?{" "}
          <button className="auth-switch-link" onClick={() => navigate("/login")}>Log In</button>
        </p>
      </motion.div>
    </div>
  );
}
