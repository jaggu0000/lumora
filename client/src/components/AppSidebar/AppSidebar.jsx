import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, getJoinedCommunities } from '../../api/userApi.js';
import '../../pages/Dashboard.css';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

export default function AppSidebar({ selectedCommunityId, onCommunitySelect, onExplore, isOpen, onClose }) {
  const navigate = useNavigate();
  const [user,              setUser]              = useState(null);
  const [joinedCommunities, setJoinedCommunities] = useState([]);

  const fetchUser        = useCallback(() => getUserProfile().then(({ userMetadata }) => setUser(userMetadata)).catch(console.error), []);
  const fetchCommunities = useCallback(() => getJoinedCommunities().then(({ communities }) => setJoinedCommunities(communities)).catch(console.error), []);

  useEffect(() => { fetchUser(); fetchCommunities(); }, [fetchUser, fetchCommunities]);

  const handleCommunityClick = (c) => {
    if (onCommunitySelect) {
      onCommunitySelect(c._id);
    } else {
      navigate('/community', { state: { communityId: c._id } });
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside className={`dash-sidebar${isOpen ? ' sidebar-open' : ''}`}>
      <div className="dash-logo">
        <span className="dash-logo-text">Lumora</span>
        {onClose && (
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>
        )}
      </div>

      <nav className="dash-nav">
        <button className="dash-nav-item" onClick={() => navigate('/dashboard')}>
          <span className="dash-nav-icon">⊞</span>
          <span className="dash-nav-label">Dashboard</span>
        </button>
      </nav>

      <div className="dash-sb-communities">
        <div className="dash-sb-section-header">
          <span className="dash-sb-section-title">Communities</span>
          <button className="dash-sb-section-add" onClick={() => navigate('/community')} title="Browse communities">+</button>
        </div>
        <div className="dash-sb-community-list">
          {joinedCommunities.length === 0 && (
            <span className="dash-sb-no-communities">No communities joined yet</span>
          )}
          {joinedCommunities.map((c, i) => {
            const isSelected = selectedCommunityId === c._id;
            return (
              <motion.button
                key={c._id}
                className={`dash-sb-community-item${isSelected ? ' selected' : ''}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 3 }}
                onClick={() => handleCommunityClick(c)}
              >
                <div className="dash-sb-community-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6cc, #8b5cf666)', color: '#8b5cf6' }}>
                  {getInitials(c.communityName)}
                </div>
                <div className="dash-sb-community-info">
                  <span className="dash-sb-community-name">{c.communityName}</span>
                  <span className="dash-sb-community-tag">#{c.communityTag}</span>
                </div>
                <span className="dash-sb-community-members">{c.members?.length ?? 0}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="dash-sb-explore-wrap">
        <motion.button
          className="dash-sb-explore-btn"
          onClick={onExplore ?? (() => navigate('/community'))}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="dash-sb-explore-icon">⬡</span>
          Explore Communities
        </motion.button>
      </div>

      <div className="dash-sidebar-bottom">
        <div className="dash-user-card">
          <div className="dash-user-avatar">
            {user ? getInitials(user.profile?.fullName || user.userId?.username || '?') : '…'}
          </div>
          <div className="dash-user-info">
            <span className="dash-user-name">{user?.userId?.username ?? '—'}</span>
            <span className="dash-user-role">{user?.userId?.role ?? '—'}</span>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
