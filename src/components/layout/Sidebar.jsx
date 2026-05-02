import { useAppContext } from '../../context/AppContext';
import { getAvatarInitials, getEditorProgress } from '../../utils/helpers';

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const { workspace, dispatch } = useAppContext();

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="panel-resizer right-resizer" data-panel="sidebar" />
      <div className="mobile-panel-head">
        <strong>Editors</strong>
        <button className="icon-button" onClick={onCloseMobile}>✕</button>
      </div>
      <div className="sidebar-title">Editors</div>
      <div className="sidebar-list">
        {workspace.editors.length === 0 && <div className="empty-inline">No editors yet.</div>}
        {workspace.editors.map((editor) => {
          const progress = getEditorProgress(editor.id, workspace.tasks);
          return (
            <button
              className={`editor-list-item ${workspace.activeEditorId === editor.id ? 'editor-list-item-active' : ''}`}
              key={editor.id}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_EDITOR', editorId: editor.id });
                dispatch({ type: 'SET_VIEW', view: 'tasks' });
                onCloseMobile();
              }}
            >
              <div className="avatar-square" style={{ color: editor.color, background: `${editor.color}20` }}>{getAvatarInitials(editor.name)}</div>
              <div className="editor-list-copy">
                <strong>{editor.name}</strong>
                <small>{editor.role}</small>
              </div>
              <div className="mini-progress"><span style={{ width: `${progress.pct}%` }} /></div>
            </button>
          );
        })}
      </div>
      <div className="sidebar-footer">
        <button className="ghost-button full-width" onClick={() => { dispatch({ type: 'SET_VIEW', view: 'editors' }); onCloseMobile(); }}>☰ All Editors</button>
      </div>
    </aside>
  );
}
