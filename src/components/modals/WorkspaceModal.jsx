import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';

export default function WorkspaceModal({ mode, isOpen, onClose }) {
  const { meta, createWorkspace, renameWorkspace } = useAppContext();
  const current = useMemo(() => meta.workspaces.find((item) => item.id === meta.currentWorkspaceId), [meta]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(mode === 'rename' ? current?.name || '' : '');
  }, [mode, isOpen, current]);

  return (
    <Modal title={mode === 'rename' ? 'Rename Workspace' : 'New Workspace'} isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <input className="text-input" placeholder="Workspace name" value={name} onChange={(event) => setName(event.target.value)} />
        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => {
            if (!name.trim()) return;
            if (mode === 'rename') renameWorkspace(meta.currentWorkspaceId, name.trim());
            else createWorkspace(name.trim());
            onClose();
          }}>{mode === 'rename' ? 'Rename' : 'Create'}</button>
        </div>
      </div>
    </Modal>
  );
}
