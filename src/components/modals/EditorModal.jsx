import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { inviteMemberToWorkspace, createJoinLink } from '../../services/workspaceApi';

const EMPTY_EMAIL_FORM = { email: '', role: 'editor' };
const DEFAULT_LINK_FORM = { role: 'editor', expiresInDays: '7', maxUses: '' };

export default function EditorModal({ isOpen, onClose }) {
  const { meta, pushToast } = useAppContext();
  
  // Tab state: 'email' or 'link'
  const [activeTab, setActiveTab] = useState('email');
  
  // Email form state
  const [emailForm, setEmailForm] = useState(EMPTY_EMAIL_FORM);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Link form state
  const [linkForm, setLinkForm] = useState(DEFAULT_LINK_FORM);
  const [linkGenerating, setLinkGenerating] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmailForm(EMPTY_EMAIL_FORM);
      setLinkForm(DEFAULT_LINK_FORM);
      setEmailError('');
      setLinkError('');
      setGeneratedLink('');
      setCopied(false);
      setActiveTab('email');
    }
  }, [isOpen]);

  const handleEmailSubmit = async () => {
    const email = emailForm.email.trim();
    if (!email) {
      setEmailError('Please provide a valid email address.');
      return;
    }

    setEmailSending(true);
    setEmailError('');

    try {
      await inviteMemberToWorkspace(meta.currentWorkspaceId, email, emailForm.role);
      if (pushToast) {
        pushToast(`Invitation sent successfully to ${email}!`);
      } else {
        alert(`Invitation sent successfully to ${email}!`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setEmailError(err.message || 'Failed to send workspace invitation.');
    } finally {
      setEmailSending(false);
    }
  };

  const handleGenerateLink = async () => {
    setLinkGenerating(true);
    setLinkError('');
    setGeneratedLink('');
    setCopied(false);

    try {
      const payload = {
        defaultRequestedRole: linkForm.role,
        expiresInDays: linkForm.expiresInDays === '0' ? null : Number(linkForm.expiresInDays),
        maxUses: linkForm.maxUses ? Number(linkForm.maxUses) : null
      };

      const result = await createJoinLink(meta.currentWorkspaceId, payload);
      if (result && result.success && result.data && result.data.token) {
        const joinUrl = `${window.location.origin}/accept-invite?token=${result.data.token}`;
        setGeneratedLink(joinUrl);
        if (pushToast) {
          pushToast('Join link generated successfully!');
        }
      } else {
        throw new Error('No token returned from server.');
      }
    } catch (err) {
      console.error(err);
      setLinkError(err.message || 'Failed to generate join link.');
    } finally {
      setLinkGenerating(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    if (pushToast) {
      pushToast('Invite link copied to clipboard!');
    }
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Modal title="Invite New Member" isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '1.25rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'email' ? 'var(--primary)' : 'var(--text-secondary)',
              paddingBottom: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              borderBottom: activeTab === 'email' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            ✉️ Invite by Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'link' ? 'var(--primary)' : 'var(--text-secondary)',
              paddingBottom: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              borderBottom: activeTab === 'link' ? '2px solid var(--primary)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            }}
          >
            🔗 Invite by Link
          </button>
        </div>

        {activeTab === 'email' ? (
          /* Invite by Email Tab */
          <div className="form-stack">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
              Send a unique invitation link to their inbox. They will join this workspace upon login.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address</label>
              <input
                className="text-input"
                type="email"
                placeholder="colleague@company.com"
                value={emailForm.email}
                onChange={(event) => setEmailForm({ ...emailForm, email: event.target.value })}
                disabled={emailSending}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Access Role</label>
              <select
                value={emailForm.role}
                onChange={(event) => setEmailForm({ ...emailForm, role: event.target.value })}
                disabled={emailSending}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--border)', background: '#080c14', color: 'var(--text-primary)' }}
              >
                <option value="editor">Editor (Can manage tasks & files)</option>
                <option value="admin">Admin (Full permissions except deletion)</option>
                <option value="viewer">Viewer (Read-only access)</option>
              </select>
            </div>

            {emailError && (
              <div className="form-error" style={{ fontSize: '13px', margin: 0 }}>
                {emailError}
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: '12px' }}>
              <button className="ghost-button" onClick={onClose} disabled={emailSending}>Cancel</button>
              <button className="primary-button" disabled={emailSending || !emailForm.email.trim()} onClick={handleEmailSubmit}>
                {emailSending ? 'Sending Invite...' : '✨ Send Invite'}
              </button>
            </div>
          </div>
        ) : (
          /* Invite by Link Tab */
          <div className="form-stack">
            {generatedLink ? (
              /* Display Generated Link */
              <div className="form-stack">
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Share this secure link with team members. Anyone with this link can request to join.
                </p>

                <div style={{ display: 'flex', gap: '8px', background: '#080c14', padding: '6px', borderRadius: '14px', border: '1px solid var(--border)', alignItems: 'center' }}>
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '12px', padding: '8px', outline: 'none' }}
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="primary-button"
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '10px', whiteSpace: 'nowrap' }}
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>

                <div className="modal-actions" style={{ marginTop: '16px' }}>
                  <button className="ghost-button" onClick={() => setGeneratedLink('')}>Generate New Link</button>
                  <button className="primary-button" onClick={onClose}>Done</button>
                </div>
              </div>
            ) : (
              /* Generate Link Options Form */
              <div className="form-stack">
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  Create a custom join link. You can review and approve joining requests before users enter the workspace.
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Default Requested Role</label>
                  <select
                    value={linkForm.role}
                    onChange={(event) => setLinkForm({ ...linkForm, role: event.target.value })}
                    disabled={linkGenerating}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--border)', background: '#080c14', color: 'var(--text-primary)' }}
                  >
                    <option value="editor">Editor (Can manage tasks & files)</option>
                    <option value="admin">Admin (Full permissions except deletion)</option>
                    <option value="viewer">Viewer (Read-only access)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Expiration</label>
                    <select
                      value={linkForm.expiresInDays}
                      onChange={(event) => setLinkForm({ ...linkForm, expiresInDays: event.target.value })}
                      disabled={linkGenerating}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--border)', background: '#080c14', color: 'var(--text-primary)' }}
                    >
                      <option value="1">24 Hours</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                      <option value="0">Never</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Usage Limit</label>
                    <input
                      className="text-input"
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={linkForm.maxUses}
                      onChange={(event) => setLinkForm({ ...linkForm, maxUses: event.target.value })}
                      disabled={linkGenerating}
                    />
                  </div>
                </div>

                {linkError && (
                  <div className="form-error" style={{ fontSize: '13px', margin: 0 }}>
                    {linkError}
                  </div>
                )}

                <div className="modal-actions" style={{ marginTop: '12px' }}>
                  <button className="ghost-button" onClick={onClose} disabled={linkGenerating}>Cancel</button>
                  <button className="primary-button" disabled={linkGenerating} onClick={handleGenerateLink}>
                    {linkGenerating ? 'Generating...' : '🔗 Generate Link'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </Modal>
  );
}
