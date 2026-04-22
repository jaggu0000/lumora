import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useNavigate } from "react-router-dom";

const NAV_LINKS = ["Features", "Pricing", "Blog"];

const FEATURES = [
  { title: "AI Tasks", icon: "✦", desc: "Intelligent task prioritization using context-aware AI." },
  { title: "Focus Mode", icon: "◎", desc: "Deep work sessions with ambient sound & timers." },
  { title: "Analytics", icon: "⬡", desc: "Real-time performance dashboards with trend analysis." },
  { title: "Smart Goals", icon: "◈", desc: "Adaptive goal-setting that evolves with your progress." },
  { title: "Insights", icon: "◇", desc: "Weekly AI reports distilling your best and worst habits." },
  { title: "Streak", icon: "⟡", desc: "Streak tracking with social accountability loops." },
];

const STATS = [
  { val: "12", unit: "Day Streak", icon: "🔥" },
  { val: "4.5", unit: "Hrs Focused", icon: "⏱" },
  { val: "+23%", unit: "Growth", icon: "📈" },
];

const TICKER_ITEMS = [
  "AI Tasks", "Focus Mode", "Analytics", "Smart Goals", "Community", "Streak Tracker",
  "Deep Work", "Goal Setting", "Performance", "Insights",
];

function Ticker() {
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-dot">✦</span> {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const [activeCard, setActiveCard] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="lumora-root">

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* NAVBAR */}
      <nav className="navbar">
        <span className="navbar-logo">Lumora</span>
        <ul className="navbar-links">
          {NAV_LINKS.map(l => <li key={l}><a href="#">{l}</a></li>)}
        </ul>
        <motion.button className="navbar-cta" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/login")}>
          Login
        </motion.button>
        <motion.button className="navbar-cta" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
        onClick={() => navigate("/signup")}>
          SignUp
        </motion.button>
      </nav>
      {/* HERO */}
      <motion.section className="hero" ref={heroRef} style={{ opacity: opacityHero }}>
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="hero-badge-dot" />
          Smart Productivity Platform
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          style={{ y: yParallax }}
        >
          Focus Deeper.{" "}<em>Achieve More.</em>
        </motion.h1>

        <motion.p
          className="hero-sub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          Next-gen productivity with AI-driven workflows, immersive focus
          sessions, and real-time performance insights — built for serious makers.
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
        >
          <motion.button className="btn-primary" whileTap={{ scale: 0.96 }}>
            Get Started
          </motion.button>
          <button className="btn-ghost">View Demo →</button>
        </motion.div>

        <div className="scroll-hint">
          <div className="scroll-line" /> 
          Scroll
        </div>
      </motion.section>

      {/* TICKER */}
      <Ticker />

      {/* FEATURES */}
      <section className="section">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="section-label">What We Offer</p>
          <h2 className="section-title">Tools built for <em>peak performance</em></h2>
        </motion.div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              className="feature-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
            >
              <span className="feature-icon">{f.icon}</span>
              <p className="feature-title">{f.title}</p>
              <p className="feature-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* DASHBOARD */}
      <div className="dashboard-wrap">
        <motion.div
          className="dashboard-panel"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="dashboard-header">
            <h3 className="dashboard-title">Your Productivity Hub</h3>
            <span className="dashboard-sub">Live overview</span>
          </div>
          <div className="stats-row">
            {STATS.map((s, i) => (
              <motion.div
                key={i}
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12 }}
                whileHover={{ scale: 1.03 }}
              >
                <span className="stat-icon">{s.icon}</span>
                <span className="stat-val">{s.val}</span>
                <span className="stat-unit">{s.unit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <motion.div
          className="cta-box"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Ready to unlock your potential?</h2>
          <p>
            Join thousands of professionals using Lumora to build better habits,
            ship faster, and achieve goals that matter.
          </p>
          <motion.button className="btn-primary" whileTap={{ scale: 0.96 }}>
            Get Started — It's Free
          </motion.button>
        </motion.div>
      </div>

      {/* FOOTER */}
      <footer>
        <span className="footer-logo">Lumora</span>
        <span className="footer-copy">© 2026 Lumora. All rights reserved.</span>
        <ul className="footer-links">
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
          <li><a href="#">Contact</a></li>
        </ul>
      </footer>

    </div>
  );
}
