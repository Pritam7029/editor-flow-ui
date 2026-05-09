import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { COLOR_OPTIONS } from '../../utils/constants';
import { API_BASE_URL } from '../../config/api';
const EMPTY = { name: '', email: '', role: '', status: 'active', color: '#8b5cf6' };

export default function EditorModal({ isOpen, onClose }) {
  const { addEditor, meta } = useAppContext();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);

  useEffect(() => { if (isOpen) setForm(EMPTY); }, [isOpen]);

  return (
    <Modal title="Add New Editor" isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <input className="text-input" placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <input className="text-input" type="email" placeholder="Email address" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className="text-input" placeholder="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} />
        <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
          <option value="active">🟢 Active</option>
          <option value="idle">🟡 Idle</option>
          <option value="offline">⚫ Offline</option>
        </select>
        <div className="color-picker">
          {COLOR_OPTIONS.map((color) => (
            <button type="button" key={color} className={`color-dot ${form.color === color ? 'color-dot-active' : ''}`} style={{ background: color }} onClick={() => setForm({ ...form, color })} />
          ))}
        </div>
        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="primary-button" disabled={sending} onClick={async () => {
            if (!form.name.trim() || !form.email.trim()) {
              alert('Please provide both name and email.');
              return;
            }
            
            setSending(true);
            const currentWorkspace = meta.workspaces.find(w => w.id === meta.currentWorkspaceId);
            const workspaceName = currentWorkspace?.name || 'EditorFlow Workspace';
            const inviteLink = `${window.location.origin}/?invite=${meta.currentWorkspaceId}`;
            
            try {
              const res = await fetch( `${API_BASE_URL}/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: form.email.trim(),
                  workspaceName,
                  inviteLink
                })
              });
              
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Failed to send invite');
              
              addEditor({ ...form, name: form.name.trim(), role: form.role.trim() || 'Editor' });
              alert('Invite sent successfully!');
              onClose();
            } catch (error) {
              console.error(error);
              alert(`Error sending invite: ${error.message}`);
            } finally {
              setSending(false);
            }
          }}>{sending ? 'Sending...' : 'Send Invite'}</button>
        </div>
      </div>
    </Modal>
  );
}
