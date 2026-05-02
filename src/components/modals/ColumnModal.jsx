import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { COLUMN_COLORS } from '../../utils/constants';

export default function ColumnModal({ column, isOpen, onClose }) {
  const { addColumn, updateColumn, deleteColumnByKey, createColumnDraft } = useAppContext();
  const [draft, setDraft] = useState(createColumnDraft());

  useEffect(() => {
    if (!isOpen) return;
    setDraft(column && !column.deleteMode ? { label: column.label, emoji: column.emoji, color: column.color } : createColumnDraft());
  }, [column, isOpen, createColumnDraft]);

  if (column?.deleteMode) {
    return (
      <Modal title="Delete Column" isOpen={isOpen} onClose={onClose}>
        <div className="form-stack">
          <p className="muted-copy">Tasks in this column will be moved to the first remaining column.</p>
          <div className="modal-actions">
            <button className="ghost-button" onClick={onClose}>Cancel</button>
            <button className="danger-button" onClick={() => { deleteColumnByKey(column.key); onClose(); }}>Delete</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={column ? 'Edit Column' : 'New Status Column'} isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <input className="text-input" placeholder="Column name" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
        <input className="text-input" placeholder="Emoji" value={draft.emoji} onChange={(event) => setDraft({ ...draft, emoji: event.target.value })} />
        <div className="color-picker grid-picker">
          {COLUMN_COLORS.map((color) => (
            <button type="button" key={color} className={`color-dot ${draft.color === color ? 'color-dot-active' : ''}`} style={{ background: color }} onClick={() => setDraft({ ...draft, color })} />
          ))}
        </div>
        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={() => {
            if (!draft.label.trim()) return;
            if (column) updateColumn(column.key, { ...draft, label: draft.label.trim(), emoji: draft.emoji.trim() || '📌' });
            else addColumn({ ...draft, label: draft.label.trim(), emoji: draft.emoji.trim() || '📌' });
            onClose();
          }}>{column ? 'Save Column' : 'Add Column'}</button>
        </div>
      </div>
    </Modal>
  );
}
