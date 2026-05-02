import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { COLUMN_COLORS } from '../../utils/constants';
import { uid } from '../../utils/helpers';

const EMPTY_FORM = { title: '', type: 'video', priority: 'medium', assigneeId: '', deadline: '', statusInput: '' };

export default function TaskModal({ isOpen, onClose }) {
  const { workspace, addTask, updateWorkspace, pushToast } = useAppContext();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      const firstCol = workspace.columns[0];
      setForm({ ...EMPTY_FORM, statusInput: firstCol ? firstCol.label : '' });
    }
  }, [isOpen, workspace.columns]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    const trimmedStatus = form.statusInput.trim();
    const matched = workspace.columns.find(
      (col) => col.label.toLowerCase() === trimmedStatus.toLowerCase() || col.key === trimmedStatus,
    );

    if (matched) {
      // Existing column — use normal addTask
      addTask({ title: form.title.trim(), type: form.type, priority: form.priority, assigneeId: form.assigneeId, deadline: form.deadline, status: matched.key });
    } else {
      // New column — create column + task in ONE atomic dispatch
      const colKey = `col_${uid()}`;
      const taskId = uid();
      const randomColor = COLUMN_COLORS[Math.floor(Math.random() * COLUMN_COLORS.length)];
      const newCol = { key: colKey, label: trimmedStatus || 'New Status', emoji: '📌', color: randomColor };
      const newTask = { id: taskId, createdAt: Date.now(), comments: [], title: form.title.trim(), type: form.type, priority: form.priority, assigneeId: form.assigneeId, deadline: form.deadline, status: colKey };
      updateWorkspace((current) => ({
        ...current,
        columns: [...current.columns, newCol],
        tasks: [...current.tasks, newTask],
      }));
      pushToast(`Column "${newCol.label}" created.`);
      pushToast(`Task "${newTask.title}" added.`);
    }
    onClose();
  };

  return (
    <Modal title="Add New Task" isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <input className="text-input" placeholder="Task title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <div className="two-column-grid">
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="video">🎬 Video</option>
            <option value="photo">📷 Photo</option>
            <option value="audio">🎵 Audio</option>
            <option value="design">🎨 Design</option>
            <option value="other">📄 Other</option>
          </select>
          <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <select value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
          <option value="">Unassigned</option>
          {workspace.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.name}</option>)}
        </select>
        <input className="text-input" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />

        {/* Dynamic status field — type an existing name or a brand-new one */}
        <div style={{ position: 'relative' }}>
          <input
            id="task-modal-status"
            className="text-input"
            list="task-modal-status-list"
            placeholder="Status (pick existing or type new…)"
            value={form.statusInput}
            onChange={(event) => setForm({ ...form, statusInput: event.target.value })}
          />
          <datalist id="task-modal-status-list">
            {workspace.columns.map((col) => (
              <option key={col.key} value={col.label}>{col.emoji} {col.label}</option>
            ))}
          </datalist>
          {form.statusInput.trim() &&
            !workspace.columns.some((col) => col.label.toLowerCase() === form.statusInput.trim().toLowerCase()) && (
              <small style={{ color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                ✨ A new column "{form.statusInput.trim()}" will be created
              </small>
          )}
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={handleSave}>Add Task</button>
        </div>
      </div>
    </Modal>
  );
}
