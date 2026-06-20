import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';

export default function WorkspaceModal({ mode, isOpen, onClose }) {
  const {
    meta,
    createWorkspace,
    renameWorkspace,
    backendWorkspaces,
    addBackendWorkspace,
    editBackendWorkspace,
    refreshBackendWorkspaces
  } = useAppContext();

  const current = useMemo(() => {
    const backendList = backendWorkspaces || [];
    const localList = meta && meta.workspaces ? meta.workspaces : [];
    const currentWorkspaceId = meta ? meta.currentWorkspaceId : null;

    return (
      backendList.find((item) => item.id === currentWorkspaceId) ||
      localList.find((item) => item.id === currentWorkspaceId) ||
      null
    );
  }, [meta, backendWorkspaces]);

  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setName(mode === 'rename' && current ? current.name || '' : '');
    setError('');
    setSaving(false);
  }, [mode, isOpen, current]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName || saving) return;

    setSaving(true);
    setError('');

    try {
      if (mode === 'rename') {
        if (!meta || !meta.currentWorkspaceId) {
          throw new Error('No active workspace selected');
        }

        if (editBackendWorkspace) {
          await editBackendWorkspace(meta.currentWorkspaceId, trimmedName);
        } else {
          renameWorkspace(meta.currentWorkspaceId, trimmedName);
        }
      } else {
        if (addBackendWorkspace) {
          await addBackendWorkspace(trimmedName);
        } else {
          createWorkspace(trimmedName);
        }
      }

      if (refreshBackendWorkspaces) {
        await refreshBackendWorkspaces();
      }

      setName('');
      onClose();
    } catch (error) {
      console.error('Workspace save failed:', error);

      const message =
        error && error.message
          ? error.message
          : 'Failed to save workspace';

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={mode === 'rename' ? 'Rename Workspace' : 'New Workspace'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="form-stack">
        <input
          className="text-input"
          placeholder="Workspace name"
          value={name}
          disabled={saving}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSubmit();
            }
          }}
        />

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button
            className="ghost-button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
          >
            {saving
              ? 'Saving...'
              : mode === 'rename'
                ? 'Rename'
                : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}