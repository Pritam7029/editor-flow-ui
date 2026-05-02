import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { formatDateTime, formatSeconds, getFileIcon, renderMentions } from '../../utils/helpers';
import { getFileUrl, hasFileUrl, setObjectUrl } from '../../utils/fileStore';

/* ─── tiny helper ─────────────────────────────── */
function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileViewerModal({ fileId, isOpen, onClose }) {
  const { workspace, meta, addFileComment, deleteFileById } = useAppContext();
  const file = useMemo(
    () => workspace.files.find((item) => item.id === fileId) || null,
    [workspace.files, fileId],
  );

  const videoRef   = useRef(null);
  const commentRef = useRef(null);

  const [comment, setComment]     = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]   = useState(0);
  const [pinTime, setPinTime]     = useState(null);
  const [activeComment, setActiveComment] = useState(null);
  const [, forceUpdate]           = useState(0); // for re-attach

  /* reset when closed / file changes */
  useEffect(() => {
    if (!isOpen) {
      setComment('');
      setCurrentTime(0);
      setDuration(0);
      setPinTime(null);
      setActiveComment(null);
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

  if (!isOpen || !file) return null;

  const uploader = file.uploadedBy === '__admin__'
    ? meta.account.name
    : workspace.editors.find((e) => e.id === file.uploadedBy)?.name || 'Unknown';

  const comments = [...file.comments].sort(
    (a, b) => (a.timestamp ?? Infinity) - (b.timestamp ?? Infinity),
  );

  const fileUrl    = getFileUrl(file);   // Object URL or base64 dataUrl
  const urlReady   = hasFileUrl(file);   // false if blob expired after reload
  const isVideo    = file.type.startsWith('video');
  const isImage    = file.type.startsWith('image');
  const isAudio    = file.type.startsWith('audio');

  /* The time that will be attached to the next comment */
  const effectiveTime = (isVideo || isAudio) ? (pinTime ?? currentTime) : null;

  const submitComment = () => {
    if (!comment.trim()) return;
    addFileComment(file.id, comment.trim(), workspace.senderId, effectiveTime);
    setComment('');
    setPinTime(null);
  };

  const seekTo = (t) => {
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  /* ── render ──────────────────────────────────── */
  return (
    <div className="review-overlay" onClick={onClose}>
      <div className="review-shell" onClick={(e) => e.stopPropagation()}>

        {/* ── LEFT: preview + controls ── */}
        <div className="review-left">

          {/* close button */}
          <button className="review-close-btn" onClick={onClose} title="Close (Esc)">✕</button>

          {/* file name + meta */}
          <div className="review-file-header">
            <span className="review-file-name">{file.name}</span>
            <span className="review-meta-pill">📤 {uploader}</span>
            <span className="review-meta-pill">📅 {formatDateTime(file.uploadedAt)}</span>
            {file.size && <span className="review-meta-pill">💾 {fmtSize(file.size)}</span>}
            <span className="review-meta-pill">💬 {file.comments.length}</span>
          </div>

          {/* preview surface */}
          <div className="review-preview-surface">
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
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = URL.createObjectURL(f);
                      setObjectUrl(file.id, url);
                      // force re-render
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
              <video
                ref={videoRef}
                src={fileUrl}
                controls
                className="review-video"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
              />
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
                    className={`review-comment-marker ${activeComment === c.id ? 'review-comment-marker-active' : ''}`}
                    style={{ left: `${(c.timestamp / duration) * 100}%` }}
                    onClick={(e) => { e.stopPropagation(); seekTo(c.timestamp); }}
                    onMouseEnter={() => setActiveComment(c.id)}
                    onMouseLeave={() => setActiveComment(null)}
                    title={`${formatSeconds(c.timestamp)} — ${c.authorName}: ${c.text.slice(0, 60)}`}
                  />
                ))}
              </div>

              {/* pin / clear timestamp */}
              <div className="review-ts-row">
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
            </div>
          )}

          {/* compose area */}
          <div className="review-compose">
            {effectiveTime != null && (
              <div className="review-attached-ts">
                ⏱ Comment will be pinned at <strong>{formatSeconds(effectiveTime)}</strong>
                <button className="review-ts-clear" onClick={() => setPinTime(null)} style={{ marginLeft: 8 }}>✕</button>
              </div>
            )}
            <div className="review-compose-row">
              <textarea
                ref={commentRef}
                className="review-textarea"
                placeholder="Leave a review or note…  (Enter to send)"
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
          <div className="review-action-bar">
            <button
              className="review-delete-btn"
              onClick={() => { deleteFileById(file.id); onClose(); }}
            >
              🗑 Delete File
            </button>
          </div>
        </div>

        {/* ── RIGHT: comments panel ── */}
        <div className="review-right">
          <div className="review-panel-title">
            Feedback
            <span className="review-comment-count">{comments.length}</span>
          </div>

          <div className="review-comment-list">
            {!comments.length && (
              <div className="review-empty">No feedback yet. Add the first comment!</div>
            )}
            {comments.map((item) => (
              <button
                key={item.id}
                className={`review-comment-item ${activeComment === item.id ? 'review-comment-item-active' : ''}`}
                onClick={() => { if (item.timestamp != null) seekTo(item.timestamp); }}
                onMouseEnter={() => setActiveComment(item.id)}
                onMouseLeave={() => setActiveComment(null)}
              >
                {item.timestamp != null && (
                  <span className="review-comment-ts">⏱ {formatSeconds(item.timestamp)}</span>
                )}
                <div className="review-comment-meta">
                  <strong>{item.authorName}</strong>
                  <small>{formatDateTime(item.ts)}</small>
                </div>
                <div
                  className="review-comment-text"
                  dangerouslySetInnerHTML={{ __html: renderMentions(item.text, workspace.editors) }}
                />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
