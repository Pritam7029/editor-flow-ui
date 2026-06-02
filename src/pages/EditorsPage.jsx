import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAvatarInitials } from '../utils/helpers';
import { canManageEditors } from '../utils/rbac';
import { getWorkspaceMembers, updateWorkspaceMemberRole, removeWorkspaceMember } from '../services/workspaceApi';

export default function EditorsPage({ onOpenEditorModal }) {
  const { workspace, meta, pushToast, dispatch } = useAppContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMembers = async () => {
    if (!meta.currentWorkspaceId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getWorkspaceMembers(meta.currentWorkspaceId);
      setMembers(data || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [meta.currentWorkspaceId]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await updateWorkspaceMemberRole(meta.currentWorkspaceId, memberId, newRole);
      pushToast('Member role updated successfully!');
      fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to update member role.');
    }
  };

  const handleRemove = async (memberId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this member'} from the workspace?`)) return;
    try {
      await removeWorkspaceMember(meta.currentWorkspaceId, memberId);
      pushToast('Member removed from workspace.', 'error');
      fetchMembers();
    } catch (err) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  // Check if current user is owner or admin in this workspace
  const userMemberRecord = members.find(m => m.user_id === meta.account?.id);
  const userRole = userMemberRecord?.role || 'editor';
  const isAdminOrOwner = userRole === 'owner' || userRole === 'admin';

  if (loading) {
    return (
      <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading team members...
      </div>
    );
  }

  return (
    <section className="page-stack">
      <div className="section-header-row">
        <div>
          <h2>Workspace Members</h2>
          <p>Manage roles and collaboration settings for this workspace.</p>
        </div>
        {isAdminOrOwner && (
          <button className="primary-button" onClick={onOpenEditorModal}>＋ Invite Member</button>
        )}
      </div>

      {error && (
        <div className="form-error" style={{ padding: '16px', borderRadius: '12px' }}>
          {error}
        </div>
      )}

      <div className="card-grid">
        {members.length === 0 && !error && (
          <div className="empty-card">No workspace members found.</div>
        )}
        
        {members.map((member) => {
          const profile = member.profile || {};
          const displayName = profile.full_name || profile.email?.split('@')[0] || 'Invited Member';
          const email = profile.email || 'Waiting for signup';
          const color = profile.color || '#8b5cf6';
          
          const isOwner = member.role === 'owner';
          const isSelf = member.user_id === meta.account?.id;
          
          return (
            <article className="person-card" key={member.id}>
              <div className="person-card-head" style={{ gap: '16px', alignItems: 'flex-start' }}>
                <div 
                  className="avatar-square large" 
                  style={{ 
                    color: color, 
                    background: `${color}20`,
                    fontSize: '20px',
                    fontWeight: 700
                  }}
                >
                  {getAvatarInitials(displayName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '16px', fontWeight: 600, margin: 0 }}>
                    {displayName} {isSelf && <span style={{ fontSize: '11px', color: 'var(--cyan)', fontWeight: 500 }}>(You)</span>}
                  </h3>
                  <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    {email}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Workspace Role
                </span>

                {isAdminOrOwner && !isOwner && !isSelf ? (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: '#080c14',
                      color: 'var(--text-primary)',
                      fontSize: '13px'
                    }}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                ) : (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '13px', 
                    color: 'var(--text-primary)',
                    textTransform: 'capitalize',
                    padding: '8px 0'
                  }}>
                    {isOwner ? '👑 Workspace Owner' : member.role}
                  </div>
                )}
              </div>

              <div className="card-actions" style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border)', justifyContent: 'flex-end', gap: '12px' }}>
                {isAdminOrOwner && !isOwner && !isSelf && (
                  <button 
                    className="danger-button small" 
                    onClick={() => handleRemove(member.id, displayName)}
                  >
                    Remove Member
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
