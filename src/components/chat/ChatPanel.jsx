import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
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
  const urls = message.text.match(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi) || [];
  const cleanText = message.text.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, '').trim();

  return (
    <>
      {sourceLabel && <div className="tagged-source-label">{sourceLabel}</div>}
      <div className={`message-bubble ${extractMentions(message.text, editors).length ? 'message-tagged' : ''}`}>
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
  const { workspace, meta, dispatch, sendMessage } = useAppContext();
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
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
    if (workspace.activeChannel !== 'tagged') {
      if (workspace.activeConv.type === 'dm') return workspace.chat.dm[workspace.activeConv.id]?.[workspace.activeChannel] || [];
      if (workspace.activeConv.type === 'team') return workspace.chat.teams[workspace.activeConv.id]?.[workspace.activeChannel] || [];
      return workspace.chat.global[workspace.activeChannel] || [];
    }

    const collected = [];
    ['general', 'links', 'feedback'].forEach((channel) => {
      (workspace.chat.global[channel] || []).forEach((message) => {
        if (extractMentions(message.text, workspace.editors).length) collected.push({ message, sourceLabel: `General #${channel}` });
      });
    });
    Object.entries(workspace.chat.dm).forEach(([editorId, bucket]) => {
      const editorName = workspace.editors.find((item) => item.id === editorId)?.name || 'Unknown';
      ['general', 'links', 'feedback'].forEach((channel) => {
        (bucket[channel] || []).forEach((message) => {
          if (extractMentions(message.text, workspace.editors).length) collected.push({ message, sourceLabel: `DM • ${editorName} #${channel}` });
        });
      });
    });
    Object.values(workspace.chat.teams).forEach((team) => {
      ['general', 'links', 'feedback'].forEach((channel) => {
        (team[channel] || []).forEach((message) => {
          if (extractMentions(message.text, workspace.editors).length) collected.push({ message, sourceLabel: `${team.name} #${channel}` });
        });
      });
    });
    return collected.sort((a, b) => b.message.ts - a.message.ts);
  }, [workspace]);

  const activeHeader = useMemo(
    () => getConversationLabel(workspace, workspace.activeConv, workspace.activeChannel),
    [workspace],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [activeMessages]);

  const submitMessage = () => {
    if (!text.trim()) return;
    sendMessage({ text: text.trim(), senderId: meta.account.id });
    setText('');
  };

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
            {workspace.editors.map((editor) => (
              <button
                className={`panel-row ${workspace.activeConv.type === 'dm' && workspace.activeConv.id === editor.id ? 'panel-row-active' : ''}`}
                key={editor.id}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'dm', id: editor.id } });
                  if (isMobile) setMobileView('chat');
                }}
              >
                {getAvatarInitials(editor.name)} {editor.name.split(' ')[0]}
              </button>
            ))}
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
              {!activeMessages.length && <div className="empty-card">No messages yet.</div>}
              {workspace.activeChannel === 'tagged'
                ? activeMessages.map(({ message, sourceLabel }) => <MessageBubble editors={workspace.editors} key={`${sourceLabel}-${message.id}`} message={message} sourceLabel={sourceLabel} />)
                : activeMessages.map((message) => <MessageBubble editors={workspace.editors} key={message.id} message={message} />)}
            </div>

            <div className="chat-compose">
              <div className="compose-row">
                <textarea
                  className="text-input"
                  placeholder="Type a message..."
                  rows={2}
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      submitMessage();
                    }
                  }}
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
          </div>
        )}
      </div>
    </aside>
  );
}
