import { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { formatDateTime, getFileIcon } from '../utils/helpers';
import { getFileUrl, hasFileUrl } from '../utils/fileStore';
import { isFileVisible, isAdmin } from '../utils/rbac';

function fmtSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage({ onOpenFileViewer }) {
  const { workspace, meta, addFiles, updateFilePermissions, deleteFileById } = useAppContext();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await addFiles(fileList, meta.account.id, (progress) => {
        setUploadProgress(progress);
      });
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const visibleFilesList = workspace && workspace.files
    ? workspace.files.filter(f => isFileVisible(f, meta.account.id, workspace))
    : [];

  return (
    <section className="page-stack">
      <div className="section-header-row">
        <div>
          <h2>File Review</h2>
          <p>Upload any file — video, image, audio, PDF, archive. Any size, any format.</p>
        </div>
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
      </div>

      {/* drop zone */}
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

      <div className="file-grid">
        {!visibleFilesList.length && <div className="empty-card">No files visible.</div>}
        {[...visibleFilesList].reverse().map((file) => {
          const url = getFileUrl(file);
          const available = hasFileUrl(file) || file.status === 'ready';
          const isFileVideo = file.type && file.type.startsWith('video');
          const isFileImage = file.type && file.type.startsWith('image');
          const canDelete = workspace && (isAdmin(meta.account.id, workspace) || file.uploadedBy === meta.account.id);
          
          return (
            <div
              className={`file-card ${!available ? 'file-card-offline' : ''} ${file.status === 'uploading' ? 'file-card-uploading' : ''}`}
              key={file.id}
              onClick={() => {
                if (file.status !== 'uploading') {
                  onOpenFileViewer(file.id);
                }
              }}
              style={{ position: 'relative', cursor: file.status === 'uploading' ? 'default' : 'pointer' }}
            >
              {canDelete && (
                <button
                  className="file-card-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
                      deleteFileById(file.id);
                    }
                  }}
                  title="Delete file"
                  aria-label="Delete file"
                >
                  🗑
                </button>
              )}
              <div className="file-thumb">
                {file.status === 'uploading' && (
                  <div className="file-thumb-offline" style={{ flexDirection: 'column', gap: '8px' }}>
                    <div className="spinner" style={{ border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid var(--primary)', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }}></div>
                    <small>Uploading...</small>
                  </div>
                )}
                {file.status !== 'uploading' && isFileImage && url && <img alt={file.name} src={url} />}
                {file.status !== 'uploading' && isFileVideo && url && <video muted preload="metadata" src={url} />}
                {file.status !== 'uploading' && !isFileVideo && !isFileImage && (
                  <span>{getFileIcon(file.type, file.name)}</span>
                )}
                {file.status !== 'uploading' && !available && (
                  <div className="file-thumb-offline">🔗 Re-attach</div>
                )}
              </div>
              <div className="file-body">
                <strong className="file-card-name">{file.name}</strong>
                {file.size && <small>{fmtSize(file.size)}</small>}
                <small>{formatDateTime(file.uploadedAt)}</small>
                {file.comments && <small>💬 {file.comments.length} comment(s)</small>}
                {file.latestVersionNumber && file.latestVersionNumber > 1 && (
                  <small style={{ color: 'var(--cyan)', fontWeight: 600 }}>Version V{file.latestVersionNumber}</small>
                )}
                {!available && file.status !== 'uploading' && <small className="file-offline-note">⚠ Re-attach after page reload</small>}
                {isAdmin(meta.account.id, workspace) && (
                  <div style={{ marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                    <small style={{ display: 'block', marginBottom: '4px' }}>Share with:</small>
                    <select
                      multiple
                      value={file.visibleTo || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        updateFilePermissions(file.id, selected);
                      }}
                      style={{ width: '100%', fontSize: '0.8rem', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                    >
                      {workspace.editors.map(ed => (
                        <option key={ed.id} value={ed.id}>{ed.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
