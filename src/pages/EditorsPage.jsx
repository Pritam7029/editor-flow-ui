import { useAppContext } from '../context/AppContext';
import { getAvatarInitials, getEditorProgress, getEditorStatusBadge } from '../utils/helpers';
import { canManageEditors } from '../utils/rbac';

export default function EditorsPage({ onOpenEditorModal }) {
  const { workspace, meta, deleteEditorById, dispatch } = useAppContext();

  return (
    <section className="page-stack">
      <div className="section-header-row">
        <div>
          <h2>All Editors</h2>
          <p>Manage your team members.</p>
        </div>
        {canManageEditors(meta.account.id, workspace) && (
          <button className="primary-button" onClick={onOpenEditorModal}>＋ Add Editor</button>
        )}
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
              <div className="card-actions">
                <button className="ghost-button" onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_EDITOR', editorId: editor.id });
                  dispatch({ type: 'SET_VIEW', view: 'tasks' });
                }}>📋 Tasks</button>
                {canManageEditors(meta.account.id, workspace) && (
                  <button className="danger-button" onClick={() => deleteEditorById(editor.id)}>🗑 Delete</button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
