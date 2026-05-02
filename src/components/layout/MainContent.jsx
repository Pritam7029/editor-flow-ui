import { useAppContext } from '../../context/AppContext';
import OverviewPage from '../../pages/OverviewPage';
import EditorsPage from '../../pages/EditorsPage';
import TasksPage from '../../pages/TasksPage';
import FilesPage from '../../pages/FilesPage';

export default function MainContent(props) {
  const { workspace, dispatch } = useAppContext();

  return (
    <main className="main-content">
      <div className="view-tabs">
        {['overview', 'editors', 'tasks', 'files'].map((view) => (
          <button
            key={view}
            className={`tab-button ${workspace.currentView === view ? 'tab-button-active' : ''}`}
            onClick={() => {
              dispatch({ type: 'SET_VIEW', view });
              props.onCloseMobile?.();
            }}
          >
            {view === 'files' ? '📁 Files' : view[0].toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
      {workspace.currentView === 'overview' && <OverviewPage {...props} />}
      {workspace.currentView === 'editors' && <EditorsPage {...props} />}
      {workspace.currentView === 'tasks' && <TasksPage {...props} />}
      {workspace.currentView === 'files' && <FilesPage {...props} />}
    </main>
  );
}
