import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatDateTime, formatSeconds, getFileIcon, renderMentions } from '../utils/helpers';
import { getFileUrl, hasFileUrl, setObjectUrl } from '../utils/fileStore';
import { isFileVisible, isAdmin } from '../utils/rbac';
import { useFullscreenPanel } from '../hooks/useFullscreenPanel';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Convert seconds to frame-based SMPTE timecode format (hh:mm:ss:ff)
function formatTimecode(seconds, fps = 24) {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return '00:00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);
  
  const pad = (num) => String(num).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

// Helper to mock "time ago" string
function getTimeAgo(dateStr) {
  if (!dateStr) return '1d';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  return `${diffDays}d`;
}

export default function FilesPage() {
  const {
    workspace,
    meta,
    addFiles,
    addFileComment,
    deleteFileById,
    resolveFileRevision,
    deleteFileRevisionById,
    uploadNewVersion,
    backendWorkspaces
  } = useAppContext();

  const [selectedFileId, setSelectedFileId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Viewing/Review States
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'fields'
  const [comment, setComment] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pinTime, setPinTime] = useState(null);
  const [activeComment, setActiveComment] = useState(null);
  const [, forceUpdate] = useState(0); // for re-attach
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionProgress, setVersionProgress] = useState(0);

  // Playback state variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});

  const [isFullscreen, setIsFullscreen] = useFullscreenPanel();

  const videoRef = useRef(null);
  const commentRef = useRef(null);
  const inputRef = useRef(null);

  const isBackend = workspace && backendWorkspaces && backendWorkspaces.some((ws) => ws.id === workspace.id);
  const accountId = meta.account && meta.account.id;

  const visibleFilesList = workspace && workspace.files
    ? workspace.files.filter(f => isFileVisible(f, accountId, workspace))
    : [];

  const filteredFiles = visibleFilesList.filter(fileItem => 
    fileItem.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const file = useMemo(
    () => (workspace && workspace.files) ? workspace.files.find((item) => item.id === selectedFileId) || null : null,
    [workspace && workspace.files, selectedFileId],
  );

  // Reset page-level viewing states when selected file changes
  useEffect(() => {
    setComment('');
    setCurrentTime(0);
    setDuration(0);
    setPinTime(null);
    setActiveComment(null);
    setVersionUploading(false);
    setVersionProgress(0);
    setIsPlaying(false);
    setPlaybackSpeed(1);
    setIsMuted(false);
    setExpandedComments({});

    if (file && file.versions && file.versions.length > 0) {
      const latest = file.versions[file.versions.length - 1];
      setActiveVersionId(latest.id);
    } else {
      setActiveVersionId(null);
    }
  }, [selectedFileId, file]);

  /* listen for re-attach events to trigger re-render */
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener('reattach', handler);
    return () => window.removeEventListener('reattach', handler);
  }, []);

  const activeVersion = useMemo(() => {
    if (!file) return null;
    if (file.versions && file.versions.length > 0) {
      return file.versions.find(v => v.id === activeVersionId) || file.versions[file.versions.length - 1];
    }
    // Fallback for local files
    return {
      id: 'local-version',
      versionNumber: 1,
      playbackUrl: getFileUrl(file),
      sizeBytes: file.size,
      status: 'ready'
    };
  }, [file, activeVersionId]);

  const uploader = (file && file.uploadedBy === '__admin__')
    ? ((meta.account && meta.account.name) || 'Admin')
    : (workspace && workspace.editors && file) ? (workspace.editors.find((e) => e.id === file.uploadedBy) && workspace.editors.find((e) => e.id === file.uploadedBy).name) || 'Unknown' : 'Unknown';

  const comments = useMemo(() => {
    if (!file || !file.comments) return [];
    let list = [...file.comments];
    // Filter by version if is backend
    if (isBackend && activeVersion && activeVersion.id !== 'local-version') {
      list = list.filter(c => c.fileVersionId === activeVersion.id);
    }
    return list.sort((a, b) => {
      const aTime = a.timestamp !== undefined && a.timestamp !== null ? a.timestamp : Infinity;
      const bTime = b.timestamp !== undefined && b.timestamp !== null ? b.timestamp : Infinity;
      return aTime - bTime;
    });
  }, [file && file.comments, activeVersion, isBackend]);

  const fileUrl = activeVersion ? activeVersion.playbackUrl : null;
  const urlReady = activeVersion ? activeVersion.status === 'ready' : false;
  const isVideo = file && file.type && file.type.startsWith('video');
  const isImage = file && file.type && file.type.startsWith('image');
  const isAudio = file && file.type && file.type.startsWith('audio');

  const effectiveTime = (isVideo || isAudio) ? (pinTime !== null && pinTime !== undefined ? pinTime : currentTime) : null;

  const handleFiles = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await addFiles(fileList, accountId, (progress) => {
        setUploadProgress(progress);
      });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const submitComment = () => {
    if (!comment.trim() || !file) return;
    const versionId = (activeVersion && activeVersion.id !== 'local-version') ? activeVersion.id : null;
    const senderId = workspace && workspace.senderId;
    addFileComment(file.id, comment.trim(), senderId, effectiveTime, versionId);
    setComment('');
    setPinTime(null);
  };

  const seekTo = (t) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
    setCurrentTime(t);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error('Play request failed:', err));
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (e) => {
    const rate = parseFloat(e.target.value);
    setPlaybackSpeed(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleTimelineClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const targetTime = pos * duration;
    seekTo(targetTime);
  };

  const toggleExpandComment = (id) => {
    setExpandedComments(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDownload = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file ? file.name : 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // ── 1. Grid/Browser Mode: Default file browser layout ──
  if (!selectedFileId) {
    return (
      <section className={`page-stack ${isFullscreen ? 'panel-fullscreen' : ''}`}>
        <div className="section-header-row">
          <div>
            <h2>File Review</h2>
            <p>Upload any file — video, image, audio, PDF, archive. Any size, any format.</p>
          </div>
          <div className="header-inline-actions">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-main)',
                fontSize: '14px'
              }}
            />
            <label className={`primary-button upload-button ${uploading ? 'uploading-btn' : ''}`}>
              {uploading ? `⏳ Uploading (${uploadProgress}%)` : '＋ Upload File'}
              <input
                ref={inputRef}
                hidden
                multiple
                type="file"
                accept="*/*"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
              />
            </label>
            <button 
              className="ghost-button" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '44px', minHeight: '44px', borderRadius: '12px', padding: 0 }}
            >
              {isFullscreen ? '❐' : '⛶'}
            </button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone ${dragging ? 'drop-zone-active' : ''} ${uploading ? 'drop-zone-uploading' : ''}`}
          onDragOver={(e) => { e.preventDefault(); if (!uploading) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!uploading) handleFiles(e.dataTransfer.files);
          }}
        >
          {uploading ? (
            <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
              <p style={{ marginBottom: '12px', fontWeight: 600 }}>⏳ Uploading files: {uploadProgress}%</p>
              <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', overflow: 'hidden', height: '8px' }}>
                <div style={{ width: `${uploadProgress}%`, background: 'linear-gradient(90deg, var(--violet), var(--cyan))', height: '100%', transition: 'width 0.1s ease' }} />
              </div>
            </div>
          ) : (
            '📂 Drop any file here — video, image, audio, PDF, or any format. No size limit.'
          )}
        </div>

        {/* Cards Grid */}
        <div className="file-grid" style={{ marginTop: '20px' }}>
          {filteredFiles.length === 0 && <div className="empty-card">No files found.</div>}
          {[...filteredFiles].reverse().map((fileItem) => {
            const url = getFileUrl(fileItem);
            const available = hasFileUrl(fileItem) || fileItem.status === 'ready';
            const isFileVideo = fileItem.type && fileItem.type.startsWith('video');
            const isFileImage = fileItem.type && fileItem.type.startsWith('image');
            const canDelete = workspace && (isAdmin(accountId, workspace) || fileItem.uploadedBy === accountId);
            
            return (
              <div
                className={`file-card ${!available ? 'file-card-offline' : ''} ${fileItem.status === 'uploading' ? 'file-card-uploading' : ''}`}
                key={fileItem.id}
                onClick={() => {
                  if (fileItem.status !== 'uploading') {
                    setSelectedFileId(fileItem.id);
                  }
                }}
                style={{ position: 'relative', cursor: fileItem.status === 'uploading' ? 'default' : 'pointer' }}
              >
                {canDelete && (
                  <button
                    className="file-card-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${fileItem.name}"?`)) {
                        deleteFileById(fileItem.id);
                      }
                    }}
                    title="Delete file"
                  >
                    🗑
                  </button>
                )}
                <div className="file-thumb">
                  {fileItem.status === 'uploading' && (
                    <div className="file-thumb-offline" style={{ flexDirection: 'column', gap: '8px' }}>
                      <div className="spinner" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></div>
                      <small>Uploading...</small>
                    </div>
                  )}
                  {fileItem.status !== 'uploading' && isFileImage && url && <img alt={fileItem.name} src={url} />}
                  {fileItem.status !== 'uploading' && isFileVideo && url && <video muted preload="metadata" src={url} />}
                  {fileItem.status !== 'uploading' && !isFileVideo && !isFileImage && (
                    <span>{getFileIcon(fileItem.type, fileItem.name)}</span>
                  )}
                  {fileItem.status !== 'uploading' && !available && (
                    <div className="file-thumb-offline">🔗 Re-attach</div>
                  )}
                </div>
                <div className="file-body">
                  <strong className="file-card-name">{fileItem.name}</strong>
                  {fileItem.size && <small>{fmtSize(fileItem.size)}</small>}
                  <small>{formatDateTime(fileItem.uploadedAt)}</small>
                  {fileItem.comments && <small>💬 {fileItem.comments.length} comment(s)</small>}
                  {fileItem.latestVersionNumber && fileItem.latestVersionNumber > 1 && (
                    <small style={{ color: 'var(--cyan)', fontWeight: 600 }}>Version V{fileItem.latestVersionNumber}</small>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // ── 2. Replicated Review Mode: Dedicated widescreen video review UI ──
  return (
    <section className={`page-stack ${isFullscreen ? 'panel-fullscreen' : ''}`} style={{ padding: 0 }}>
      
      {/* ── TOP BAR ── */}
      <div className="review-header-bar">
        <div className="review-header-left">
          <button 
            className="review-header-back" 
            onClick={() => setSelectedFileId(null)}
            title="Back to files list"
          >
            ←
          </button>
          
          <div className="review-header-file-info">
            <span style={{ fontSize: '16px' }}>📁</span>
            {file.versions && file.versions.length > 0 ? (
              <select
                className="review-header-dropdown"
                value={activeVersion ? activeVersion.id : ''}
                onChange={(e) => setActiveVersionId(e.target.value)}
              >
                {file.versions.map((v) => (
                  <option key={v.id} value={v.id} style={{ background: '#0f172a', color: '#fff' }}>
                    V{v.versionNumber} {v.id === file.versions[file.versions.length - 1].id ? '(Latest)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontWeight: 600 }}>V1</span>
            )}
            <span style={{ opacity: 0.4 }}>/</span>
            <span>{file.name}</span>
          </div>
        </div>

        <div className="review-header-right">
          {urlReady && (
            <button className="review-download-btn" onClick={handleDownload} title="Download file">
              📥 Download
            </button>
          )}
          <button 
            className="review-fullscreen-toggle" 
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '❐' : '⛶'}
          </button>
        </div>
      </div>

      {/* ── SPLIT VIEW REVIEW WORKSPACE ── */}
      <div className="review-workspace-layout">
        
        {/* LEFT COLUMN: Player & controls */}
        <div className="review-player-column">
          
          {/* Video / Content container */}
          <div className="review-video-container">
            {/* Play Overlay Button if not playing */}
            {urlReady && isVideo && !isPlaying && (
              <button className="review-play-overlay" onClick={togglePlay} aria-label="Play video">
                ▶
              </button>
            )}

            {!urlReady && (
              <div className="review-reattach" style={{ zIndex: 10 }}>
                <span style={{ fontSize: 48 }}>📎</span>
                <p>Preview is expired or unavailable.</p>
                <label className="primary-button" style={{ cursor: 'pointer' }}>
                  Re-attach File
                  <input
                    hidden
                    type="file"
                    accept="*/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (!f) return;
                      const url = URL.createObjectURL(f);
                      setObjectUrl(file.id, url);
                      window.dispatchEvent(new Event('reattach'));
                    }}
                  />
                </label>
              </div>
            )}

            {urlReady && isVideo && (
              <video
                ref={videoRef}
                src={fileUrl}
                className="review-video-element"
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
              />
            )}
            
            {urlReady && isImage && (
              <img alt={file.name} src={fileUrl} className="review-video-element" style={{ objectFit: 'contain' }} />
            )}

            {urlReady && isAudio && (
              <div className="review-audio-wrap" style={{ zIndex: 2 }}>
                <span style={{ fontSize: 64 }}>🎵</span>
                <audio
                  ref={videoRef}
                  src={fileUrl}
                  controls
                  style={{ width: '100%', marginTop: 16 }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                />
              </div>
            )}

            {urlReady && !isVideo && !isImage && !isAudio && (
              <div className="review-fallback" style={{ fontSize: '72px', opacity: 0.5 }}>
                {getFileIcon(file.type, file.name)}
              </div>
            )}
          </div>

          {/* Player controls bar */}
          <div className="review-player-controls-wrap">
            
            {/* Timeline container */}
            {(isVideo || isAudio) && (
              <div className="review-timeline-container">
                <div 
                  className="review-player-timeline"
                  onClick={handleTimelineClick}
                >
                  <div 
                    className="review-player-timeline-fill" 
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                
                {/* Pinned Marker Dots under timeline */}
                <div className="review-player-timeline-markers">
                  {comments.filter(c => c.timestamp !== null && c.timestamp !== undefined && duration).map(c => {
                    const pct = (c.timestamp / duration) * 100;
                    const initials = c.authorName ? c.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';
                    
                    return (
                      <button
                        key={c.id}
                        className="timeline-comment-dot"
                        style={{ left: `${pct}%` }}
                        onClick={() => seekTo(c.timestamp)}
                        title={`${formatTimecode(c.timestamp)} — ${c.authorName}: ${c.text}`}
                      >
                        {initials}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Control Row */}
            <div className="review-controls-bar">
              <div className="review-controls-left">
                {/* Play/Pause */}
                <button className="review-control-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                  {isPlaying ? '⏸' : '▶'}
                </button>
                {/* Loop/Rewind */}
                <button className="review-control-btn" onClick={() => seekTo(0)} title="Rewind to start">
                  🔄
                </button>
                {/* Playback speed selector */}
                <select 
                  className="review-speed-selector" 
                  value={playbackSpeed} 
                  onChange={handleSpeedChange}
                  title="Playback speed"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1.0x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2.0x</option>
                </select>
                {/* Mute toggle */}
                <button className="review-control-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
                  {isMuted ? '🔇' : '🔊'}
                </button>
              </div>

              {/* Timecode display */}
              <div className="review-controls-center" onClick={() => setPinTime(currentTime)} title="Pin timecode to composer">
                <span className="review-timecode-display">{formatTimecode(currentTime)}</span>
                <span className="review-timecode-arrow">▼</span>
              </div>

              <div className="review-controls-right">
                {/* Pin marker tool */}
                <button className="review-control-btn" onClick={() => setPinTime(currentTime)} title="Pin current timestamp">
                  📍
                </button>
                {/* HD pill */}
                <span className="review-hd-badge">HD</span>
                {/* Settings gear */}
                <button className="review-control-btn" title="Settings">
                  ⚙
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Comments Sidebar */}
        <div className="review-comments-sidebar">
          {/* Tabs */}
          <div className="review-sidebar-tabs">
            <button 
              className={`review-sidebar-tab ${activeTab === 'comments' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
            <button 
              className={`review-sidebar-tab ${activeTab === 'fields' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('fields')}
            >
              Fields
            </button>
          </div>

          {/* Subheader */}
          <div className="review-sidebar-subheader">
            <span className="review-subheader-title">All comments</span>
            <div className="review-subheader-actions">
              <span className="review-subheader-icon" title="Sort comments">☰</span>
              <span className="review-subheader-icon" title="Search comments">🔍</span>
              <span className="review-subheader-icon" title="More options">⋯</span>
            </div>
          </div>

          {/* Comment cards list */}
          <div className="review-cards-feed">
            {activeTab === 'comments' ? (
              <>
                {comments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                    No feedback yet. Add the first comment!
                  </div>
                )}
                {comments.map((item, idx) => {
                  const isResolved = item.status === 'resolved';
                  const initials = item.authorName ? item.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'C';
                  const isExpanded = expandedComments[item.id] || false;
                  
                  // Check text length
                  const needsTruncation = item.text.length > 150;
                  const displayText = needsTruncation && !isExpanded 
                    ? `${item.text.slice(0, 150)}...` 
                    : item.text;

                  const isOwnerOrAuthor = item.authorId === accountId || (workspace && workspace.ownerId === accountId);

                  return (
                    <div 
                      key={item.id} 
                      className="review-comment-card"
                      onClick={() => { if (item.timestamp !== null && item.timestamp !== undefined) seekTo(item.timestamp); }}
                    >
                      {/* Avatar */}
                      <div className="review-card-avatar">
                        {initials}
                      </div>

                      {/* Content */}
                      <div className="review-card-content">
                        <div className="review-card-meta-row">
                          <span className="review-card-author">{item.authorName}</span>
                          <span>{getTimeAgo(item.ts)}</span>
                          {item.edited && <span>• Edited</span>}
                          <span style={{ marginLeft: 'auto' }}>#{idx + 1}</span>
                          <span>🌐</span>
                        </div>

                        {/* Yellow timestamp pill */}
                        {item.timestamp !== null && item.timestamp !== undefined && (
                          <div className="review-card-timecode-badge">
                            {formatTimecode(item.timestamp)}
                          </div>
                        )}

                        {/* Message body */}
                        <div 
                          className="review-card-body"
                          dangerouslySetInnerHTML={{ __html: renderMentions(displayText, workspace.editors) }}
                        />

                        {/* Read more toggle */}
                        {needsTruncation && (
                          <button 
                            className="review-card-reply-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandComment(item.id);
                            }}
                            style={{ alignSelf: 'flex-start', margin: '2px 0' }}
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}

                        {/* Action row */}
                        <div className="review-card-actions" onClick={(e) => e.stopPropagation()}>
                          <button className="review-card-reply-trigger">
                            Reply
                          </button>

                          <div style={{ display: 'flex', items: 'center', gap: '8px' }}>
                            {/* Resolve button */}
                            {isBackend && (
                              <button 
                                className={`review-card-resolve-btn ${isResolved ? 'resolved' : ''}`}
                                onClick={() => resolveFileRevision(file.id, item.id, !isResolved)}
                                title={isResolved ? 'Re-open' : 'Resolve'}
                              >
                                {isResolved ? '✅' : '☑'}
                              </button>
                            )}

                            {/* Delete button */}
                            {isOwnerOrAuthor && isBackend && (
                              <button
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--red)' }}
                                onClick={() => {
                                  if (window.confirm('Delete this comment?')) {
                                    deleteFileRevisionById(file.id, item.id);
                                  }
                                }}
                                title="Delete comment"
                              >
                                🗑
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                No custom fields configured for this file.
              </div>
            )}
          </div>

          {/* BOTTOM COMPOSER PANEL */}
          <div className="review-composer-panel">
            {effectiveTime !== null && (
              <div className="review-attached-ts" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px', margin: '0 0 4px 0' }}>
                ⏱ Comment pinned at {formatSeconds(effectiveTime)}
                <button className="review-ts-clear" onClick={() => setPinTime(null)} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}
            
            <div className="review-composer-input-row">
              {/* Yellow current time code indicator */}
              <div className="review-composer-timecode">
                {formatTimecode(effectiveTime !== null ? effectiveTime : currentTime)}
              </div>
              
              <textarea
                ref={commentRef}
                className="review-composer-textarea"
                placeholder="Leave your comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitComment();
                  }
                }}
              />
            </div>

            <div className="review-composer-actions-row">
              <div className="review-composer-tools">
                <span className="review-composer-tool-icon" title="Add emoji">☺</span>
                <span className="review-composer-tool-icon" title="Attach file">📎</span>
                <span className="review-composer-tool-icon" title="Format text">Aa</span>
              </div>

              <button className="review-composer-send-btn" onClick={submitComment} title="Send comment">
                ➤
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
