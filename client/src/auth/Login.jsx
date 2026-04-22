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

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState("login");
  const [focused, setFocused] = useState("");
  const [formData, setFormData] = useState({
    identifier: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleTab = (t) => {
    setTab(t);
    if (t === "signup") navigate("/signup");
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

    // Identifier validation (matches server-side validation)
    if (!formData.identifier.trim()) {
      newErrors.identifier = "Username or Email is Required!";
    }

    // Password validation (matches server-side validation)
    if (!formData.password.trim()) {
      newErrors.password = "Password is required!";
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
      const response = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - redirect to dashboard
        navigate('/');
      } else {
        // Handle server validation errors
        if (data.errors) {
          const serverErrors = {};
          data.errors.forEach(error => {
            serverErrors[error.path] = error.msg;
          });
          setErrors(serverErrors);
        } else {
          setErrors({ general: data.message || 'Login failed' });
        }
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Decorative grid dots */}
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
        {/* Floating accent card behind */}
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
            <p className="text-[#9e6070] text-sm mt-1">Calm productivity starts here</p>
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
            {/* Form fields */}
            <div className="space-y-3 mb-2">
              {/* Email/Username */}
              <div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 bg-[#FDF4F7] ${
                  focused === "identifier"
                    ? "border-[#C9184A]/50 shadow-[0_0_0_3px_rgba(201,24,74,0.08)]"
                    : "border-[#E3AFBC]/60 hover:border-[#C9184A]/30"
                } ${errors.identifier ? "border-red-400" : ""}`}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-[#C9184A] shrink-0">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M1 5.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Username or Email"
                    value={formData.identifier}
                    onChange={(e) => handleInputChange("identifier", e.target.value)}
                    onFocus={() => setFocused("identifier")}
                    onBlur={() => setFocused("")}
                    className="flex-1 bg-transparent text-[#1a0810] placeholder-[#c89faa] text-sm outline-none"
                  />
                </div>
                {errors.identifier && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.identifier}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 bg-[#FDF4F7] ${
                  focused === "password"
                    ? "border-[#C9184A]/50 shadow-[0_0_0_3px_rgba(201,24,74,0.08)]"
                    : "border-[#E3AFBC]/60 hover:border-[#C9184A]/30"
                } ${errors.password ? "border-red-400" : ""}`}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="text-[#C9184A] shrink-0">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3"/>
                    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused("")}
                    className="flex-1 bg-transparent text-[#1a0810] placeholder-[#c89faa] text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#c89faa] hover:text-[#C9184A] transition-colors"
                  >
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
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Forgot */}
            <div className="text-right mb-6 mt-2">
              <a href="#" className="text-xs text-[#9e6070] hover:text-[#C9184A] transition-colors">
                Forgot password?
              </a>
            </div>

            {/* CTA Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C9184A] to-[#9D0035] text-white text-sm font-semibold shadow-[0_4px_20px_rgba(201,24,74,0.35)] hover:shadow-[0_6px_28px_rgba(201,24,74,0.45)] transition-shadow duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {isLoading ? "Logging In..." : (tab === "login" ? "Log In" : "Create Account")}
                </motion.span>
              </AnimatePresence>
              {!isLoading && (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#E3AFBC]/50" />
            <span className="text-xs text-[#c89faa]">or continue with</span>
            <div className="flex-1 h-px bg-[#E3AFBC]/50" />
          </div>

          {/* Social buttons */}
          <div className="flex gap-3">
            {[
              {
                label: "Google",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 16 16">
                    <path d="M15.3 8.17c0-.52-.05-1.02-.13-1.5H8v2.84h4.1a3.5 3.5 0 01-1.52 2.3v1.9h2.46c1.44-1.32 2.27-3.27 2.27-5.54z" fill="#4285F4"/>
                    <path d="M8 15.5c2.06 0 3.78-.68 5.04-1.84l-2.46-1.9c-.68.46-1.55.73-2.58.73-1.98 0-3.66-1.34-4.26-3.14H1.22v1.97A7.5 7.5 0 008 15.5z" fill="#34A853"/>
                    <path d="M3.74 9.35A4.5 4.5 0 013.5 8c0-.47.08-.92.24-1.35V4.68H1.22A7.5 7.5 0 00.5 8c0 1.21.29 2.35.72 3.32l2.52-1.97z" fill="#FBBC05"/>
                    <path d="M8 3.52c1.12 0 2.12.38 2.9 1.14l2.18-2.18C11.77.83 10.05.1 8 .1A7.5 7.5 0 001.22 4.68l2.52 1.97C4.34 4.86 6.02 3.52 8 3.52z" fill="#EA4335"/>
                  </svg>
                ),
              },
              {
                label: "GitHub",
                icon: (
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.88-1.17-.88-1.17-.72-.49.05-.48.05-.48.8.06 1.22.82 1.22.82.71 1.21 1.86.86 2.32.66.07-.52.28-.86.5-1.06-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.66 7.66 0 018 3.8c.68 0 1.36.09 2 .26 1.52-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                ),
              },
            ].map(({ label, icon }) => (
              <motion.button
                key={label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#E3AFBC]/70 bg-white/60 text-[#5D001E] text-xs font-medium hover:bg-white hover:border-[#C9184A]/40 transition-all duration-150"
              >
                {icon}
                {label}
              </motion.button>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-[#c89faa] mt-6">
            By continuing, you agree to our{" "}
            <a href="#" className="text-[#9e6070] underline underline-offset-2 hover:text-[#C9184A]">Terms</a>
            {" & "}
            <a href="#" className="text-[#9e6070] underline underline-offset-2 hover:text-[#C9184A]">Privacy</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
