import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';

const EMPTY_FORM = { title: '', type: 'video', priority: 'medium', assigneeId: '', deadline: '', status: '' };

export default function TaskModal({ isOpen, onClose }) {
  const { workspace, addTask } = useAppContext();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (isOpen) {
      const firstCol = workspace.columns[0];
      setForm({ ...EMPTY_FORM, status: firstCol ? firstCol.key : '' });
    }
  }, [isOpen, workspace.columns]);

  const handleSave = () => {
    if (!form.title.trim()) return;
    addTask({
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      assigneeId: form.assigneeId,
      deadline: form.deadline,
      status: form.status,
    });
    onClose();
  };

  return (
    <Modal title="Add New Task" isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <div className="form-group">
          <label className="form-label" htmlFor="task-modal-title">Task Title</label>
          <input
            id="task-modal-title"
            className="text-input"
            placeholder="Task title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>

        <div className="two-column-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="task-modal-type">Category</label>
            <select
              id="task-modal-type"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value })}
            >
              <option value="video">🎬 Video</option>
              <option value="photo">📷 Photo</option>
              <option value="audio">🎵 Audio</option>
              <option value="design">🎨 Design</option>
              <option value="other">📄 Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-modal-priority">Priority</label>
            <select
              id="task-modal-priority"
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="two-column-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="task-modal-status">Status</label>
            <select
              id="task-modal-status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              {workspace.columns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.emoji} {col.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="task-modal-assignee">Assignee</label>
            <select
              id="task-modal-assignee"
              value={form.assigneeId}
              onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}
            >
              <option value="">Unassigned</option>
              {workspace.editors.map((editor) => (
                <option key={editor.id} value={editor.id}>
                  {editor.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="task-modal-deadline">Deadline</label>
          <input
            id="task-modal-deadline"
            className="text-input"
            type="date"
            value={form.deadline}
            onChange={(event) => setForm({ ...form, deadline: event.target.value })}
          />
        </div>

        <div className="modal-actions">
          <button className="ghost-button" onClick={onClose}>Cancel</button>
          <button className="primary-button" onClick={handleSave}>Add Task</button>
        </div>
      </div>
    </Modal>
  );
}
