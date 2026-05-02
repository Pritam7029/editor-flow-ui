import { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import { useAppContext } from '../../context/AppContext';
import { formatTime, renderMentions } from '../../utils/helpers';
import { uid } from '../../utils/helpers';
import { COLUMN_COLORS } from '../../utils/constants';

export default function TaskDetailModal({ task, isOpen, onClose }) {
  const { workspace, updateTask, deleteTaskById, addTaskComment, updateWorkspace, pushToast } = useAppContext();
  const [form, setForm] = useState(task);
  const [comment, setComment] = useState('');

  useEffect(() => {
    setForm(task ? { ...task, statusInput: workspace.columns.find((c) => c.key === task.status)?.label || task.status } : null);
    setComment('');
  }, [task, workspace.columns]);

  const freshTask = useMemo(
    () => workspace.tasks.find((item) => item.id === task?.id) || form,
    [workspace.tasks, task, form],
  );

  if (!freshTask) return null;

  const save = () => {
    const trimmedStatus = (form.statusInput || '').trim();
    const matched = workspace.columns.find(
      (col) => col.label.toLowerCase() === trimmedStatus.toLowerCase() || col.key === trimmedStatus,
    );

    if (matched) {
      updateTask(freshTask.id, {
        title: form.title.trim() || freshTask.title,
        type: form.type,
        status: matched.key,
        assigneeId: form.assigneeId,
        deadline: form.deadline,
      });
    } else {
      // New column — create column and update task in ONE atomic dispatch
      const colKey = `col_${uid()}`;
      const randomColor = COLUMN_COLORS[Math.floor(Math.random() * COLUMN_COLORS.length)];
      const newCol = { key: colKey, label: trimmedStatus || 'New Status', emoji: '📌', color: randomColor };
      const updatedTitle = form.title.trim() || freshTask.title;
      updateWorkspace((current) => ({
        ...current,
        columns: [...current.columns, newCol],
        tasks: current.tasks.map((t) =>
          t.id === freshTask.id
            ? { ...t, title: updatedTitle, type: form.type, status: colKey, assigneeId: form.assigneeId, deadline: form.deadline }
            : t
        ),
      }));
      pushToast(`Column "${newCol.label}" created.`);
    }
    onClose();
  };

  return (
    <Modal title={freshTask.title} isOpen={isOpen} onClose={onClose}>
      <div className="form-stack">
        <input className="text-input" value={form?.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        <div className="two-column-grid">
          <select value={form?.type || 'video'} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            <option value="video">🎬 Video</option>
            <option value="photo">📷 Photo</option>
            <option value="audio">🎵 Audio</option>
            <option value="design">🎨 Design</option>
            <option value="other">📄 Other</option>
          </select>
          {/* Dynamic status field */}
          <div>
            <input
              id="task-detail-status"
              className="text-input"
              list="task-detail-status-list"
              placeholder="Status…"
              value={form?.statusInput || ''}
              onChange={(event) => setForm({ ...form, statusInput: event.target.value })}
            />
            <datalist id="task-detail-status-list">
              {workspace.columns.map((col) => (
                <option key={col.key} value={col.label}>{col.emoji} {col.label}</option>
              ))}
            </datalist>
            {(form?.statusInput || '').trim() &&
              !workspace.columns.some((col) => col.label.toLowerCase() === (form?.statusInput || '').trim().toLowerCase()) && (
                <small style={{ color: 'var(--accent)', marginTop: '4px', display: 'block' }}>
                  ✨ New column will be created
                </small>
            )}
          </div>
        </div>
        <select value={form?.assigneeId || ''} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
          <option value="">Unassigned</option>
          {workspace.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.name}</option>)}
        </select>
        <input className="text-input" type="date" value={form?.deadline || ''} onChange={(event) => setForm({ ...form, deadline: event.target.value })} />

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
            <textarea className="text-input" rows={2} placeholder="Add a comment..." value={comment} onChange={(event) => setComment(event.target.value)} />
            <button className="primary-button" onClick={() => {
              if (!comment.trim()) return;
              addTaskComment(freshTask.id, comment.trim(), workspace.senderId);
              setComment('');
            }}>➤</button>
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
