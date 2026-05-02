import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CHANNELS } from '../../utils/constants';
import { isAdmin } from '../../utils/rbac';
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
        <div className="avatar-square" style={{ color: editor?.color || '#8b5cf6', background: `${editor?.color || '#8b5cf6'}20` }}>
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
  const { workspace, meta, dispatch, sendMessage, clearActiveChat } = useAppContext();
  const [text, setText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const scrollRef = useRef(null);

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
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitMessage = () => {
    if (!text.trim()) return;
    sendMessage({ text: text.trim(), senderId: meta.account.id });
    setText('');
  };

  return (
    <aside className={`chat-panel ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="panel-resizer left-resizer" data-panel="chat" />
      <div className="chat-header-row">
        <div>
          <div className="section-title">{activeHeader.title}</div>
          <div className="section-subtitle">{activeHeader.subtitle}</div>
        </div>
        <div className="chat-header-actions" ref={menuRef}>
          <button className="icon-button only-mobile" onClick={onCloseMobile}>✕</button>
          <button className="ghost-button small" onClick={() => window.alert(`📞 Starting voice call with ${activeHeader.title}…`)}>📞</button>
          <button className="ghost-button small" onClick={() => window.alert(`🎥 Starting video call with ${activeHeader.title}…`)}>🎥</button>
          <button className="ghost-button small" onClick={() => setShowMenu((value) => !value)}>⋯</button>
          {showMenu && (
            <div className="floating-panel chat-menu-panel">
              {isAdmin(meta.account.id, workspace) && (
                <button className="panel-row" onClick={() => { onOpenTeamModal(); setShowMenu(false); }}>＋ Create Team</button>
              )}
              <button className="panel-row panel-row-danger" onClick={() => { clearActiveChat(); setShowMenu(false); }}>🗑 Clear Chat</button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-layout">
        <div className="chat-conversations">
          <div className="sidebar-title">Direct Messages</div>
          <button className={`panel-row ${workspace.activeConv.type === 'global' ? 'panel-row-active' : ''}`} onClick={() => dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'global', id: null } })}>👥 General</button>
          {workspace.editors.filter(editor => isAdmin(meta.account.id, workspace) || editor.id === meta.account.id).map((editor) => (
            <button
              className={`panel-row ${workspace.activeConv.type === 'dm' && workspace.activeConv.id === editor.id ? 'panel-row-active' : ''}`}
              key={editor.id}
              onClick={() => dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'dm', id: editor.id } })}
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
              onClick={() => dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: { type: 'team', id: teamId } })}
            >
              🏷 {team.name}
            </button>
          ))}
        </div>

        <div className="chat-main">
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
      </div>
    </aside>
  );
}
