import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { supabase } from '../config/supabaseclient';
import { useAppContext } from './AppContext';
import { useEncryption } from './EncryptionContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export function SocketProvider({ children }) {
  const { meta } = useAppContext();
  const { deviceKeyId } = useEncryption();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const currentWorkspaceId = meta && meta.currentWorkspaceId;
  const currentUserId = meta && meta.account && meta.account.id;

  useEffect(() => {
    if (!currentUserId || !deviceKeyId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let active = true;
    let socketInstance = null;

    async function connectSocket() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const session = data && data.session;
        const token = session && session.access_token;
        if (!token) return;

        socketInstance = io(SOCKET_URL, {
          auth: {
            token: token,
            deviceKeyId: deviceKeyId
          },
          transports: ['websocket']
        });

        socketInstance.on('connect', () => {
          console.log('Socket connected:', socketInstance.id);
          if (active) {
            setIsConnected(true);
            
            // Immediately join the active workspace room if set
            if (currentWorkspaceId) {
              socketInstance.emit('workspace:join', { workspaceId: currentWorkspaceId }, (res) => {
                if (res && !res.success) {
                  console.error('Socket join workspace room failed:', res.error);
                }
              });
            }
          }
        });

        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
          if (active) {
            setIsConnected(false);
          }
        });

        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
        });

        if (active) {
          setSocket(socketInstance);
        }
      } catch (err) {
        console.error('Failed to establish socket connection:', err);
      }
    }

    connectSocket();

    return () => {
      active = false;
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [currentUserId, deviceKeyId]);

  // Handle joining workspace room when workspace ID changes
  useEffect(() => {
    if (socket && isConnected && currentWorkspaceId) {
      socket.emit('workspace:join', { workspaceId: currentWorkspaceId }, (res) => {
        if (res && !res.success) {
          console.error('Socket join workspace room failed:', res.error);
        }
      });
    }
  }, [socket, isConnected, currentWorkspaceId]);

  // Presence heartbeat interval
  useEffect(() => {
    if (!socket || !isConnected || !currentWorkspaceId) return;

    const interval = setInterval(() => {
      socket.emit('presence:heartbeat', { workspaceId: currentWorkspaceId });
    }, 30000);

    return () => clearInterval(interval);
  }, [socket, isConnected, currentWorkspaceId]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
