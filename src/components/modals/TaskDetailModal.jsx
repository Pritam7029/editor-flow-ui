import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { formatTime, renderMentions } from '../../utils/helpers';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { workspace, updateTask, deleteTaskById, addTaskComment } = useAppContext();
  const [form, setForm] = useState(task);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setForm(task ? { ...task } : null);
    setComment('');
  }, [task]);

  const freshTask = useMemo(
    () => workspace.tasks.find((item) => item.id === task?.id) || form,
    [workspace.tasks, task, form],
  );

  if (!freshTask) return null;

  const save = () => {
    updateTask(freshTask.id, {
      title: (form?.title || '').trim() || freshTask.title,
      type: form?.type || 'video',
      priority: form?.priority || 'medium',
      status: form?.status || freshTask.status,
      assigneeId: form?.assigneeId || '',
      deadline: form?.deadline || '',
    });
    onClose();
  };

  return (
    <Modal title={freshTask.title} isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <div className="form-group">
          <label className="form-label" htmlFor="task-detail-title">Task Title</label>
          <input
            id="task-detail-title"
            className="text-input"
            value={form?.title || ''}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
        </div>

        <div className="two-column-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="task-detail-type">Category</label>
            <select
              id="task-detail-type"
              value={form?.type || 'video'}
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
            <label className="form-label" htmlFor="task-detail-priority">Priority</label>
            <select
              id="task-detail-priority"
              value={form?.priority || 'medium'}
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
            <label className="form-label" htmlFor="task-detail-status">Status</label>
            <select
              id="task-detail-status"
              value={form?.status || ''}
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
            <label className="form-label" htmlFor="task-detail-assignee">Assignee</label>
            <select
              id="task-detail-assignee"
              value={form?.assigneeId || ''}
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
          <label className="form-label" htmlFor="task-detail-deadline">Deadline</label>
          <input
            id="task-detail-deadline"
            className="text-input"
            type="date"
            value={form?.deadline || ''}
            onChange={(event) => setForm({ ...form, deadline: event.target.value })}
          />
        </div>

        <div className="comment-block">
          <div className="section-title">Comments</div>
          <div className="comment-list">
            {!freshTask.comments.length && <div className="empty-inline">No comments yet.</div>}
            {freshTask.comments.map((item) => (
              <div className="comment-item" key={item.id}>
                <strong>{item.authorName}</strong>
                <small>{formatTime(item.ts)}</small>
                <div dangerouslySetInnerHTML={{ __html: renderMentions(item.text, workspace.editors) }} />
              </div>
            ))}
          </div>
          <div className="compose-row">
            <textarea
              className="text-input"
              rows={2}
              placeholder="Add a comment..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <button
              className="primary-button"
              onClick={() => {
                if (!comment.trim()) return;
                addTaskComment(freshTask.id, comment.trim(), workspace.senderId);
                setComment('');
              }}
            >
              ➤
            </button>
          </div>
        </div>

        <div className="modal-actions">
          <button className="danger-button" onClick={() => { deleteTaskById(freshTask.id); onClose(); }}>Delete</button>
          <button className="ghost-button" onClick={onClose}>Close</button>
          <button className="primary-button" onClick={save}>Save Changes</button>
        </div>
      </div>
    </Modal>
  );
}
