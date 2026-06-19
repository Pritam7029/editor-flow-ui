import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useChat } from '../../context/ChatContext';
import { useEncryption } from '../../context/EncryptionContext';
import { CHANNELS } from '../../utils/constants';
import { isAdmin } from '../../utils/rbac';
import { useFullscreenPanel } from '../../hooks/useFullscreenPanel';
import {
  extractMentions,
  formatTime,
  getAvatarInitials,
  getConversationLabel,
  getDomain,
  getLinkIcon,
  renderMentions,
} from '../../utils/helpers';

function MessageBubble({ message, editors, sourceLabel }) {
  const editor = editors.find((item) => item.id === message.senderId);
  const urls = (message.text && message.text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi)) || [];
  const cleanText = message.text ? message.text.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, '').trim() : '';

  return (
    <>
      {sourceLabel && <div className="tagged-source-label">{sourceLabel}</div>}
      <div className={`message-bubble ${extractMentions(message.text || '', editors).length ? 'message-tagged' : ''}`}>
        <div className="avatar-square" style={{ color: (editor && editor.color) || '#8b5cf6', background: `${(editor && editor.color) || '#8b5cf6'}20` }}>
          {editor ? getAvatarInitials(editor.name) : 'A'}
        </div>
        <div className="message-body">
          <div className="message-meta">
            <strong>{message.senderName}</strong>
            <small>{formatTime(message.ts)}</small>
          </div>
          {cleanText && <div className="message-text" dangerouslySetInnerHTML={{ __html: renderMentions(cleanText, editors) }} />}
          {urls.map((url) => {
            const href = url.startsWith('http') ? url : `https://${url}`;
            return (
              <a className="link-card" href={href} key={`${message.id}-${url}`} rel="noreferrer" target="_blank">
                <span className="link-emoji">{getLinkIcon(url)}</span>
                <span className="link-copy">
                  <strong>{href}</strong>
                  <small>{getDomain(url)}</small>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function ChatPanel({ onOpenTeamModal, mobileOpen, onCloseMobile }) {
  const { workspace, meta, dispatch } = useAppContext();
  
  // Connect to E2EE and socket chat contexts
  const { 
    messages: e2eeMessages, 
    sendMessage, 
    startTyping, 
    stopTyping, 
    typingUsers, 
    onlineUsers,
    loading: chatLoading 
  } = useChat();

  const { 
    isWorkspaceLocked, 
    isEncryptionSetup,
    initializeWorkspaceEncryption, 
    loading: encryptionLoading 
  } = useEncryption();

  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useFullscreenPanel();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [mobileView, setMobileView] = useState('list');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      setMobileView('list');
    }
  }, [mobileOpen]);

  const activeMessages = useMemo(() => {
    if (!e2eeMessages) return [];
    
    if (workspace.activeChannel === 'links') {
      return e2eeMessages.filter(m => {
        const txt = m.text || '';
        return txt.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi);
      });
    }
    
    if (workspace.activeChannel === 'tagged') {
      return e2eeMessages.filter(m => {
        const txt = m.text || '';
        const userName = meta && meta.account && meta.account.name ? meta.account.name.split(' ')[0] : '';
        return userName && txt.toLowerCase().includes('@' + userName.toLowerCase());
      });
    }
    
    return e2eeMessages;
  }, [e2eeMessages, workspace.activeChannel, meta]);

  const activeHeader = useMemo(
    () => getConversationLabel(workspace, workspace.activeConv, workspace.activeChannel),
    [workspace],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeMessages, typingUsers]);

  const submitMessage = () => {
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
    stopTyping();
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (event) => {
    setText(event.target.value);
    startTyping();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  };

  // UI state for approval/creation
  const isOwner = meta && meta.account && workspace && (meta.account.id === workspace.ownerId);

  return (
    <aside className={`chat-panel ${mobileOpen ? 'mobile-open' : ''} ${isFullscreen ? 'panel-fullscreen' : ''}`}>
      <div className="panel-resizer left-resizer" data-panel="chat" />

      <div className="chat-layout">
        {(!isMobile || mobileView === 'list') && (
          <div className="chat-conversations">
            <div className="mobile-panel-head only-mobile" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
              <strong>Chat List</strong>
              <button className="icon-button" onClick={onCloseMobile}>✕</button>
            </div>
            
            <div className="sidebar-title">Direct Messages</div>
            <button 
              className={`panel-row ${workspace.activeConv.type === 'global' ? 'panel-row-active' : ''}`} 
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'global', id: null } });
                if (isMobile) setMobileView('chat');
              }}
            >
              👥 General
            </button>
            
            {workspace.editors.map((editor) => {
              const isOnline = onlineUsers.includes(editor.id);
              return (
                <button
                  className={`panel-row ${workspace.activeConv.type === 'dm' && workspace.activeConv.id === editor.id ? 'panel-row-active' : ''}`}
                  key={editor.id}
                  onClick={() => {
                    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'dm', id: editor.id } });
                    if (isMobile) setMobileView('chat');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      background: isOnline ? 'var(--primary, #8b5cf6)' : 'transparent',
                      border: isOnline ? 'none' : '1.5px solid var(--text-muted, #94a3b8)',
                      display: 'inline-block' 
                    }} 
                  />
                  {getAvatarInitials(editor.name)} {editor.name.split(' ')[0]}
                </button>
              );
            })}

            <div className="sidebar-title">Teams</div>
            {Object.entries(workspace.chat.teams).filter(([_, team]) => isAdmin(meta.account.id, workspace) || team.memberIds.includes(meta.account.id)).length === 0 && <div className="empty-inline">No teams yet.</div>}
            {Object.entries(workspace.chat.teams)
              .filter(([_, team]) => isAdmin(meta.account.id, workspace) || team.memberIds.includes(meta.account.id))
              .map(([teamId, team]) => (
              <button
                className={`panel-row ${workspace.activeConv.type === 'team' && workspace.activeConv.id === teamId ? 'panel-row-active' : ''}`}
                key={teamId}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'team', id: teamId } });
                  if (isMobile) setMobileView('chat');
                }}
              >
                🏷 {team.name}
              </button>
            ))}
          </div>
        )}

        {(!isMobile || mobileView === 'chat') && (
          <div className="chat-main">
            {isMobile && (
              <div className="mobile-panel-head" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '12px' }}>
                <button 
                  className="ghost-button small" 
                  onClick={() => setMobileView('list')}
                  style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px' }}
                >
                  ← Channels
                </button>
                <strong style={{ fontSize: '15px' }}>{activeHeader.title}</strong>
                <button className="icon-button" onClick={onCloseMobile}>✕</button>
              </div>
            )}

            {isWorkspaceLocked ? (
              <div className="empty-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px' }}>🔒</div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Chat Workspace Locked</h3>
                <p style={{ maxWidth: '300px', fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  This device does not have access to the workspace encryption key yet.
                </p>
                {isEncryptionSetup ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    Waiting for approval. Ask an approved device to grant access to this device.
                  </div>
                ) : isOwner ? (
                  <button className="primary-button" onClick={initializeWorkspaceEncryption} style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}>
                    Set Up Workspace Encryption
                  </button>
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    Waiting for the owner to set up workspace encryption.
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="channel-tabs">
                  {CHANNELS.map((channel) => {
                    const taggedCount = workspace.notifications.filter((item) => !item.read && item.iconClass === 'mention-notif').length;
                    return (
                      <button
                        className={`channel-tab ${workspace.activeChannel === channel ? 'channel-tab-active' : ''}`}
                        key={channel}
                        onClick={() => dispatch({ type: 'SET_ACTIVE_CHANNEL', channel })}
                      >
                        {channel === 'tagged' ? '@ tagged' : `# ${channel}`}
                        {channel === 'tagged' && taggedCount > 0 && <span className="tag-badge">{taggedCount}</span>}
                      </button>
                    );
                  })}
                </div>

                <div className="chat-scroll" ref={scrollRef}>
                  {chatLoading && <div className="empty-card">Loading messages...</div>}
                  {!chatLoading && !activeMessages.length && <div className="empty-card">No messages yet.</div>}
                  
                  {!chatLoading && activeMessages.map((message) => (
                    <MessageBubble 
                      editors={workspace.editors} 
                      key={message.id} 
                      message={message} 
                      sourceLabel={workspace.activeChannel === 'tagged' ? message.sourceLabel : null} 
                    />
                  ))}

                  {/* Typing Indicator Bubble */}
                  {typingUsers.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', opacity: 0.8 }}>
                      <div className="avatar-square" style={{ color: '#8b5cf6', background: '#8b5cf620' }}>
                        💬
                      </div>
                      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {typingUsers.map(uid => {
                          const ed = workspace.editors.find(e => e.id === uid);
                          return ed ? ed.name.split(' ')[0] : 'Someone';
                        }).join(', ')} is typing...
                      </div>
                    </div>
                  )}
                </div>

                <div className="chat-compose">
                  <div className="compose-row">
                    <textarea
                      className="text-input"
                      placeholder="Type an encrypted message..."
                      rows={2}
                      value={text}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      onDrop={(event) => {
                        event.preventDefault();
                        const dropped = event.dataTransfer.getData('text');
                        if (dropped) setText((current) => `${current} ${dropped}`.trim());
                      }}
                      onDragOver={(event) => event.preventDefault()}
                    />
                    <button className="primary-button send-button" onClick={submitMessage}>➤</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
