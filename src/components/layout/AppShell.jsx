import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Header from './Header';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import ChatPanel from '../chat/ChatPanel';
import ToastStack from '../common/ToastStack';
import EditorModal from '../modals/EditorModal';
import TaskModal from '../modals/TaskModal';
import TaskDetailModal from '../modals/TaskDetailModal';
import TeamModal from '../modals/TeamModal';
import ColumnModal from '../modals/ColumnModal';
import FileViewerModal from '../modals/FileViewerModal';
import WorkspaceModal from '../modals/WorkspaceModal';
import AccountDrawer from '../modals/AccountDrawer';
import useRealtimeSync from '../../hooks/useRealtimeSync';

export default function AppShell() {
  useRealtimeSync();
  const {
    workspace,
    setPanelWidth,
    joinWorkspaceById,
    backendWorkspaces,
    backendWorkspaceLoading,
    backendWorkspaceError,
    refreshBackendWorkspaces,
    addBackendWorkspace,
  } = useAppContext();
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskDetailId, setTaskDetailId] = useState(null);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [columnEditing, setColumnEditing] = useState(false);
  const [fileViewerId, setFileViewerId] = useState(null);
  const [workspaceModalMode, setWorkspaceModalMode] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const [newWsName, setNewWsName] = useState('');
  const [creating, setCreating] = useState(false);
  const [onboardError, setOnboardError] = useState('');

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newWsName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setOnboardError('');
    try {
      await addBackendWorkspace(trimmed);
    } catch (err) {
      setOnboardError(err.message || 'Failed to create workspace. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const activeTask = useMemo(
    () => workspace ? workspace.tasks.find((task) => task.id === taskDetailId) || null : null,
    [taskDetailId, workspace],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteId = params.get('invite');
    if (inviteId) {
      joinWorkspaceById(inviteId);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [joinWorkspaceById]);

  useEffect(() => {
    const chatHandle = document.querySelector('.left-resizer');
    const sidebarHandle = document.querySelector('.right-resizer');
    if (!chatHandle || !sidebarHandle) return undefined;

    const bindResize = (handle, panel) => {
      const onMouseDown = (event) => {
        if (window.innerWidth <= 767) return;
        event.preventDefault();
        document.body.classList.add('panel-resizing');
        handle.classList.add('panel-resizer-active');

        const onMouseMove = (moveEvent) => {
          const nextWidth = panel === 'chat' ? moveEvent.clientX : window.innerWidth - moveEvent.clientX;
          setPanelWidth(panel, nextWidth);
        };

        const onMouseUp = () => {
          document.body.classList.remove('panel-resizing');
          handle.classList.remove('panel-resizer-active');
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      };

      handle.addEventListener('mousedown', onMouseDown);
      return () => handle.removeEventListener('mousedown', onMouseDown);
    };

    const unbindChat = bindResize(chatHandle, 'chat');
    const unbindSidebar = bindResize(sidebarHandle, 'sidebar');

    return () => {
      unbindChat();
      unbindSidebar();
    };
  }, [setPanelWidth]);

  if (backendWorkspaceLoading && (!backendWorkspaces || backendWorkspaces.length === 0)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'radial-gradient(circle at top left, rgba(139, 92, 246, .15), transparent 40%), radial-gradient(circle at bottom right, rgba(6, 182, 212, .1), transparent 40%), #080c14',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 0 40px rgba(139, 92, 246, 0.4)',
          animation: 'pulse 2s infinite ease-in-out',
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '24px'
        }}>
          ✦
        </div>
        <h3 style={{ margin: '0 0 8px', fontWeight: 600 }}>EditorFlow</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Syncing your collaborative space...</p>
        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); }
            50% { transform: scale(1.08); box-shadow: 0 0 60px rgba(6, 182, 212, 0.6); }
            100% { transform: scale(1); box-shadow: 0 0 40px rgba(139, 92, 246, 0.4); }
          }
        `}</style>
      </div>
    );
  }

  if (backendWorkspaceError && (!backendWorkspaces || backendWorkspaces.length === 0)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'radial-gradient(circle at top left, rgba(244, 63, 94, .1), transparent 45%), #080c14',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          padding: '32px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(244, 63, 94, 0.2)',
          background: 'rgba(8, 12, 20, 0.8)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(244, 63, 94, 0.1)',
            color: 'var(--rose)',
            fontSize: '28px',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 20px'
          }}>
            ⚠️
          </div>
          <h3 style={{ margin: '0 0 12px', fontSize: '20px' }}>Connection Issue</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
            {backendWorkspaceError || "We couldn't establish a secure connection to the EditorFlow backend service."}
          </p>
          <button
            className="primary-button full-width"
            onClick={() => refreshBackendWorkspaces()}
            style={{ padding: '12px', borderRadius: '999px', fontWeight: 600 }}
          >
            🔄 Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!backendWorkspaceLoading && (!backendWorkspaces || backendWorkspaces.length === 0)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, rgba(139, 92, 246, .2), transparent 45%), radial-gradient(circle at bottom right, rgba(6, 182, 212, .15), transparent 45%), #080c14',
        color: 'var(--text-primary)',
        fontFamily: 'Inter, sans-serif',
        padding: '24px'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          padding: '40px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          background: 'rgba(8, 12, 20, 0.75)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
            display: 'grid',
            placeItems: 'center',
            fontSize: '30px',
            fontWeight: 'bold',
            boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
            margin: '0 auto 24px'
          }}>
            ✦
          </div>
          
          <h2 style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
            Welcome to EditorFlow
          </h2>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 32px' }}>
            The collaborative, high-performance workspace platform for video and editorial production teams. Let's create your first workspace to get started!
          </p>

          <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Workspace Name
              </label>
              <input
                className="text-input"
                placeholder="e.g. Acme Video Team"
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                disabled={creating}
                required
                style={{ padding: '12px 16px', fontSize: '15px' }}
                autoFocus
              />
            </div>

            {onboardError && (
              <div className="form-error" style={{ fontSize: '13px', margin: 0 }}>
                {onboardError}
              </div>
            )}

            <button
              type="submit"
              className="primary-button full-width"
              disabled={creating || !newWsName.trim()}
              style={{
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {creating ? '🚀 Creating workspace...' : '✨ Create Workspace'}
            </button>
          </form>
        </div>
      </div>
    );
  }


  const closeMobilePanels = () => {
    setMobileSidebarOpen(false);
    setMobileChatOpen(false);
  };

  return (
    <div className="app-shell">
      <Header
        onOpenEditorModal={() => setEditorModalOpen(true)}
        onOpenTaskModal={() => setTaskModalOpen(true)}
        onOpenWorkspaceModal={setWorkspaceModalMode}
        onOpenAccount={() => setAccountOpen(true)}
        onOpenMobileChat={() => setMobileChatOpen(true)}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />
      <div className="app-body">
        <ChatPanel onCloseMobile={closeMobilePanels} mobileOpen={mobileChatOpen} onOpenTeamModal={() => setTeamModalOpen(true)} />
        <MainContent
          onOpenEditorModal={() => setEditorModalOpen(true)}
          onOpenTaskModal={() => setTaskModalOpen(true)}
          onOpenTaskDetail={setTaskDetailId}
          onOpenColumnModal={setColumnEditing}
          onOpenFileViewer={setFileViewerId}
          onCloseMobile={closeMobilePanels}
        />
        <Sidebar mobileOpen={mobileSidebarOpen} onCloseMobile={closeMobilePanels} />
        {(mobileSidebarOpen || mobileChatOpen) && <div className="mobile-overlay" onClick={closeMobilePanels} />}
      </div>

      <EditorModal isOpen={editorModalOpen} onClose={() => setEditorModalOpen(false)} />
      <TaskModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} />
      <TaskDetailModal task={activeTask} isOpen={Boolean(activeTask)} onClose={() => setTaskDetailId(null)} />
      <TeamModal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} />
      <ColumnModal column={columnEditing === 'new' ? null : columnEditing} isOpen={Boolean(columnEditing)} onClose={() => setColumnEditing(false)} />
      <FileViewerModal fileId={fileViewerId} isOpen={Boolean(fileViewerId)} onClose={() => setFileViewerId(null)} />
      <WorkspaceModal mode={workspaceModalMode} isOpen={Boolean(workspaceModalMode)} onClose={() => setWorkspaceModalMode(null)} />
      <AccountDrawer isOpen={accountOpen} onClose={() => setAccountOpen(false)} onOpenWorkspaceModal={setWorkspaceModalMode} />
      <ToastStack />
    </div>
  );
}
