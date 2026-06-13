import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAppContext } from '../context/AppContext';

export default function useRealtimeSync() {
  const { socket, isConnected } = useSocket();
  const { meta, dispatch } = useAppContext();
  const currentWorkspaceId = meta && meta.currentWorkspaceId;
  const currentUserId = meta && meta.account && meta.account.id;

  useEffect(() => {
    if (!socket || !isConnected || !currentWorkspaceId) return;

    // --- Board (Columns & Tasks) Events ---
    
    // Column Created
    const handleColumnCreated = ({ column }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const columns = current.columns || [];
          if (columns.some(c => c.id === column.id)) return current;
          return {
            ...current,
            columns: [...columns, column].sort((a, b) => a.position - b.position)
          };
        }
      });
    };

    // Column Updated
    const handleColumnUpdated = ({ column }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const columns = (current.columns || []).map(c => c.id === column.id ? column : c);
          return {
            ...current,
            columns: columns.sort((a, b) => a.position - b.position)
          };
        }
      });
    };

    // Column Deleted
    const handleColumnDeleted = ({ columnId }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          return {
            ...current,
            columns: (current.columns || []).filter(c => c.id !== columnId)
          };
        }
      });
    };

    // Columns Reordered
    const handleColumnsReordered = ({ keys }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const columns = (current.columns || []).map(c => {
            const index = keys.indexOf(c.key);
            return { ...c, position: index !== -1 ? index : c.position };
          });
          return {
            ...current,
            columns: columns.sort((a, b) => a.position - b.position)
          };
        }
      });
    };

    // Task Created
    const handleTaskCreated = ({ task }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const tasks = current.tasks || [];
          if (tasks.some(t => t.id === task.id)) return current;
          return {
            ...current,
            tasks: [...tasks, task].sort((a, b) => a.position - b.position)
          };
        }
      });
    };

    // Task Updated
    const handleTaskUpdated = ({ task }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const tasks = (current.tasks || []).map(t => t.id === task.id ? { ...t, ...task } : t);
          return {
            ...current,
            tasks: tasks.sort((a, b) => a.position - b.position)
          };
        }
      });
    };

    // Task Deleted
    const handleTaskDeleted = ({ taskId }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          return {
            ...current,
            tasks: (current.tasks || []).filter(t => t.id !== taskId)
          };
        }
      });
    };

    // Task Comment Added
    const handleTaskCommentAdded = ({ taskId, comment }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const tasks = (current.tasks || []).map(t => {
            if (t.id !== taskId) return t;
            const comments = t.comments || [];
            if (comments.some(c => c.id === comment.id)) return t;
            return {
              ...t,
              comments: [...comments, comment].sort((a, b) => a.ts - b.ts)
            };
          });
          return { ...current, tasks };
        }
      });
    };

    // --- Files & Video Review Events ---

    // File Uploaded / Created
    const handleFileUploaded = ({ fileId, file, version }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const files = current.files || [];
          const existingFile = files.find(f => f.id === fileId);

          if (existingFile) {
            const updatedFiles = files.map(f => {
              if (f.id !== fileId) return f;
              const versions = f.versions || [];
              const commentList = f.comments || [];
              const hasVersion = versions.some(v => v.id === version.id);
              
              const newVersions = hasVersion 
                ? versions.map(v => v.id === version.id ? { ...v, ...version } : v)
                : [...versions, version].sort((a, b) => a.versionNumber - b.versionNumber);

              return {
                ...f,
                ...file,
                versions: newVersions,
                comments: commentList
              };
            });
            return { ...current, files: updatedFiles };
          } else {
            const formattedFile = {
              ...file,
              versions: version ? [version] : [],
              comments: []
            };
            return {
              ...current,
              files: [formattedFile, ...files]
            };
          }
        }
      });
    };

    // File Deleted
    const handleFileDeleted = ({ fileId }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          return {
            ...current,
            files: (current.files || []).filter(f => f.id !== fileId)
          };
        }
      });
    };

    // File Comment / Revision Created
    const handleRevisionCreated = ({ fileId, comment }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const files = (current.files || []).map(f => {
            if (f.id !== fileId) return f;
            const comments = f.comments || [];
            if (comments.some(c => c.id === comment.id)) return f;
            return {
              ...f,
              comments: [...comments, comment].sort((a, b) => a.ts - b.ts)
            };
          });
          return { ...current, files };
        }
      });
    };

    // File Comment / Revision Updated (e.g. resolved)
    const handleRevisionUpdated = ({ fileId, comment }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const files = (current.files || []).map(f => {
            if (f.id !== fileId) return f;
            const comments = (f.comments || []).map(c => c.id === comment.id ? comment : c);
            return {
              ...f,
              comments: comments.sort((a, b) => a.ts - b.ts)
            };
          });
          return { ...current, files };
        }
      });
    };

    // File Comment / Revision Deleted
    const handleRevisionDeleted = ({ fileId, revisionId }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const files = (current.files || []).map(f => {
            if (f.id !== fileId) return f;
            return {
              ...f,
              comments: (f.comments || []).filter(c => c.id !== revisionId)
            };
          });
          return { ...current, files };
        }
      });
    };

    // File Permissions Updated
    const handlePermissionsUpdated = ({ fileId, visibleTo }) => {
      dispatch({
        type: 'UPDATE_WORKSPACE',
        updater: (current) => {
          const files = (current.files || []).map(f => {
            if (f.id !== fileId) return f;
            return {
              ...f,
              visibleTo
            };
          });
          return { ...current, files };
        }
      });
    };

    // --- Socket Listeners Registration ---
    
    socket.on('board:column-created', handleColumnCreated);
    socket.on('board:column-updated', handleColumnUpdated);
    socket.on('board:column-deleted', handleColumnDeleted);
    socket.on('board:columns-reordered', handleColumnsReordered);

    socket.on('board:task-created', handleTaskCreated);
    socket.on('board:task-updated', handleTaskUpdated);
    socket.on('board:task-deleted', handleTaskDeleted);
    socket.on('board:task-comment-added', handleTaskCommentAdded);

    socket.on('files:uploaded', handleFileUploaded);
    socket.on('files:file-deleted', handleFileDeleted);
    socket.on('files:revision-created', handleRevisionCreated);
    socket.on('files:revision-updated', handleRevisionUpdated);
    socket.on('files:revision-deleted', handleRevisionDeleted);
    socket.on('files:permissions-updated', handlePermissionsUpdated);

    // Cleanup listeners
    return () => {
      socket.off('board:column-created', handleColumnCreated);
      socket.off('board:column-updated', handleColumnUpdated);
      socket.off('board:column-deleted', handleColumnDeleted);
      socket.off('board:columns-reordered', handleColumnsReordered);

      socket.off('board:task-created', handleTaskCreated);
      socket.off('board:task-updated', handleTaskUpdated);
      socket.off('board:task-deleted', handleTaskDeleted);
      socket.off('board:task-comment-added', handleTaskCommentAdded);

      socket.off('files:uploaded', handleFileUploaded);
      socket.off('files:file-deleted', handleFileDeleted);
      socket.off('files:revision-created', handleRevisionCreated);
      socket.off('files:revision-updated', handleRevisionUpdated);
      socket.off('files:revision-deleted', handleRevisionDeleted);
      socket.off('files:permissions-updated', handlePermissionsUpdated);
    };
  }, [socket, isConnected, currentWorkspaceId, currentUserId, dispatch]);
}
