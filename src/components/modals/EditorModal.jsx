import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { inviteMemberToWorkspace } from '../../services/workspaceApi';

const EMPTY = { email: '', role: 'editor' };

export default function EditorModal({ isOpen, onClose }) {
  const { meta, pushToast } = useAppContext();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const email = form.email.trim();
    if (!email) {
      setError('Please provide a valid email address.');
      return;
    }

    setSending(true);
    setError('');

    try {
      await inviteMemberToWorkspace(meta.currentWorkspaceId, email, form.role);
      if (pushToast) {
        pushToast(`Invitation sent successfully to ${email}!`);
      } else {
        alert(`Invitation sent successfully to ${email}!`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to send workspace invitation.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title="Invite New Member" isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.5 }}>
          Invite editors, administrators, or viewers to collaborate in this workspace. They will receive an email invitation with a secure link to join.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Email Address</label>
          <input
            className="text-input"
            type="email"
            placeholder="colleague@company.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            disabled={sending}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Access Role</label>
          <select
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value })}
            disabled={sending}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '14px', border: '1px solid var(--border)', background: '#080c14', color: 'var(--text-primary)' }}
          >
            <option value="editor">Editor (Can manage tasks & files)</option>
            <option value="admin">Admin (Full permissions except deletion)</option>
            <option value="viewer">Viewer (Read-only access)</option>
          </select>
        </div>

        {error && (
          <div className="form-error" style={{ fontSize: '13px', margin: 0 }}>
            {error}
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: '12px' }}>
          <button className="ghost-button" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="primary-button" disabled={sending || !form.email.trim()} onClick={handleSubmit}>
            {sending ? 'Sending Invite...' : '✨ Send Invite'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
