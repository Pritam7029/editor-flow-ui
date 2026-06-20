import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatDateTime, formatSeconds, getFileIcon, renderMentions } from '../../utils/helpers';
import { getFileUrl, hasFileUrl, setObjectUrl } from '../../utils/fileStore';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileViewerModal({ fileId, isOpen, onClose }) {
  const {
    workspace,
    meta,
    addFileComment,
    deleteFileById,
    resolveFileRevision,
    deleteFileRevisionById,
    uploadNewVersion,
    updateFilePermissions,
    backendWorkspaces
  } = useAppContext();

  const file = useMemo(
    () => (workspace && workspace.files) ? workspace.files.find((item) => item.id === fileId) || null : null,
    [workspace && workspace.files, fileId],
  );

  const videoRef = useRef(null);
  const commentRef = useRef(null);
  const canvasRef = useRef(null);

  const [comment, setComment] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pinTime, setPinTime] = useState(null);
  const [activeComment, setActiveComment] = useState(null);
  const [, forceUpdate] = useState(0); // for re-attach
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionProgress, setVersionProgress] = useState(0);
  
  // Annotation states
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [allPaths, setAllPaths] = useState([]); // Array of stroke paths
  const [isDrawing, setIsDrawing] = useState(false);

  // Playback rate state
  const [playbackRate, setPlaybackRate] = useState(1);

  // Permissions settings state
  const [showPermissions, setShowPermissions] = useState(false);

  const isBackend = workspace && backendWorkspaces && backendWorkspaces.some((ws) => ws.id === workspace.id);

  // Initialize/reset active version ID
  useEffect(() => {
    if (file && file.versions && file.versions.length > 0) {
      const latest = file.versions[file.versions.length - 1];
      setActiveVersionId(latest.id);
    } else {
      setActiveVersionId(null);
    }
  }, [fileId, file && file.versions]);

  /* reset when closed / file changes */
  useEffect(() => {
    if (!isOpen) {
      setComment('');
      setCurrentTime(0);
      setDuration(0);
      setPinTime(null);
      setActiveComment(null);
      setVersionUploading(false);
      setVersionProgress(0);
      setIsDrawingActive(false);
      setAllPaths([]);
      setCurrentPath([]);
      setPlaybackRate(1);
      setShowPermissions(false);
    }
  }, [isOpen]);

  /* listen for re-attach events to trigger re-render */
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener('reattach', handler);
    return () => window.removeEventListener('reattach', handler);
  }, []);

  /* close on Escape */
  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Compute active version
  const activeVersion = useMemo(() => {
    if (!file) return null;
    if (file.versions && file.versions.length > 0) {
      return file.versions.find(v => v.id === activeVersionId) || file.versions[file.versions.length - 1];
    }
    return {
      id: 'local-version',
      versionNumber: 1,
      playbackUrl: getFileUrl(file),
      sizeBytes: file.size,
      status: 'ready'
    };
  }, [file, activeVersionId]);

  const uploader = (file && file.uploadedBy === '__admin__')
    ? (meta.account?.name || 'Admin')
    : (workspace && workspace.editors && file) ? workspace.editors.find((e) => e.id === file.uploadedBy)?.name || 'Unknown' : 'Unknown';

  const comments = useMemo(() => {
    if (!file || !file.comments) return [];
    let list = [...file.comments];
    if (isBackend && activeVersion && activeVersion.id !== 'local-version') {
      list = list.filter(c => c.fileVersionId === activeVersion.id);
    }
    return list.sort((a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity));
  }, [file && file.comments, activeVersion, isBackend]);

  const fileUrl = activeVersion ? activeVersion.playbackUrl : null;
  const urlReady = activeVersion ? activeVersion.status === 'ready' : false;
  const isVideo = file && file.type && file.type.startsWith('video');
  const isImage = file && file.type && file.type.startsWith('image');
  const isAudio = file && file.type && file.type.startsWith('audio');

  const effectiveTime = (isVideo || isAudio) ? (pinTime ?? currentTime) : null;

  // Helper to parse JSON coordinate comments
  const parseCommentBody = (body) => {
    try {
      if (body.startsWith('{') && body.includes('"text"')) {
        return JSON.parse(body);
      }
    } catch (e) {}
    return { text: body, path: null };
  };

  // Get active clicked comment's drawings
  const activeCommentAnnotation = useMemo(() => {
    if (!activeComment) return null;
    const clickedComment = comments.find(c => c.id === activeComment);
    if (!clickedComment) return null;
    const parsed = parseCommentBody(clickedComment.text);
    return parsed.path;
  }, [activeComment, comments]);

  // Handle rendering annotations to the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const drawStroke = (stroke, color) => {
      if (!stroke || stroke.length < 2) return;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * canvas.width, stroke[0].y * canvas.height);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * canvas.width, stroke[i].y * canvas.height);
      }
      ctx.stroke();
    };

    // Draw active drawing path
    if (isDrawingActive) {
      allPaths.forEach(p => drawStroke(p, '#8b5cf6'));
      if (currentPath.length > 0) {
        drawStroke(currentPath, '#8b5cf6');
      }
    }

    // Draw clicked comment's coordinates path
    if (activeCommentAnnotation) {
      activeCommentAnnotation.forEach(p => drawStroke(p, '#06b6d4'));
    }
  }, [isDrawingActive, allPaths, currentPath, activeCommentAnnotation, activeComment]);

  const handleCanvasMouseDown = (e) => {
    if (!isDrawingActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawingActive || !isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawingActive || !isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      setAllPaths(prev => [...prev, currentPath]);
    }
    setCurrentPath([]);
  };

  const handleClearDrawing = () => {
    setAllPaths([]);
    setCurrentPath([]);
  };

  const submitComment = () => {
    if (!comment.trim() && allPaths.length === 0) return;
    const versionId = (activeVersion && activeVersion.id !== 'local-version') ? activeVersion.id : null;
    
    // Store comment as JSON if annotations are present
    const commentBody = allPaths.length > 0
      ? JSON.stringify({ text: comment.trim(), path: allPaths })
      : comment.trim();

    addFileComment(file.id, commentBody, workspace?.senderId, effectiveTime, versionId);
    setComment('');
    setPinTime(null);
    setAllPaths([]);
    setIsDrawingActive(false);
  };

  const seekTo = (t) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleStepBack = () => {
    if (videoRef.current) {
      seekTo(Math.max(0, videoRef.current.currentTime - 0.04));
    }
  };

  const handleStepForward = () => {
    if (videoRef.current && duration) {
      seekTo(Math.min(duration, videoRef.current.currentTime + 0.04));
    }
  };

  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  if (!isOpen || !file) return null;

  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review-shell" onClick={(e) => e.stopPropagation()}>

        {/* ── LEFT: preview + controls ── */}
        <div className="review-left">

          {/* close button */}
          <button className="review-close-btn" onClick={onClose} title="Close (Esc)">✕</button>

          {/* file name + meta */}
          <div className="review-file-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span className="review-file-name">{file.name}</span>
            <span className="review-meta-pill">📤 {uploader}</span>
            <span className="review-meta-pill">📅 {formatDateTime(file.uploadedAt)}</span>
            {activeVersion && activeVersion.sizeBytes && (
              <span className="review-meta-pill">💾 {fmtSize(activeVersion.sizeBytes)}</span>
            )}
            <span className="review-meta-pill">💬 {comments.length}</span>
            
            {/* Version dropdown */}
            {file.versions && file.versions.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="review-meta-pill" style={{ background: 'var(--violet-dark)', border: '1px solid var(--violet)' }}>
                  Version: 
                  <select
                    value={activeVersion ? activeVersion.id : ''}
                    onChange={(e) => setActiveVersionId(e.target.value)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-main)',
                      fontWeight: 'bold',
                      marginLeft: '4px',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    {file.versions.map((v) => (
                      <option key={v.id} value={v.id} style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
                        V{v.versionNumber} {v.id === file.versions[file.versions.length - 1].id ? '(Latest)' : ''}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            )}

            {/* Version Upload */}
            {isBackend && (
              <div style={{ marginLeft: 'auto' }}>
                {versionUploading ? (
                  <span className="review-meta-pill" style={{ color: 'var(--cyan)' }}>
                    ⏳ Uploading V{(file.versions ? file.versions.length : 0) + 1}: {versionProgress}%
                  </span>
                ) : (
                  <label className="primary-button" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.75rem', margin: 0, borderRadius: '4px' }}>
                    ＋ Upload New Version
                    <input
                      hidden
                      type="file"
                      accept="*/*"
                      onChange={async (e) => {
                        const f = e.target.files && e.target.files[0];
                        if (!f) return;
                        setVersionUploading(true);
                        setVersionProgress(0);
                        try {
                          await uploadNewVersion(file.id, f, (progress) => {
                            setVersionProgress(progress);
                          });
                        } catch (err) {
                          console.error('Failed to upload version:', err);
                        } finally {
                          setVersionUploading(false);
                          setVersionProgress(0);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* preview surface */}
          <div className="review-preview-surface" style={{ position: 'relative' }}>
            {!urlReady && (
              <div className="review-reattach">
                <span style={{ fontSize: 48 }}>📎</span>
                <p>This file's preview is no longer available.<br />Large files use a session-only URL that expires on page reload.</p>
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
                <small style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                  Your comments and metadata are preserved.
                </small>
              </div>
            )}
            
            {urlReady && isVideo && (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video
                  ref={videoRef}
                  src={fileUrl}
                  controls
                  className="review-video"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                
                {/* Drawing / Annotation overlay canvas */}
                {(isDrawingActive || activeCommentAnnotation) && (
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      zIndex: 5,
                      cursor: isDrawingActive ? 'crosshair' : 'default',
                      pointerEvents: isDrawingActive ? 'auto' : 'none'
                    }}
                  />
                )}
              </div>
            )}
            
            {urlReady && isImage && <img alt={file.name} src={fileUrl} className="review-image" />}
            
            {urlReady && isAudio && (
              <div className="review-audio-wrap">
                <span style={{ fontSize: 64 }}>🎵</span>
                <audio
                  ref={videoRef}
                  src={fileUrl}
                  controls
                  style={{ width: '100%', marginTop: 16 }}
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                />
              </div>
            )}
            
            {urlReady && !isVideo && !isImage && !isAudio && (
              <div className="review-fallback">{getFileIcon(file.type, file.name)}</div>
            )}
          </div>

          {/* timeline / progress bar for video & audio */}
          {(isVideo || isAudio) && (
            <div className="review-timeline">
              <div className="review-time-labels">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(duration)}</span>
              </div>
              <div
                className="review-progress-track"
                onClick={(e) => {
                  if (!duration) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const t = ((e.clientX - r.left) / r.width) * duration;
                  seekTo(t);
                  setPinTime(t);
                }}
              >
                <div
                  className="review-progress-fill"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
                {/* pinned-time indicator */}
                {pinTime != null && duration > 0 && (
                  <div
                    className="review-pin-marker"
                    style={{ left: `${(pinTime / duration) * 100}%` }}
                  />
                )}
                {/* comment markers */}
                {comments.filter((c) => c.timestamp != null && duration).map((c) => (
                  <button
                    key={c.id}
                    className={`review-comment-marker ${activeComment === c.id ? 'review-comment-marker-active' : ''} ${c.status === 'resolved' ? 'review-comment-marker-resolved' : ''}`}
                    style={{
                      left: `${(c.timestamp / duration) * 100}%`,
                      background: c.status === 'resolved' ? 'var(--green)' : 'var(--violet)'
                    }}
                    onClick={(e) => { e.stopPropagation(); seekTo(c.timestamp); }}
                    onMouseEnter={() => setActiveComment(c.id)}
                    onMouseLeave={() => setActiveComment(null)}
                    title={`${formatSeconds(c.timestamp)} — ${c.authorName}: ${parseCommentBody(c.text).text.slice(0, 60)}`}
                  />
                ))}
              </div>

              {/* pin / controls row */}
              <div className="review-ts-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    className="review-ts-btn"
                    onClick={() => setPinTime(currentTime)}
                    title="Pin current playhead position to comment"
                  >
                    📍 Pin {formatSeconds(currentTime)}
                  </button>
                  {pinTime != null && (
                    <button className="review-ts-btn review-ts-clear" onClick={() => setPinTime(null)}>
                      ✕ Clear pin
                    </button>
                  )}
                </div>

                {/* Frame-by-frame navigation controls & Speed dropdown */}
                {isVideo && (
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="review-ts-btn" onClick={handleStepBack} title="Step back 1 frame (0.04s)">◀ Frame</button>
                    <button className="review-ts-btn" onClick={handleStepForward} title="Step forward 1 frame (0.04s)">Frame ▶</button>
                    
                    <select
                      value={playbackRate}
                      onChange={(e) => changePlaybackRate(Number(e.target.value))}
                      style={{
                        background: '#080c14',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="0.25">0.25x</option>
                      <option value="0.5">0.5x</option>
                      <option value="1">1.0x (Normal)</option>
                      <option value="1.5">1.5x</option>
                      <option value="2">2.0x</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* compose area */}
          <div className="review-compose">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              {effectiveTime != null && (
                <div className="review-attached-ts" style={{ margin: 0 }}>
                  ⏱ Pinned at <strong>{formatSeconds(effectiveTime)}</strong>
                  <button className="review-ts-clear" onClick={() => setPinTime(null)} style={{ marginLeft: 8 }}>✕</button>
                </div>
              )}
              
              {/* Toggle Drawing button */}
              {isVideo && (
                <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
                  {allPaths.length > 0 && (
                    <button
                      className="review-ts-btn review-ts-clear"
                      onClick={handleClearDrawing}
                      style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    >
                      Clear Sketch
                    </button>
                  )}
                  <button
                    className="review-ts-btn"
                    onClick={() => setIsDrawingActive(!isDrawingActive)}
                    style={{
                      background: isDrawingActive ? 'var(--primary)' : '#080c14',
                      color: isDrawingActive ? '#fff' : 'var(--text-primary)',
                      padding: '4px 8px',
                      fontSize: '0.75rem'
                    }}
                  >
                    ✏️ {isDrawingActive ? 'Drawing Active' : 'Sketch / Draw'}
                  </button>
                </div>
              )}
            </div>

            <div className="review-compose-row">
              <textarea
                ref={commentRef}
                className="review-textarea"
                placeholder={isDrawingActive ? "Sketch on video screen, then write note here… (Enter to send)" : "Leave a review or note…  (Enter to send)"}
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
                }}
              />
              <button className="review-send-btn" onClick={submitComment}>➤</button>
            </div>
          </div>

          {/* bottom action bar */}
          <div className="review-action-bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <button
                className="ghost-button small"
                onClick={() => setShowPermissions(!showPermissions)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
              >
                👥 {showPermissions ? 'Hide Permissions' : 'Who can see this file?'}
              </button>
              
              <button
                className="review-delete-btn"
                onClick={() => { deleteFileById(file.id); onClose(); }}
              >
                🗑 Delete File
              </button>
            </div>

            {/* Permissions list dropdown panel */}
            {showPermissions && (
              <div style={{
                background: '#080c14',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                width: '100%',
                textAlign: 'left'
              }}>
                <h5 style={{ margin: '0 0 6px', fontSize: '0.85rem', color: 'var(--text-primary)' }}>👥 Shared Visibility</h5>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                  Restrict access to specific workspace members. Leave all unchecked to share with everyone.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', maxHeight: '120px', overflowY: 'auto' }}>
                  {workspace && workspace.editors && workspace.editors.map((editor) => {
                    const isChecked = file.visibleTo && file.visibleTo.includes(editor.id);
                    return (
                      <label key={editor.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <input
                          type="checkbox"
                          checked={isChecked || false}
                          onChange={async (e) => {
                            const currentList = file.visibleTo || [];
                            let newList;
                            if (e.target.checked) {
                              newList = [...currentList, editor.id];
                            } else {
                              newList = currentList.filter(id => id !== editor.id);
                            }
                            await updateFilePermissions(file.id, newList);
                          }}
                        />
                        <span>{editor.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: comments panel ── */}
        <div className="review-right">
          <div className="review-panel-title">
            Feedback
            <span className="review-comment-count">{comments.length}</span>
          </div>

          <div className="review-comment-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
            {!comments.length && (
              <div className="review-empty">No feedback yet. Add the first comment!</div>
            )}
            {comments.map((item) => {
              const isResolved = item.status === 'resolved';
              const isOwnerOrAuthor = item.authorId === meta.account.id || (workspace && workspace.ownerId === meta.account.id);
              const parsed = parseCommentBody(item.text);
              const commentText = parsed.text;
              const hasSketch = parsed.path && parsed.path.length > 0;
              
              return (
                <div
                  key={item.id}
                  className={`review-comment-item ${activeComment === item.id ? 'review-comment-item-active' : ''}`}
                  onClick={() => { if (item.timestamp != null) seekTo(item.timestamp); }}
                  onMouseEnter={() => setActiveComment(item.id)}
                  onMouseLeave={() => setActiveComment(null)}
                  style={{
                    opacity: isResolved ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: isResolved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255,255,255,0.02)',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {item.timestamp != null && (
                      <span className="review-comment-ts" style={{ background: isResolved ? 'var(--green)' : 'var(--violet)' }}>
                        ⏱ {formatSeconds(item.timestamp)}
                      </span>
                    )}

                    {hasSketch && (
                      <span className="review-comment-ts" style={{ background: '#0891b2', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        ✏️ Sketch
                      </span>
                    )}
                    
                    {/* Resolve button */}
                    {isBackend && (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          marginLeft: 'auto',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isResolved ? 'var(--green)' : 'var(--text-muted)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveFileRevision(file.id, item.id, !isResolved);
                        }}
                        title={isResolved ? 'Re-open revision' : 'Resolve revision'}
                      >
                        {isResolved ? '✅' : '☑'}
                      </button>
                    )}

                    {/* Delete button */}
                    {isOwnerOrAuthor && isBackend && (
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: 'var(--red)',
                          marginLeft: isBackend ? '6px' : 'auto',
                          padding: '2px'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFileRevisionById(file.id, item.id);
                        }}
                        title="Delete revision"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  <div className="review-comment-meta">
                    <strong>{item.authorName}</strong>
                    <small>{formatDateTime(item.ts)}</small>
                  </div>
                  <div
                    className="review-comment-text"
                    style={{
                      textDecoration: isResolved ? 'line-through' : 'none',
                      color: isResolved ? 'var(--text-muted)' : 'var(--text-main)',
                      fontSize: '0.9rem',
                      lineHeight: '1.4',
                      wordBreak: 'break-word',
                      marginTop: '6px'
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMentions(commentText, workspace.editors) }}
                  />
                  {isResolved && item.resolvedBy && (
                    <small style={{ color: 'var(--green)', fontSize: '0.75rem', marginTop: '6px', fontStyle: 'italic' }}>
                      Resolved
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
