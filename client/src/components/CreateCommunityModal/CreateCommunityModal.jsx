import { useState } from 'react';
import { motion } from 'framer-motion';
import { createCommunity } from '../../api/communityApi.js';
import './CreateCommunityModal.css';

const MEMBERSHIP_MODES = ['open', 'invite-only', 'request-to-join'];

export default function CreateCommunityModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    communityTag: '',
    communityName: '',
    description: '',
    communityRules: '',
    isPrivate: false,
    membershipMode: 'open',
  });
  const [errors,      setErrors]      = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [serverError, setServerError] = useState('');

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [field]: value }));
    setErrors(err => ({ ...err, [field]: '' }));
    setServerError('');
  };

  const validate = () => {
    const e = {};
    if (!form.communityTag) e.communityTag = 'Community Tag is required';
    else if (form.communityTag.length < 3) e.communityTag = 'Must be at least 3 characters';
    else if (form.communityTag.length > 10) e.communityTag = 'Must be at most 10 characters';
    else if (!/^[a-z0-9_-]+$/i.test(form.communityTag)) e.communityTag = 'Only letters, numbers, _ and - allowed';

    if (!form.communityName) e.communityName = 'Community Name is required';
    else if (form.communityName.length < 3) e.communityName = 'Must be at least 3 characters';
    else if (form.communityName.length > 30) e.communityName = 'Must be at most 30 characters';

    if (!form.description) e.description = 'Description is required';
    else if (form.description.length < 10) e.description = 'Must be at least 10 characters';
    else if (form.description.length > 500) e.description = 'Must be at most 500 characters';

    if (form.communityRules.length > 1000) e.communityRules = 'Must be at most 1000 characters';

    if (!form.membershipMode) e.membershipMode = 'Membership mode is required';

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      await createCommunity(form);
      onCreated();
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to create community');
    } finally {
      setSubmitting(false);
    }
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
        className="explore-modal create-community-modal"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="explore-modal-header">
          <div>
            <span className="explore-modal-title">Create Community</span>
            <span className="explore-modal-sub">Start your own space</span>
          </div>
          <button className="explore-close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="cc-form" onSubmit={handleSubmit} noValidate>
          <div className="cc-scrollable">
          {serverError && <div className="cc-server-error">{serverError}</div>}

          <div className="cc-row">
            <div className="cc-field">
              <label className="cc-label">Community Tag <span className="cc-required">*</span></label>
              <input
                className={`cc-input${errors.communityTag ? ' cc-input-error' : ''}`}
                placeholder="e.g. dev-talk"
                value={form.communityTag}
                onChange={set('communityTag')}
                maxLength={10}
              />
              {errors.communityTag && <span className="cc-error">{errors.communityTag}</span>}
            </div>
            <div className="cc-field">
              <label className="cc-label">Community Name <span className="cc-required">*</span></label>
              <input
                className={`cc-input${errors.communityName ? ' cc-input-error' : ''}`}
                placeholder="e.g. Dev Talk"
                value={form.communityName}
                onChange={set('communityName')}
                maxLength={30}
              />
              {errors.communityName && <span className="cc-error">{errors.communityName}</span>}
            </div>
          </div>

          <div className="cc-field">
            <label className="cc-label">Description <span className="cc-required">*</span></label>
            <textarea
              className={`cc-textarea${errors.description ? ' cc-input-error' : ''}`}
              placeholder="What is this community about?"
              rows={3}
              value={form.description}
              onChange={set('description')}
              maxLength={500}
            />
            <span className="cc-char-count">{form.description.length}/500</span>
            {errors.description && <span className="cc-error">{errors.description}</span>}
          </div>

          <div className="cc-field">
            <label className="cc-label">Community Rules <span className="cc-optional">(optional)</span></label>
            <textarea
              className={`cc-textarea${errors.communityRules ? ' cc-input-error' : ''}`}
              placeholder="Set guidelines for members..."
              rows={3}
              value={form.communityRules}
              onChange={set('communityRules')}
              maxLength={1000}
            />
            <span className="cc-char-count">{form.communityRules.length}/1000</span>
            {errors.communityRules && <span className="cc-error">{errors.communityRules}</span>}
          </div>

          <div className="cc-row">
            <div className="cc-field">
              <label className="cc-label">Membership Mode <span className="cc-required">*</span></label>
              <select
                className={`cc-select${errors.membershipMode ? ' cc-input-error' : ''}`}
                value={form.membershipMode}
                onChange={set('membershipMode')}
              >
                {MEMBERSHIP_MODES.map(m => (
                  <option key={m} value={m}>{m.replace(/-/g, ' ').replace(/^\w/, c => c.toUpperCase())}</option>
                ))}
              </select>
              {errors.membershipMode && <span className="cc-error">{errors.membershipMode}</span>}
            </div>

            <div className="cc-field cc-field-toggle">
              <label className="cc-label">Private Community</label>
              <label className="cc-toggle">
                <input
                  type="checkbox"
                  checked={form.isPrivate}
                  onChange={set('isPrivate')}
                />
                <span className="cc-toggle-slider" />
              </label>
              <span className="cc-toggle-hint">{form.isPrivate ? 'Hidden from public' : 'Visible to all'}</span>
            </div>
          </div>

          </div>

          <div className="cc-actions">
            <button type="button" className="cc-btn-cancel" onClick={onClose}>Cancel</button>
            <motion.button
              type="submit"
              className="cc-btn-create"
              disabled={submitting}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {submitting ? 'Creating…' : 'Create Community'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
