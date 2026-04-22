import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL;

const floatAnim = {
  animate: {
    y: [0, -18, 0],
    transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
  },
};

const floatAnim2 = {
  animate: {
    y: [0, 14, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 },
  },
};

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focused, setFocused] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [tab, setTab] = useState("signup");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleTab = (t) => {
    setTab(t);
    if (t === "login") navigate("/login");
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Username validation (matches server-side validation)
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
    } else if (formData.username.length > 20) {
      newErrors.username = "Username must be less than 20 characters long";
    } else if (!/^[a-z0-9_]+$/i.test(formData.username)) {
      newErrors.username = "Username can only contain letters, numbers, and underscores";
    }

    // Email validation (matches server-side validation)
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    // Password validation (matches server-side validation)
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    // Confirm password validation (matches server-side validation)
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Terms agreement
    if (!agreed) {
      newErrors.agreed = "You must agree to the Terms & Conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${BASE}/auth/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to login
        navigate('/login');
      } else {
        // Handle server validation errors
        if (data.errors) {
          const serverErrors = {};
          data.errors.forEach(error => {
            serverErrors[error.path] = error.msg;
          });
          setErrors(serverErrors);
        } else {
          setErrors({ general: data.message || 'Registration failed' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fields = [
    {
      id: "username",
      type: "text",
      placeholder: "Username",
      icon: (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1.5 14c0-3 3-5 6.5-5s6.5 2 6.5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: "email",
      type: "email",
      placeholder: "Email",
      icon: (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
          <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF4F7] relative overflow-hidden">
      {/* Decorative blobs */}
      <motion.div
        variants={floatAnim}
        animate="animate"
        className="absolute w-80 h-80 rounded-full bg-[#E3AFBC]/60 blur-3xl -top-16 -left-16 pointer-events-none"
      />
      <motion.div
        variants={floatAnim2}
        animate="animate"
        className="absolute w-64 h-64 rounded-full bg-[#5D001E]/10 blur-3xl bottom-0 right-0 pointer-events-none"
      />
      <motion.div
        variants={floatAnim}
        animate="animate"
        className="absolute w-40 h-40 rounded-full bg-[#E3AFBC]/40 blur-2xl top-1/2 right-10 pointer-events-none"
      />

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #C9184A22 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-[92%] max-w-sm"
      >
        {/* Shadow card behind */}
        <div className="absolute -top-3 left-4 right-4 h-full rounded-3xl bg-[#E3AFBC]/50 blur-sm -z-10 scale-[0.97]" />

        <div className="bg-white/80 backdrop-blur-2xl border border-white/80 shadow-[0_8px_40px_rgba(93,0,30,0.10)] rounded-3xl px-8 py-9">
          {/* Logo */}
          <div className="flex flex-col items-center mb-7">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C9184A] to-[#5D001E] flex items-center justify-center shadow-lg mb-4"
            >
              <span className="text-white font-bold text-lg tracking-tight" style={{ fontFamily: "Georgia, serif" }}>L</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1a0810] tracking-tight">Lumora</h1>
            <p className="text-[#9e6070] text-sm mt-1">Create your calm workspace</p>
          </div>

          {/* Tabs */}
          <div className="flex bg-[#F7EEF1] rounded-xl p-1 mb-7 relative">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="absolute top-1 bottom-1 w-[calc(50%-2px)] rounded-[10px] bg-white shadow-sm border border-[#E3AFBC]/60"
              style={{ left: tab === "login" ? "4px" : "calc(50% + 2px)" }}
            />
            {["login", "signup"].map((t) => (
              <button
                key={t}
                onClick={() => handleTab(t)}
                className={`relative z-10 w-1/2 py-2 text-sm font-medium rounded-[10px] transition-colors duration-200 ${
                  tab === t ? "text-[#5D001E]" : "text-[#9e6070] hover:text-[#5D001E]"
                }`}
              >
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* General error message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Text fields */}
            <div className="space-y-3 mb-3">
              {fields.map(({ id, type, placeholder, icon }) => (
                <div key={id}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 bg-[#FDF4F7] ${
                      focused === id
                        ? "border-[#C9184A]/50 shadow-[0_0_0_3px_rgba(201,24,74,0.08)]"
                        : "border-[#E3AFBC]/60 hover:border-[#C9184A]/30"
                    } ${errors[id] ? "border-red-400" : ""}`}
                  >
                    <span className="text-[#C9184A] shrink-0">{icon}</span>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[id]}
                      onChange={(e) => handleInputChange(id, e.target.value)}
                      onFocus={() => setFocused(id)}
                      onBlur={() => setFocused("")}
                      className="flex-1 bg-transparent text-[#1a0810] placeholder-[#c89faa] text-sm outline-none"
                    />
                  </div>
                  {errors[id] && (
                    <p className="text-red-500 text-xs mt-1 ml-1">{errors[id]}</p>
                  )}
                </div>
              ))}

              {/* Password */}
              <div>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 bg-[#FDF4F7] ${
                    focused === "password"
                      ? "border-[#C9184A]/50 shadow-[0_0_0_3px_rgba(201,24,74,0.08)]"
                      : "border-[#E3AFBC]/60 hover:border-[#C9184A]/30"
                  } ${errors.password ? "border-red-400" : ""}`}
                >
                  <span className="text-[#C9184A] shrink-0">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" />
                      <circle cx="8" cy="10.5" r="1" fill="currentColor" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    className="flex-1 bg-transparent text-[#1a0810] placeholder-[#c89faa] text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-[#c89faa] hover:text-[#C9184A] transition-colors">
                    {showPassword ? (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12M6.5 6.6A3 3 0 0111 11M4 4.8C2.7 5.9 1.7 7 1 8c1.5 2.5 4 4 7 4a8 8 0 002.7-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        <path d="M12.3 11.5C13.5 10.4 14.4 9.3 15 8c-1.5-2.5-4-4-7-4a8 8 0 00-2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8C2.5 5.5 5 4 8 4s5.5 1.5 7 4c-1.5 2.5-4 4-7 4S2.5 10.5 1 8z" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 bg-[#FDF4F7] ${
                    focused === "confirm"
                      ? "border-[#C9184A]/50 shadow-[0_0_0_3px_rgba(201,24,74,0.08)]"
                      : "border-[#E3AFBC]/60 hover:border-[#C9184A]/30"
                  } ${errors.confirmPassword ? "border-red-400" : ""}`}
                >
                  <span className="text-[#C9184A] shrink-0">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    onFocus={() => setFocused("confirm")}
                    onBlur={() => setFocused("")}
                    className="flex-1 bg-transparent text-[#1a0810] placeholder-[#c89faa] text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-[#c89faa] hover:text-[#C9184A] transition-colors">
                    {showConfirm ? (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M2 2l12 12M6.5 6.6A3 3 0 0111 11M4 4.8C2.7 5.9 1.7 7 1 8c1.5 2.5 4 4 7 4a8 8 0 002.7-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        <path d="M12.3 11.5C13.5 10.4 14.4 9.3 15 8c-1.5-2.5-4-4-7-4a8 8 0 00-2 .3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                        <path d="M1 8C2.5 5.5 5 4 8 4s5.5 1.5 7 4c-1.5 2.5-4 4-7 4S2.5 10.5 1 8z" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 mt-4 cursor-pointer group">
              <div
                onClick={() => setAgreed(!agreed)}
                className={`w-4 h-4 mt-0.5 rounded shrink-0 border transition-all duration-200 flex items-center justify-center ${
                  agreed
                    ? "bg-[#C9184A] border-[#C9184A]"
                    : "border-[#E3AFBC] bg-white group-hover:border-[#C9184A]/50"
                }`}
              >
                <AnimatePresence>
                  {agreed && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      width="9" height="9" viewBox="0 0 10 10" fill="none"
                    >
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-xs text-[#9e6070] leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-[#C9184A] underline underline-offset-2 hover:text-[#9d0035]">Terms & Conditions</a>
                {" "}and{" "}
                <a href="#" className="text-[#C9184A] underline underline-offset-2 hover:text-[#9d0035]">Privacy Policy</a>
              </span>
            </label>
            {errors.agreed && (
              <p className="text-red-500 text-xs mt-1 ml-1">{errors.agreed}</p>
            )}

            {/* CTA Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-semibold shadow-[0_4px_20px_rgba(201,24,74,0.35)] hover:shadow-[0_6px_28px_rgba(201,24,74,0.45)] transition-shadow duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-[#c89faa] mt-5">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#9e6070] font-medium hover:text-[#C9184A] transition-colors underline underline-offset-2"
            >
              Log In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
