import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CommunityChat from '../components/Chat/CommunityChat.jsx';
import AppSidebar from '../components/AppSidebar/AppSidebar.jsx';
import { getUserProfile, getPublicCommunities } from '../api/userApi.js';
import { getCommunity, joinCommunity } from '../api/communityApi.js';
import CreateCommunityModal from '../components/CreateCommunityModal/CreateCommunityModal.jsx';
import './CommunityPage.css';

const COMMUNITY_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444'];
const communityColor = (id) => COMMUNITY_COLORS[(id?.charCodeAt(id.length - 1) ?? 0) % COMMUNITY_COLORS.length];
const getInitials = (name = '') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

function ExploreModal({ onClose, onJoined }) {
  const [communities, setCommunities] = useState([]);
  const [joining, setJoining] = useState(null);
  const [joined, setJoined] = useState(new Set());
  const [requested, setRequested] = useState(new Set());

  useEffect(() => {
    getPublicCommunities()
      .then(({ communities }) => setCommunities(communities))
      .catch(console.error);
  }, []);

  const handleJoin = async (community) => {
    setJoining(community._id);
    try {
      const response = await joinCommunity(community._id);
      const didRequest = response?.message?.toLowerCase().includes('request');

      if (didRequest) {
        setRequested((prev) => new Set([...prev, community._id]));
      } else {
        setJoined((prev) => new Set([...prev, community._id]));
        onJoined();
      }
    } catch (error) {
      console.error(error);
    }
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
        onClick={(event) => event.stopPropagation()}
      >
        <div className="explore-modal-header">
          <div>
            <span className="explore-modal-title">Explore Communities</span>
            <span className="explore-modal-sub">{communities.length} public communities</span>
          </div>
          <button className="explore-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="explore-modal-list">
          {communities.length === 0 && (
            <div className="explore-empty">No public communities yet</div>
          )}
          {communities.map((community, index) => {
            const color = communityColor(community._id);
            const isMember = joined.has(community._id);
            const isRequested = requested.has(community._id);

            return (
              <motion.div
                key={community._id}
                className="explore-community-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="community-avatar" style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, color }}>
                  {getInitials(community.communityName)}
                </div>
                <div className="community-info" style={{ flex: 1 }}>
                  <span className="community-name">{community.communityName}</span>
                  <span className="community-tag">#{community.communityTag}</span>
                  {community.description && <span className="explore-community-desc">{community.description}</span>}
                </div>
                <div className="explore-community-right">
                  <span className="explore-member-count">{community.members?.length ?? 0} members</span>
                  <span className="explore-mode-badge">{community.membershipMode === 'open' ? 'Open' : 'Request'}</span>
                  <motion.button
                    className={`explore-join-btn ${isMember || isRequested ? 'joined' : ''}`}
                    disabled={isMember || isRequested || joining === community._id}
                    onClick={() => handleJoin(community)}
                    whileHover={!isMember && !isRequested ? { scale: 1.04 } : {}}
                    whileTap={!isMember && !isRequested ? { scale: 0.96 } : {}}
                  >
                    {joining === community._id ? '...' : isMember ? 'Joined' : isRequested ? 'Request Sent' : 'Join'}
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
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedId, setSelectedId] = useState(location.state?.communityId ?? null);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [loadingCommunity, setLoadingCommunity] = useState(false);

  const loadCommunity = useCallback(async (communityId) => {
    if (!communityId) return;
    setLoadingCommunity(true);
    setActiveCommunity(null);
    try {
      const { community } = await getCommunity(communityId);
      setActiveCommunity(community);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingCommunity(false);
    }
  }, []);

  useEffect(() => {
    getUserProfile()
      .then(({ userMetadata }) => setCurrentUser({
        _id: userMetadata.userId._id,
        username: userMetadata.userId.username,
      }))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadCommunity(selectedId);
  }, [loadCommunity, selectedId]);

  const [sidebarKey, setSidebarKey] = useState(0);
  const [showExplore, setShowExplore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const handleLeave = useCallback(() => {
    setSelectedId(null);
    setActiveCommunity(null);
    setSidebarKey((key) => key + 1);
  }, []);

  const loading = loadingCommunity || (!!activeCommunity && !currentUser);
  const ready = !loading && currentUser && activeCommunity;

  return (
    <div className="community-page">
      <AppSidebar
        key={sidebarKey}
        selectedCommunityId={selectedId}
        onCommunitySelect={setSelectedId}
        onExplore={() => setShowExplore(true)}
        onCreate={() => setShowCreate(true)}
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
            onCommunityUpdated={() => loadCommunity(activeCommunity._id)}
          />
        )}

        {!loading && !activeCommunity && (
          <div className="cp-empty-state">
            <div className="cp-empty-icon">[]</div>
            <p>Select a community to start chatting</p>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showExplore && (
          <ExploreModal
            onClose={() => setShowExplore(false)}
            onJoined={() => setSidebarKey((key) => key + 1)}
          />
        )}
        {showCreate && (
          <CreateCommunityModal
            onClose={() => setShowCreate(false)}
            onCreated={() => setSidebarKey((key) => key + 1)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
