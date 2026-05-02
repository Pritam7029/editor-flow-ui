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
  const { workspace, meta, addFiles, updateFilePermissions } = useAppContext();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true);
    await addFiles(fileList, meta.account.id);
    setUploading(false);
  };

  return (
    <section className="page-stack">
      <div className="section-header-row">
        <div>
          <h2>File Review</h2>
          <p>Upload any file — video, image, audio, PDF, archive. Any size, any format.</p>
        </div>
        <label className={`primary-button upload-button ${uploading ? 'uploading-btn' : ''}`}>
          {uploading ? '⏳ Uploading…' : '＋ Upload File'}
          <input
            ref={inputRef}
            hidden
            multiple
            type="file"
            accept="*/*"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>

      {/* drop zone */}
      <div
        className={`drop-zone ${dragging ? 'drop-zone-active' : ''} ${uploading ? 'drop-zone-uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        {uploading
          ? '⏳ Processing upload…'
          : '📂 Drop any file here — video, image, audio, PDF, or any format. No size limit.'}
      </div>

      <div className="file-grid">
        {!workspace.files.filter(f => isFileVisible(f, meta.account.id, workspace)).length && <div className="empty-card">No files visible.</div>}
        {[...workspace.files].reverse().filter(f => isFileVisible(f, meta.account.id, workspace)).map((file) => {
          const url = getFileUrl(file);
          const available = hasFileUrl(file);
          return (
            <button
              className={`file-card ${!available ? 'file-card-offline' : ''}`}
              key={file.id}
              onClick={() => onOpenFileViewer(file.id)}
            >
              <div className="file-thumb">
                {/* thumbnail previews */}
                {file.type.startsWith('image') && url && <img alt={file.name} src={url} />}
                {file.type.startsWith('video') && url && <video muted preload="metadata" src={url} />}
                {(!file.type.startsWith('video') && !file.type.startsWith('image')) && (
                  <span>{getFileIcon(file.type, file.name)}</span>
                )}
                {!available && (
                  <div className="file-thumb-offline">🔗 Re-attach</div>
                )}
              </div>
              <div className="file-body">
                <strong className="file-card-name">{file.name}</strong>
                {file.size && <small>{fmtSize(file.size)}</small>}
                <small>{formatDateTime(file.uploadedAt)}</small>
                <small>💬 {file.comments.length} comment(s)</small>
                {!available && <small className="file-offline-note">⚠ Re-attach after page reload</small>}
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
