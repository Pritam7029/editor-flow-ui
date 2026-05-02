import { useAppContext } from '../context/AppContext';
import { getAvatarInitials, getEditorProgress, getEditorStatusBadge } from '../utils/helpers';

export default function OverviewPage() {
  const { workspace, dispatch } = useAppContext();

  return (
    <div className="page-stack">
      <div className="stats-grid">
        <article className="stat-card"><span>👥</span><strong>{workspace.editors.length}</strong><small>Total Editors</small></article>
        <article className="stat-card"><span>📋</span><strong>{workspace.tasks.length}</strong><small>Total Tasks</small></article>
        <article className="stat-card"><span>✅</span><strong>{workspace.tasks.filter((task) => task.status === 'done').length}</strong><small>Completed</small></article>
        <article className="stat-card"><span>⚡</span><strong>{workspace.tasks.filter((task) => task.status === 'inprogress').length}</strong><small>In Progress</small></article>
      </div>
      <section>
        <div className="section-heading-block">
          <h2>Editor Progress</h2>
          <p>Click an editor to jump into their tasks.</p>
        </div>
        <div className="card-grid">
          {workspace.editors.length === 0 && <div className="empty-card">No editors yet.</div>}
          {workspace.editors.map((editor) => {
            const progress = getEditorProgress(editor.id, workspace.tasks);
            const badge = getEditorStatusBadge(editor, progress);
            return (
              <article className="person-card" key={editor.id}>
                <div className="person-card-head">
                  <div className="avatar-square large" style={{ color: editor.color, background: `${editor.color}20` }}>{getAvatarInitials(editor.name)}</div>
                  <div>
                    <h3>{editor.name}</h3>
                    <p>{editor.role}</p>
                  </div>
                  <span className={`badge badge-${badge.tone}`}>{badge.label}</span>
                </div>
                <div className="progress-label-row"><span>Progress</span><strong>{progress.pct}%</strong></div>
                <div className="progress-track"><span style={{ width: `${progress.pct}%` }} /></div>
                <div className="mini-stat-row">
                  <div><strong>{progress.todo}</strong><small>To Do</small></div>
                  <div><strong>{progress.inprogress}</strong><small>In Progress</small></div>
                  <div><strong>{progress.done}</strong><small>Done</small></div>
                </div>
                <button className="ghost-button full-width" onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_EDITOR', editorId: editor.id });
                  dispatch({ type: 'SET_VIEW', view: 'tasks' });
                }}>📋 View Tasks</button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
