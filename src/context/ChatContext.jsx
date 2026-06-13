import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAppContext } from './AppContext';
import { useEncryption } from './EncryptionContext';
import { useSocket } from './SocketContext';
import {
  getChatThreads,
  createChatThread,
  getThreadMessages,
  sendThreadMessage,
  deleteChatMessage
} from '../services/chatApi';
import { decryptText, encryptText } from '../services/e2eeCrypto';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { workspace, meta } = useAppContext();
  const { workspaceKey, workspaceKeyId, deviceKeyId } = useEncryption();
  const { socket, isConnected } = useSocket();

  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentWorkspaceId = meta && meta.currentWorkspaceId;
  const currentUserId = meta && meta.account && meta.account.id;
  const activeConv = workspace && workspace.activeConv;

  const activeThreadRef = useRef(null);
  activeThreadRef.current = activeThread;

  // 1. Fetch threads when workspace changes
  const fetchThreads = async () => {
    if (!currentWorkspaceId || !currentUserId) return;
    try {
      const fetched = await getChatThreads(currentWorkspaceId);
      setThreads(fetched || []);
    } catch (err) {
      console.error('Failed to fetch chat threads:', err);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [currentWorkspaceId, currentUserId]);

  // 2. Resolve active thread based on navigation (Global, DM, or Team)
  useEffect(() => {
    if (!currentWorkspaceId || !currentUserId || !threads.length || !activeConv) {
      setActiveThread(null);
      return;
    }

    async function resolveActiveThread() {
      try {
        if (activeConv.type === 'global') {
          const generalThread = threads.find(t => t.type === 'workspace');
          if (generalThread) {
            setActiveThread(generalThread);
          }
        } else if (activeConv.type === 'dm') {
          const collaboratorId = activeConv.id;
          let dmThread = threads.find(t => {
            if (t.type !== 'dm') return false;
            const members = t.chat_thread_members || [];
            const userIds = members.map(m => m.user_id);
            return userIds.includes(currentUserId) && userIds.includes(collaboratorId);
          });

          if (!dmThread) {
            // Create DM thread on the fly
            const newThread = await createChatThread(currentWorkspaceId, {
              type: 'dm',
              memberIds: [collaboratorId]
            });
            setThreads(prev => [...prev, newThread]);
            setActiveThread(newThread);
          } else {
            setActiveThread(dmThread);
          }
        } else if (activeConv.type === 'team') {
          const teamId = activeConv.id;
          // For teams, we search for a group thread corresponding to teamId
          // Or we can query/create a group thread mapping. Let's find by type group and match metadata or create.
          let teamThread = threads.find(t => t.type === 'group' && t.encrypted_name === teamId);
          if (!teamThread) {
            // Create Group thread on the fly
            const teamDetails = workspace.chat.teams[teamId];
            const memberIds = teamDetails && teamDetails.memberIds ? teamDetails.memberIds : [];
            const newThread = await createChatThread(currentWorkspaceId, {
              type: 'group',
              encryptedName: teamId, // Store teamId in encryptedName field for identification
              memberIds: memberIds
            });
            setThreads(prev => [...prev, newThread]);
            setActiveThread(newThread);
          } else {
            setActiveThread(teamThread);
          }
        }
      } catch (err) {
        console.error('Failed to resolve active thread:', err);
      }
    }

    resolveActiveThread();
  }, [activeConv, threads, currentWorkspaceId, currentUserId]);

  // Helper: Decrypt message payload
  const decryptMessage = async (msg, key) => {
    if (!key) {
      return {
        ...msg,
        text: '[Message is locked - encryption key not loaded]',
        decrypted: false
      };
    }
    try {
      if (msg.encryptedBody && msg.bodyIv) {
        const plaintext = await decryptText(msg.encryptedBody, msg.bodyIv, key);
        return {
          ...msg,
          text: plaintext,
          decrypted: true
        };
      }
      return {
        ...msg,
        text: msg.text || '',
        decrypted: false
      };
    } catch (err) {
      console.error('Decryption failed for message:', msg.id, err);
      return {
        ...msg,
        text: '[Decryption Error]',
        decrypted: false
      };
    }
  };

  // 3. Fetch and decrypt messages when activeThread or workspaceKey changes
  useEffect(() => {
    if (!currentWorkspaceId || !activeThread) {
      setMessages([]);
      setTypingUsers([]);
      return;
    }

    let active = true;
    setLoading(true);

    async function loadAndDecrypt() {
      try {
        const fetchedMsgs = await getThreadMessages(currentWorkspaceId, activeThread.id);
        if (!active) return;

        const decrypted = [];
        for (let i = 0; i < fetchedMsgs.length; i++) {
          const dm = await decryptMessage(fetchedMsgs[i], workspaceKey);
          decrypted.push(dm);
        }

        if (active) {
          setMessages(decrypted);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadAndDecrypt();

    return () => {
      active = false;
    };
  }, [activeThread, workspaceKey, currentWorkspaceId]);

  // 4. Register Socket.IO listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join room for active thread if selected
    if (activeThread) {
      socket.emit('chat:join-thread', {
        workspaceId: currentWorkspaceId,
        threadId: activeThread.id
      });
    }

    const handleNewMessage = async (data) => {
      const msg = data && data.message;
      if (!msg) return;

      const actTh = activeThreadRef.current;
      if (actTh && msg.threadId === actTh.id) {
        const decrypted = await decryptMessage(msg, workspaceKey);
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === decrypted.id)) return prev;
          return [...prev, decrypted];
        });
      }
    };

    const handleMessageDeleted = (data) => {
      const messageId = data && data.messageId;
      const threadId = data && data.threadId;
      const actTh = activeThreadRef.current;
      if (actTh && threadId === actTh.id) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      }
    };

    const handlePresenceUpdate = (data) => {
      const users = data && data.onlineUsers;
      if (users) {
        setOnlineUsers(users);
      }
    };

    const handleTypingUpdate = (data) => {
      const tUsers = data && data.typingUsers;
      const threadId = data && data.threadId;
      const actTh = activeThreadRef.current;
      if (actTh && threadId === actTh.id) {
        // Exclude current user from typing indicators
        setTypingUsers((tUsers || []).filter(uid => uid !== currentUserId));
      }
    };

    socket.on('chat:new-message', handleNewMessage);
    socket.on('chat:message-deleted', handleMessageDeleted);
    socket.on('presence:update', handlePresenceUpdate);
    socket.on('chat:typing-update', handleTypingUpdate);

    return () => {
      if (activeThread) {
        socket.emit('chat:leave-thread', { threadId: activeThread.id });
      }
      socket.off('chat:new-message', handleNewMessage);
      socket.off('chat:message-deleted', handleMessageDeleted);
      socket.off('presence:update', handlePresenceUpdate);
      socket.off('chat:typing-update', handleTypingUpdate);
    };
  }, [socket, isConnected, activeThread, workspaceKey, currentUserId, currentWorkspaceId]);

  // Send message method
  const sendChatMessage = async (text) => {
    if (!activeThread || !workspaceKey || !workspaceKeyId || !deviceKeyId) {
      throw new Error('Chat encryption is locked or active conversation is loading');
    }

    try {
      const encrypted = await encryptText(text, workspaceKey);
      const payload = {
        encryptedBody: encrypted.ciphertext,
        bodyIv: encrypted.iv,
        encryptionAlgorithm: 'AES-GCM',
        workspaceKeyId: workspaceKeyId,
        senderDeviceKeyId: deviceKeyId,
        clientMessageId: 'client-' + Date.now()
      };

      // Send to REST
      const savedMsg = await sendThreadMessage(currentWorkspaceId, activeThread.id, payload);
      
      // Decrypt and display locally
      const decrypted = await decryptMessage(savedMsg, workspaceKey);
      setMessages(prev => {
        if (prev.some(m => m.id === decrypted.id)) return prev;
        return [...prev, decrypted];
      });

      return decrypted;
    } catch (err) {
      console.error('Failed to send E2EE message:', err);
      throw err;
    }
  };

  // Delete message method
  const deleteChatMessageById = async (messageId) => {
    if (!currentWorkspaceId) return;
    try {
      await deleteChatMessage(currentWorkspaceId, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      throw err;
    }
  };

  // Typing state emitters
  const startTyping = () => {
    if (socket && isConnected && activeThread) {
      socket.emit('chat:typing-start', {
        workspaceId: currentWorkspaceId,
        threadId: activeThread.id
      });
    }
  };

  const stopTyping = () => {
    if (socket && isConnected && activeThread) {
      socket.emit('chat:typing-stop', {
        workspaceId: currentWorkspaceId,
        threadId: activeThread.id
      });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        threads,
        activeThread,
        messages,
        onlineUsers,
        typingUsers,
        loading,
        sendMessage: sendChatMessage,
        deleteMessage: deleteChatMessageById,
        startTyping,
        stopTyping,
        fetchThreads
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
