import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';

export default function TeamModal({ isOpen, onClose }) {
  const { workspace, createTeam } = useAppContext();
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);

  useEffect(() => { if (isOpen) { setName(''); setMembers([]); } }, [isOpen]);

  return (
    <Modal title="Create Team Group" isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <input className="text-input" placeholder="Team name" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="checklist-box">
          {workspace.editors.length === 0 && <div className="empty-inline">Add editors first.</div>}
          {workspace.editors.map((editor) => (
            <label className="check-row" key={editor.id}>
              <input type="checkbox" checked={members.includes(editor.id)} onChange={(event) => setMembers((current) => event.target.checked ? [...current, editor.id] : current.filter((item) => item !== editor.id))} />
              <span>{editor.name}</span>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => {
            if (!name.trim() || members.length === 0) return;
            createTeam(name.trim(), members);
            onClose();
          }}>Create Team</button>
        </div>
      </div>
    </Modal>
  );
}
