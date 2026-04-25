import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommunityChat from '../components/Chat/CommunityChat.jsx';
import AppSidebar from '../components/AppSidebar/AppSidebar.jsx';
import { getUserProfile, getPublicCommunities } from '../api/userApi.js';
import { getCommunity, joinCommunity } from '../api/communityApi.js';
import './CommunityPage.css';

const COMMUNITY_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
const communityColor = (id) => COMMUNITY_COLORS[(id?.charCodeAt(id.length - 1) ?? 0) % COMMUNITY_COLORS.length];
const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

function ExploreModal({ onClose, onJoined }) {
  const [communities, setCommunities] = useState([]);
  const [joining,     setJoining]     = useState(null);
  const [joined,      setJoined]      = useState(new Set());

  useEffect(() => {
    getPublicCommunities()
      .then(({ communities }) => setCommunities(communities))
      .catch(console.error);
  }, []);

  const handleJoin = async (c) => {
    setJoining(c._id);
    try {
      await joinCommunity(c._id);
      setJoined(prev => new Set([...prev, c._id]));
      onJoined();
    } catch (e) { console.error(e); }
    setJoining(null);
  };

  return (
    <motion.div
      className="explore-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="explore-modal"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="explore-modal-header">
          <div>
            <span className="explore-modal-title">Explore Communities</span>
            <span className="explore-modal-sub">{communities.length} public communities</span>
          </div>
          <button className="explore-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="explore-modal-list">
          {communities.length === 0 && (
            <div className="explore-empty">No public communities yet</div>
          )}
          {communities.map((c, i) => {
            const color    = communityColor(c._id);
            const isMember = joined.has(c._id);
            return (
              <motion.div
                key={c._id}
                className="explore-community-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="community-avatar" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, color }}>
                  {getInitials(c.communityName)}
                </div>
                <div className="community-info" style={{ flex: 1 }}>
                  <span className="community-name">{c.communityName}</span>
                  <span className="community-tag">#{c.communityTag}</span>
                  {c.description && <span className="explore-community-desc">{c.description}</span>}
                </div>
                <div className="explore-community-right">
                  <span className="explore-member-count">{c.members?.length ?? 0} members</span>
                  <span className="explore-mode-badge">{c.membershipMode === 'open' ? 'Open' : 'Request'}</span>
                  <motion.button
                    className={`explore-join-btn ${isMember ? 'joined' : ''}`}
                    disabled={isMember || joining === c._id}
                    onClick={() => handleJoin(c)}
                    whileHover={!isMember ? { scale: 1.04 } : {}}
                    whileTap={!isMember ? { scale: 0.96 } : {}}
                  >
                    {joining === c._id ? '…' : isMember ? 'Joined' : 'Join'}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CommunityPage() {
  const location = useLocation();
  const [currentUser,      setCurrentUser]      = useState(null);
  const [selectedId,       setSelectedId]       = useState(location.state?.communityId ?? null);
  const [activeCommunity,  setActiveCommunity]  = useState(null);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then(({ userMetadata }) => setCurrentUser({
        _id:      userMetadata.userId._id,
        username: userMetadata.userId.username,
      }))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingCommunity(true);
    setActiveCommunity(null);
    getCommunity(selectedId)
      .then(({ community }) => setActiveCommunity(community))
      .catch(console.error)
      .finally(() => setLoadingCommunity(false));
  }, [selectedId]);

  const [sidebarKey,   setSidebarKey]   = useState(0);
  const [showExplore,  setShowExplore]  = useState(false);

  const handleLeave = useCallback(() => {
    setSelectedId(null);
    setActiveCommunity(null);
    setSidebarKey(k => k + 1);
  }, []);

  const loading = loadingCommunity || (!!activeCommunity && !currentUser);
  const ready   = !loading && currentUser && activeCommunity;

  return (
    <div className="community-page">
      <AppSidebar
        key={sidebarKey}
        selectedCommunityId={selectedId}
        onCommunitySelect={setSelectedId}
        onExplore={() => setShowExplore(true)}
      />

      <div className="cp-chat-area">
        {loading && (
          <div className="cp-loading">
            <div className="cp-loading-spinner" />
          </div>
        )}

        {ready && (
          <CommunityChat
            key={activeCommunity._id}
            community={activeCommunity}
            currentUser={currentUser}
            onLeave={handleLeave}
          />
        )}

        {!loading && !activeCommunity && (
          <div className="cp-empty-state">
            <div className="cp-empty-icon">⬡</div>
            <p>Select a community to start chatting</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showExplore && (
          <ExploreModal
            onClose={() => setShowExplore(false)}
            onJoined={() => setSidebarKey(k => k + 1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
