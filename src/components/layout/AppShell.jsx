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

export default function AppShell() {
  const { workspace, setPanelWidth, joinWorkspaceById } = useAppContext();
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

  const activeTask = useMemo(
    () => workspace.tasks.find((task) => task.id === taskDetailId) || null,
    [taskDetailId, workspace.tasks],
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
      </div>
      {(mobileSidebarOpen || mobileChatOpen) && <div className="mobile-overlay" onClick={closeMobilePanels} />}

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
