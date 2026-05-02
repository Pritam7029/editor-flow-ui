import { Fragment, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatDate, getAvatarInitials, isOverdue, renderMentions, formatTime } from '../utils/helpers';

function TaskCommentPanel({ task }) {
  const { workspace, addTaskComment } = useAppContext();
  const [text, setText] = useState('');

  return (
    <div className="task-comment-panel" onClick={(event) => event.stopPropagation()}>
      <div className="comment-list compact">
        {!task.comments.length && <div className="empty-inline">No comments yet.</div>}
        {task.comments.map((item) => (
          <div className="comment-item" key={item.id}>
            <strong>{item.authorName}</strong>
            <small>{formatTime(item.ts)}</small>
            <div dangerouslySetInnerHTML={{ __html: renderMentions(item.text, workspace.editors) }} />
          </div>
        ))}
      </div>
      <div className="compose-row compact-gap">
        <textarea
          className="text-input"
          rows={1}
          placeholder="Add a comment..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              if (!text.trim()) return;
              addTaskComment(task.id, text.trim(), workspace.senderId);
              setText('');
            }
          }}
        />
        <button
          className="primary-button small"
          onClick={() => {
            if (!text.trim()) return;
            addTaskComment(task.id, text.trim(), workspace.senderId);
            setText('');
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  editor,
  onOpenTaskDetail,
  targetStatus,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragEnter,
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <div
      className={`task-card ${isDragging ? 'task-card-dragging' : ''}`}
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        onDragStart(event, task.id);
      }}
      onDragEnd={onDragEnd}
      onDragEnter={(event) => onDragEnter(event, task.id)}
      onClick={() => onOpenTaskDetail(task.id)}
    >
      <h4>{task.title}</h4>
      <div className="task-meta-row">
        <span className={`chip chip-${task.type || 'other'}`}>{task.type || 'other'}</span>
        {editor && (
          <span className="task-assignee-inline">
            <span className="avatar-square tiny" style={{ color: editor.color, background: `${editor.color}20` }}>
              {getAvatarInitials(editor.name)}
            </span>
            {editor.name.split(' ')[0]}
          </span>
        )}
      </div>
      {task.deadline && (
        <small className={isOverdue(task.deadline) && targetStatus !== 'done' ? 'danger-text' : ''}>
          📅 {formatDate(task.deadline)}
        </small>
      )}
      <button
        className="comment-toggle"
        onClick={(event) => {
          event.stopPropagation();
          setCommentsOpen((value) => !value);
        }}
      >
        💬 {task.comments.length ? `${task.comments.length} comments` : 'Comment'}
      </button>
      {commentsOpen && <TaskCommentPanel task={task} />}
    </div>
  );
}

export default function TasksPage({ onOpenTaskModal, onOpenTaskDetail, onOpenColumnModal }) {
  const { workspace, moveTask, moveColumn } = useAppContext();
  const [filterEditorId, setFilterEditorId] = useState(workspace.activeEditorId || '');
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragColumnKey, setDragColumnKey] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const boardRef = useRef(null);

  useEffect(() => {
    setFilterEditorId(workspace.activeEditorId || '');
  }, [workspace.activeEditorId]);

  const getColumnTasks = (columnKey) => (
    workspace.tasks.filter((task) => task.status === columnKey && (!filterEditorId || task.assigneeId === filterEditorId))
  );

  const resolveDropIndex = (listElement, event, fallbackCount) => {
    if (!listElement) return fallbackCount;
    const cards = [...listElement.querySelectorAll('.task-card:not(.task-card-dragging)')];
    for (let index = 0; index < cards.length; index += 1) {
      const rect = cards[index].getBoundingClientRect();
      if (event.clientY < rect.top + rect.height / 2) return index;
    }
    return cards.length;
  };

  const handleDragStart = (event, taskId) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/task-id', taskId);
    setDragTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDropTarget(null);
  };

  const handleColumnDragOver = (event, columnKey) => {
    if (dragColumnKey) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const listElement = event.currentTarget.querySelector('.task-list-column');
    const fallbackCount = getColumnTasks(columnKey).filter((task) => task.id !== dragTaskId).length;
    const nextIndex = resolveDropIndex(listElement, event, fallbackCount);
    setDropTarget({ columnKey, index: nextIndex });
  };

  const handleCardDragEnter = (event, columnKey, taskId) => {
    if (!dragTaskId || dragTaskId === taskId) return;
    const listElement = event.currentTarget.closest('.task-list-column');
    const fallbackCount = getColumnTasks(columnKey).filter((task) => task.id !== dragTaskId).length;
    const nextIndex = resolveDropIndex(listElement, event, fallbackCount);
    setDropTarget({ columnKey, index: nextIndex });
  };

  const handleDrop = (event, columnKey) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/task-id') || dragTaskId;
    if (!taskId) return;

    const visibleTasks = getColumnTasks(columnKey).filter((task) => task.id !== taskId);
    const targetIndex = dropTarget?.columnKey === columnKey ? Math.min(dropTarget.index, visibleTasks.length) : visibleTasks.length;
    moveTask(taskId, columnKey, targetIndex);
    setDragTaskId(null);
    setDropTarget(null);
  };

  return (
    <section className="page-stack">
      <div className="section-header-row">
        <div>
          <h2>Task Board</h2>
          <p>Track all work across editors.</p>
        </div>
        <div className="header-inline-actions">
          <select value={filterEditorId} onChange={(event) => setFilterEditorId(event.target.value)}>
            <option value="">All Editors</option>
            {workspace.editors.map((editor) => <option key={editor.id} value={editor.id}>{editor.name}</option>)}
          </select>
          <button className="primary-button" onClick={onOpenTaskModal}>＋ Add Task</button>
        </div>
      </div>
      <div className="board-scroll" ref={boardRef}>
        {workspace.columns.map((column) => {
          const tasks = getColumnTasks(column.key);
          const renderIndicator = (index) => (
            dragTaskId && dropTarget?.columnKey === column.key && dropTarget.index === index
              ? <div className="task-drop-indicator" />
              : null
          );

          return (
            <section
              className={`task-column ${dropTarget?.columnKey === column.key && !dragColumnKey ? 'task-column-drop' : ''} ${dragColumnKey === column.key ? 'task-card-dragging' : ''}`}
              key={column.key}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/column-key', column.key);
                setDragColumnKey(column.key);
              }}
              onDragEnd={() => {
                setDragColumnKey(null);
                setDropTarget(null);
              }}
              onDragOver={(event) => handleColumnDragOver(event, column.key)}
              onDrop={(event) => {
                const columnDragKey = event.dataTransfer.getData('text/column-key') || dragColumnKey;
                if (columnDragKey) {
                  event.preventDefault();
                  event.stopPropagation();
                  if (columnDragKey !== column.key) {
                    const targetIndex = workspace.columns.findIndex(c => c.key === column.key);
                    moveColumn(columnDragKey, targetIndex);
                  }
                  setDragColumnKey(null);
                } else {
                  handleDrop(event, column.key);
                }
              }}
              onDragLeave={(event) => {
                if (!dragColumnKey && !event.currentTarget.contains(event.relatedTarget)) {
                  setDropTarget((current) => (current?.columnKey === column.key ? null : current));
                }
              }}
            >
              <div className="task-column-head" style={{ cursor: 'grab' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: column.color, fontSize: '12px' }}>●</span>
                  <strong>{column.label}</strong>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '4px 8px' }}>
                    {tasks.length}
                  </span>
                </div>
                <div className="header-inline-actions" style={{ gap: '4px' }}>
                  <button className="text-button small" style={{ fontSize: '14px' }} onClick={() => onOpenColumnModal(column)} title="Edit Board">✏️</button>
                  <button className="text-button small" style={{ fontSize: '14px' }} onClick={() => onOpenColumnModal({ ...column, deleteMode: true })} title="Delete Board">🗑</button>
                  <span className="text-button small" style={{ opacity: 0.5, cursor: 'grab' }} title="Drag to reorder">☰</span>
                </div>
              </div>
              <div className="task-list-column">
                {!tasks.length && dragTaskId && dropTarget?.columnKey === column.key && !dragColumnKey && <div className="task-drop-indicator task-drop-indicator-empty" />}
                {tasks.length === 0 && <div className="empty-inline dashed">Drop cards here</div>}
                {tasks.map((task, index) => (
                  <Fragment key={task.id}>
                    {renderIndicator(index)}
                    <TaskCard
                      key={task.id}
                      task={task}
                      editor={workspace.editors.find((editor) => editor.id === task.assigneeId)}
                      onOpenTaskDetail={onOpenTaskDetail}
                      targetStatus={column.key}
                      isDragging={dragTaskId === task.id}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragEnter={(event) => handleCardDragEnter(event, column.key, task.id)}
                    />
                  </Fragment>
                ))}
                {renderIndicator(tasks.length)}
              </div>
            </section>
          );
        })}
        <section className="task-column add-column-tile">
          <button className="ghost-button full-width tall" onClick={() => onOpenColumnModal('new')}>＋ Add Status</button>
        </section>
      </div>
    </section>
  );
}
