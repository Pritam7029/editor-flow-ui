import { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useEncryption } from '../../context/EncryptionContext';
import { COLOR_OPTIONS } from '../../utils/constants';
import { getAvatarInitials } from '../../utils/helpers';
import { supabase } from '../../config/supabaseclient';
import { initAvatarUpload, completeAvatarUpload, updateMyProfile } from '../../services/profileApi';
import { uploadFileWithProgress } from '../../services/fileApi';
import { getWorkspaceKeyGrants, getWorkspaceMemberKeys } from '../../services/encryptionApi';
import ChangeRecoveryAnswer from '../security/ChangeRecoveryAnswer';

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
    encryptionIdentity,
    workspaceKey,
    workspaceKeyVersion,
    isWorkspaceEncryptionEnabled,
    grantWorkspaceKeyAccess,
    resetIdentity
  } = useEncryption();

  const [form, setForm] = useState(meta.account);
  const [joinName, setJoinName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Grants & Recovery states
  const [isChangingRecovery, setIsChangingRecovery] = useState(false);
  const [memberKeys, setMemberKeys] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loadingGrants, setLoadingGrants] = useState(false);

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

  const loadGrantsData = async () => {
    if (!isOpen || !workspaceKey || !meta || !meta.currentWorkspaceId) return;
    try {
      setLoadingGrants(true);
      const mKeys = await getWorkspaceMemberKeys(meta.currentWorkspaceId);
      const grantsResult = await getWorkspaceKeyGrants(meta.currentWorkspaceId);
      
      setMemberKeys(mKeys || []);
      setGrants(grantsResult && grantsResult.grants ? grantsResult.grants : []);
    } catch (err) {
      console.error('Failed to load grants data:', err);
    } finally {
      setLoadingGrants(false);
    }
  };

  useEffect(() => {
    loadGrantsData();
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

          {/* E2EE Recovery & Access Management Section */}
          <section className="form-stack" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px' }}>🔒 Chat Encryption Settings</h4>
            
            {encryptionIdentity ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E2EE status</div>
                  <div style={{ color: 'var(--emerald)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '13px' }}>
                    🟢 Active & Session Unlocked
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '6px' }}>
                    <strong>Recovery Question:</strong> {encryptionIdentity.recoveryQuestionText}
                  </div>
                </div>

                {!isChangingRecovery ? (
                  <button 
                    className="ghost-button small" 
                    onClick={() => setIsChangingRecovery(true)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Change Recovery Question/Answer
                  </button>
                ) : (
                  <ChangeRecoveryAnswer 
                    onCancel={() => setIsChangingRecovery(false)} 
                    onSuccess={() => {
                      setIsChangingRecovery(false);
                      loadGrantsData();
                    }}
                  />
                )}

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', padding: '12px 0 0 0', marginTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', lineHeight: '1.4' }}>
                    If you lose your recovery answer, you can reset your identity. 
                    Warning: This will generate new keys and make all past chat history permanently undecryptable.
                  </span>
                  <button 
                    className="danger-button small" 
                    onClick={async () => {
                      if (window.confirm('CRITICAL WARNING: Are you absolutely sure you want to reset your encryption identity? All existing encrypted chats in all workspaces will become permanently undecryptable.')) {
                        try {
                          await resetIdentity();
                          window.alert('Encryption identity reset successfully.');
                          onClose();
                        } catch (e) {
                          window.alert('Failed to reset identity: ' + e.message);
                        }
                      }
                    }}
                    style={{ display: 'block', marginTop: '8px', padding: '6px 12px' }}
                  >
                    ⚠️ Reset Encryption Identity
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Encryption is not configured for your account. Go to the Chat panel to set it up.
              </div>
            )}

            {/* Workspace Member key grants */}
            {workspaceKey && isWorkspaceEncryptionEnabled && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <h5 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>E2EE Workspace Access Grants</h5>
                {loadingGrants ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Checking workspace keys...</div>
                ) : (
                  (() => {
                    const pendingGrants = memberKeys.filter(mk => mk.user_id !== (meta.account && meta.account.id) && !grants.some(g => g.recipient_user_id === mk.user_id));
                    if (pendingGrants.length === 0) {
                      return <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>All active members in this workspace have key access.</div>;
                    }
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pendingGrants.map(memberKey => {
                          const editor = workspace && workspace.editors 
                            ? workspace.editors.find(e => e.id === memberKey.user_id) 
                            : null;
                          const nameDisplay = editor ? editor.name : memberKey.user_id.slice(0, 8);
                          
                          return (
                            <div key={memberKey.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '6px' }}>
                              <div>
                                <strong>{nameDisplay}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Identity</div>
                              </div>
                              <button
                                className="primary-button small"
                                onClick={async () => {
                                  try {
                                    await grantWorkspaceKeyAccess(memberKey.user_id, memberKey.public_key);
                                    window.alert(`Access granted to ${nameDisplay}!`);
                                    loadGrantsData();
                                  } catch (err) {
                                    window.alert('Failed to grant access: ' + err.message);
                                  }
                                }}
                                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', background: 'var(--violet)', border: 'none', color: '#fff' }}
                              >
                                🔐 Grant Key
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                )}
              </div>
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
