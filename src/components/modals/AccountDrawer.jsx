import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useEncryption } from '../../context/EncryptionContext';
import { COLOR_OPTIONS } from '../../utils/constants';
import { getAvatarInitials } from '../../utils/helpers';
import { supabase } from '../../config/supabaseclient';
import { initAvatarUpload, completeAvatarUpload, updateMyProfile } from '../../services/profileApi';
import { uploadFileWithProgress } from '../../services/fileApi';
import { getMyDeviceKeys, revokeDeviceKey } from '../../services/deviceKeyApi';
import { getWorkspaceDeviceKeys, getWorkspaceKeyGrants } from '../../services/encryptionApi';

function formatBytes(bytes, decimals = 1) {
  if (!bytes || Number(bytes) === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function AccountDrawer({ isOpen, onClose, onOpenWorkspaceModal }) {
  const {
    meta,
    switchWorkspace,
    deleteWorkspaceById,
    backendWorkspaces,
    backendWorkspaceLoading,
    backendWorkspaceError,
    deleteBackendWorkspaceById,
    saveAccount,
    joinOrCreateWorkspace,
    refreshProfile,
    workspace
  } = useAppContext();

  const { 
    deviceKeyId: currentDeviceKeyId, 
    workspaceKey, 
    grantWorkspaceKeyAccess 
  } = useEncryption();

  const [form, setForm] = useState(meta.account);
  const [joinName, setJoinName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Devices state
  const [myDevices, setMyDevices] = useState([]);
  const [workspaceDevices, setWorkspaceDevices] = useState([]);
  const [workspaceGrants, setWorkspaceGrants] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const visibleWorkspaces = useMemo(() => {
    return backendWorkspaces && backendWorkspaces.length > 0
      ? backendWorkspaces
      : meta.workspaces || [];
  }, [backendWorkspaces, meta.workspaces]);

  const usingBackendWorkspaces = backendWorkspaces && backendWorkspaces.length > 0;

  const currentWorkspace = useMemo(() => {
    return visibleWorkspaces.find((item) => item.id === meta.currentWorkspaceId);
  }, [visibleWorkspaces, meta.currentWorkspaceId]);

  useEffect(() => {
    if (isOpen) {
      setForm(meta.account);
      setJoinName('');
      setUploadError(null);
    }
  }, [isOpen, meta.account]);

  const loadDeviceManagementData = async () => {
    if (!isOpen) return;
    try {
      setLoadingDevices(true);
      const myDevs = await getMyDeviceKeys();
      setMyDevices(myDevs && myDevs.deviceKeys ? myDevs.deviceKeys : []);

      if (workspaceKey && meta && meta.currentWorkspaceId) {
        const workspaceId = meta.currentWorkspaceId;
        const allKeys = await getWorkspaceDeviceKeys(workspaceId);
        setWorkspaceDevices(allKeys || []);

        const grantsResult = await getWorkspaceKeyGrants(workspaceId);
        setWorkspaceGrants(grantsResult && grantsResult.grants ? grantsResult.grants : []);
      }
    } catch (err) {
      console.error('Failed to load device management data:', err);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDeviceManagementData();
  }, [isOpen, workspaceKey, meta && meta.currentWorkspaceId]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setForm((current) => ({ ...current, avatarUrl: previewUrl }));

    try {
      setUploading(true);
      setUploadError(null);

      const initData = await initAvatarUpload({
        name: file.name,
        mime_type: file.type,
        size_bytes: file.size
      });

      await uploadFileWithProgress(initData.signedUrl, initData.token, file, (percent) => {});

      const profile = await completeAvatarUpload({
        storagePath: initData.storagePath
      });

      await refreshProfile();

      setForm((current) => ({
        ...current,
        avatarUrl: profile.avatar_url
      }));
    } catch (err) {
      console.error('Avatar upload failed:', err);
      setUploadError(err.message || 'Failed to upload avatar image');
      setForm((current) => ({ ...current, avatarUrl: meta.account.avatarUrl }));
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      setUploadError(null);
      await updateMyProfile({ avatarUrl: null, avatar_storage_path: null });
      await refreshProfile();
      setForm((current) => ({ ...current, avatarUrl: null }));
    } catch (err) {
      console.error('Failed to remove avatar:', err);
      setUploadError(err.message || 'Failed to remove avatar image');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null; 

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <aside className="drawer" onClick={(event) => event.stopPropagation()} style={{ width: '420px', maxWidth: '100%' }}>
        <div className="drawer-header">
          <div className="drawer-title-block">
            <div className="avatar-square large round" style={{ color: form.color, background: `${form.color}20` }}>
              {form.avatarUrl ? <img alt="Profile" className="avatar-image" src={form.avatarUrl} /> : getAvatarInitials(form.name)}
            </div>
            <div>
              <h3>Your Account</h3>
              <p>{currentWorkspace && currentWorkspace.name}</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body" style={{ overflowY: 'auto', paddingBottom: '32px' }}>
          <section className="form-stack">
            <h4>Profile</h4>
            {uploadError && (
              <div className="form-error" style={{ color: 'var(--rose)', fontSize: '0.85rem' }}>
                {uploadError}
              </div>
            )}
            <label className={`upload-avatar-box ${uploading ? 'uploading-btn' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
              <span>{uploading ? '⏳ Uploading...' : 'Upload photo'}</span>
              <input hidden type="file" accept="image/*" onChange={handleAvatarChange} disabled={uploading} />
            </label>
            {form.avatarUrl && (
              <button 
                className="ghost-button small" 
                onClick={handleRemovePhoto}
                disabled={uploading}
              >
                Remove Photo
              </button>
            )}
            <input className="text-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Display name" />
            <input className="text-input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Role / Title" />
            <textarea className="text-input" rows={3} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} placeholder="Bio" />
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="active">🟢 Active</option>
              <option value="idle">🟡 Idle</option>
              <option value="offline">⚫ Offline</option>
            </select>
            <div className="color-picker">
              {COLOR_OPTIONS.map((color) => (
                <button key={color} className={`color-dot ${form.color === color ? 'color-dot-active' : ''}`} style={{ background: color }} onClick={() => setForm({ ...form, color })} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button className="primary-button" style={{ flex: 1 }} onClick={() => saveAccount(form)}>💾 Save Profile</button>
              <button className="danger-button" style={{ flex: 1 }} onClick={async () => { await supabase.auth.signOut(); }}>🚪 Logout</button>
            </div>
          </section>

          {/* E2EE Device Management Section */}
          <section className="form-stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px' }}>🔒 E2EE Device Management</h4>
            
            <div style={{ fontSize: '0.85rem', background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px' }}>
              <div style={{ color: 'var(--text-secondary)' }}>My Device Key ID:</div>
              <code style={{ fontSize: '0.75rem', display: 'block', wordBreak: 'break-all', marginTop: '4px' }}>{currentDeviceKeyId || 'Initializing...'}</code>
            </div>

            <h5 style={{ margin: '8px 0 6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>My Trusted Devices</h5>
            {myDevices.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No other registered devices.</div>}
            {myDevices.map(d => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                <div style={{ marginRight: '12px', overflow: 'hidden' }}>
                  <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.device_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered: {new Date(d.created_at).toLocaleDateString()}</span>
                  {d.id === currentDeviceKeyId && <span style={{ marginLeft: '6px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.75rem' }}>(Current)</span>}
                </div>
                {d.id !== currentDeviceKeyId && (
                  <button 
                    className="danger-button small" 
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to revoke trust for this device? It will lose access to E2EE chat.')) {
                        try {
                          await revokeDeviceKey(d.id);
                          loadDeviceManagementData();
                        } catch (e) {
                          window.alert('Failed to revoke device: ' + e.message);
                        }
                      }
                    }}
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}

            {/* Workspace Approval list */}
            {workspaceKey && workspaceDevices.length > 0 && (
              <>
                <h5 style={{ margin: '16px 0 6px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Workspace Device Approvals</h5>
                {workspaceDevices.map(kd => {
                  const hasGrant = workspaceGrants.some(g => g.device_key_id === kd.id);
                  const editorName = workspace && workspace.editors 
                    ? (workspace.editors.find(e => e.id === kd.user_id) && workspace.editors.find(e => e.id === kd.user_id).name) 
                    : null;

                  return (
                    <div key={kd.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '8px 0', borderBottom: '1px dashed var(--border)' }}>
                      <div style={{ marginRight: '12px' }}>
                        <strong style={{ display: 'block' }}>{kd.device_name}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          User: {editorName || kd.user_id.slice(0, 8)}
                        </span>
                      </div>
                      {hasGrant ? (
                        <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>🟢 Approved</span>
                      ) : (
                        <button 
                          className="primary-button small" 
                          onClick={async () => {
                            try {
                              await grantWorkspaceKeyAccess(kd.user_id, kd.id, kd.public_key);
                              window.alert('Device approved successfully! Workspace key granted.');
                              loadDeviceManagementData();
                            } catch (e) {
                              window.alert('Failed to approve device: ' + e.message);
                            }
                          }}
                          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
                        >
                          🔐 Approve
                        </button>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </section>

          {/* Plan Section */}
          <section className="form-stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px' }}>
              <span>Subscription Plan</span>
              <span className="badge badge-success" style={{ textTransform: 'capitalize', fontSize: '0.75rem', fontWeight: 'bold' }}>
                {meta.account && meta.account.plan && meta.account.plan.name ? meta.account.plan.name : 'Free'}
              </span>
            </h4>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Storage Limit:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {meta.account && meta.account.plan && meta.account.plan.max_storage_bytes ? formatBytes(meta.account.plan.max_storage_bytes) : '2 GB'}
              </strong>
            </div>
            {meta.account && meta.account.plan && meta.account.plan.key === 'free' && (
              <button 
                className="primary-button small full-width"
                style={{ marginTop: '8px' }}
                onClick={() => {
                  window.alert('Upgrading to Pro... Please contact our sales team to proceed with custom billing plans.');
                }}
              >
                Upgrade to Pro (100 GB)
              </button>
            )}
          </section>

          {/* Storage Usage Section */}
          <section className="form-stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 8px' }}>Storage Usage</h4>
            <div className="progress-track" style={{ height: '10px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <span 
                style={{ 
                  display: 'block',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--violet), var(--cyan))',
                  width: `${meta.account && meta.account.storagePercent ? Math.min(100, meta.account.storagePercent) : 0}%`,
                  transition: 'width 0.3s ease'
                }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>
                {meta.account && meta.account.storageUsedBytes !== undefined ? formatBytes(meta.account.storageUsedBytes) : '0 Bytes'} used of{' '}
                {meta.account && meta.account.storageLimitBytes !== undefined ? formatBytes(meta.account.storageLimitBytes) : '2 GB'}
              </span>
              <span>
                {meta.account && meta.account.storagePercent !== undefined ? Number(meta.account.storagePercent).toFixed(1) : '0.0'}%
              </span>
            </div>
          </section>

          <section className="form-stack">
            <h4>Workspaces</h4>
            {backendWorkspaceLoading && (
              <div className="muted-text">Loading workspaces...</div>
            )}

            {backendWorkspaceError && (
              <div className="form-error">{backendWorkspaceError}</div>
            )}

            {visibleWorkspaces.map((ws) => (
              <div
                className="workspace-row"
                key={ws.id}
                role="button"
                tabIndex={0}
                onClick={() => switchWorkspace(ws.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    switchWorkspace(ws.id);
                  }
                }}
              >
                <span>
                  {ws.id === meta.currentWorkspaceId ? '✦' : '🏢'} {ws.name}
                </span>

                <div className="card-actions">
                  {ws.id === meta.currentWorkspaceId && (
                    <button
                      className="ghost-button small"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenWorkspaceModal('rename');
                      }}
                    >
                      Rename
                    </button>
                  )}

                  {usingBackendWorkspaces && backendWorkspaces.length > 1 && (
                    <button
                      className="danger-button small"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${ws.name}"?`)) {
                          deleteBackendWorkspaceById(ws.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}

                  {!usingBackendWorkspaces && meta.workspaces.length > 1 && (
                    <button
                      className="danger-button small"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (window.confirm(`Are you sure you want to delete "${ws.name}"?`)) {
                          deleteWorkspaceById(ws.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
              
            <div className="card-actions wrap-actions">
              <button className="ghost-button" onClick={() => onOpenWorkspaceModal('create')}>＋ New Workspace</button>
              <div className="inline-row grow">
                <input className="text-input compact" placeholder="Join by workspace name…" value={joinName} onChange={(event) => setJoinName(event.target.value)} />
                <button className="ghost-button small" onClick={() => { joinOrCreateWorkspace(joinName); setJoinName(''); }}>Join</button>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
