import { useEffect, useState } from 'react';
import { getInviteDetails, acceptWorkspaceInvite } from '../services/workspaceApi';
import { supabase } from '../config/supabaseclient';

export default function AcceptInvitePage({ session }) {
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [invite, setInvite] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    useEffect(() => {
        if (!token) {
            setError('Missing invitation token.');
            setLoading(false);
            return;
        }

        getInviteDetails(token)
            .then((data) => {
                setInvite(data);
                setLoading(false);
            })
            .catch((err) => {
                setError(err.message || 'Failed to load invitation details. The link may have expired.');
                setLoading(false);
            });
    }, [token]);

    const handleGoogleLogin = async () => {
        try {
            setLoginLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.href
                }
            });
            if (error) throw error;
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message);
            setLoginLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!token || accepting) return;
        setAccepting(true);
        setError('');

        try {
            await acceptWorkspaceInvite(token);
            
            try {
                const metaKey = 'editorflow_meta';
                const saved = localStorage.getItem(metaKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    parsed.currentWorkspaceId = invite?.workspace_id;
                    parsed.workspaces = parsed.workspaces || [];
                    if (!parsed.workspaces.some(w => w.id === invite?.workspace_id)) {
                        parsed.workspaces.push({
                            id: invite?.workspace_id,
                            name: invite?.workspace_name || 'Joined Workspace',
                            createdAt: Date.now()
                        });
                    }
                    localStorage.setItem(metaKey, JSON.stringify(parsed));
                } else {
                    const newMeta = {
                        currentWorkspaceId: invite?.workspace_id,
                        workspaces: [{ id: invite?.workspace_id, name: invite?.workspace_name || 'Joined Workspace', createdAt: Date.now() }],
                        account: null
                    };
                    localStorage.setItem(metaKey, JSON.stringify(newMeta));
                }
            } catch (err) {
                console.error('Failed to update meta on accept invite:', err);
            }

            setSuccess(true);
            
            // Redirect to home/app shell after 2 seconds
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to accept invitation.');
            setAccepting(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'radial-gradient(circle at top left, rgba(139, 92, 246, .15), transparent 40%), #080c14',
                color: 'var(--text-primary)',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)',
                    animation: 'pulse 1.8s infinite ease-in-out',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '16px'
                }}>
                    ✦
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>Validating invitation...</p>
                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.06); }
                        100% { transform: scale(1); }
                    }
                `}</style>
            </div>
        );
    }

    const emailMismatch = session && invite && session.user?.email?.toLowerCase() !== invite.email?.toLowerCase();

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(circle at top left, rgba(139, 92, 246, .2), transparent 45%), radial-gradient(circle at bottom right, rgba(6, 182, 212, .15), transparent 45%), #080c14',
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
            padding: '24px'
        }}>
            <div style={{
                maxWidth: '480px',
                width: '100%',
                padding: '40px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                background: 'rgba(8, 12, 20, 0.75)',
                backdropFilter: 'blur(24px)',
                boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, var(--violet), var(--cyan))',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '30px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
                    margin: '0 auto 24px'
                }}>
                    ✦
                </div>

                {success ? (
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 12px', color: '#10b981' }}>
                            Success!
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}>
                            You have successfully joined <strong style={{ color: '#ffffff' }}>{invite?.workspace_name}</strong>. Redirecting you to your new workspace dashboard...
                        </p>
                    </div>
                ) : error ? (
                    <div>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: 'rgba(244, 63, 94, 0.1)',
                            color: 'var(--rose)',
                            fontSize: '24px',
                            display: 'grid',
                            placeItems: 'center',
                            margin: '0 auto 16px'
                        }}>
                            ⚠️
                        </div>
                        <h3 style={{ margin: '0 0 12px', fontSize: '20px' }}>Invitation Error</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                            {error}
                        </p>
                        <a href="/" className="primary-button" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px' }}>
                            Back to Dashboard
                        </a>
                    </div>
                ) : (
                    <div>
                        <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                            Workspace Invitation
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 32px' }}>
                            You've been invited to join a collaborative workspace on EditorFlow.
                        </p>

                        <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '16px',
                            padding: '20px',
                            textAlign: 'left',
                            marginBottom: '28px',
                            fontSize: '14px'
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Workspace</span>
                                <strong style={{ fontSize: '16px', color: '#ffffff' }}>{invite.workspace_name}</strong>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Invited By</span>
                                <span style={{ color: 'var(--text-secondary)' }}>{invite.inviter_name}</span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>Designated Role</span>
                                <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{invite.role}</span>
                            </div>
                        </div>

                        {!session ? (
                            <div>
                                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
                                    This invitation was sent to <strong style={{ color: '#ffffff' }}>{invite.email}</strong>. Please sign in to accept this invitation.
                                </p>
                                <button
                                    className="primary-button full-width"
                                    onClick={handleGoogleLogin}
                                    disabled={loginLoading}
                                    style={{ padding: '14px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    {loginLoading ? 'Redirecting...' : 'Sign In with Google'}
                                </button>
                            </div>
                        ) : emailMismatch ? (
                            <div style={{
                                background: 'rgba(244, 63, 94, 0.1)',
                                border: '1px solid rgba(244, 63, 94, 0.2)',
                                borderRadius: '14px',
                                padding: '16px',
                                textAlign: 'left',
                                marginBottom: '24px',
                                fontSize: '13px',
                                lineHeight: 1.5
                            }}>
                                <strong style={{ color: 'var(--rose)', display: 'block', marginBottom: '4px' }}>Account Mismatch Warning</strong>
                                This invite was sent to <strong style={{ color: '#ffffff' }}>{invite.email}</strong>, but you are currently logged in as <strong style={{ color: '#ffffff' }}>{session?.user?.email}</strong>. Please sign out and sign in with the invited email address.
                                <button className="danger-button small full-width" onClick={handleLogout} style={{ marginTop: '12px' }}>
                                    🚪 Logout of {session?.user?.email}
                                </button>
                            </div>
                        ) : (
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                                    Accepting this invite will add you as an active member under your email: <strong style={{ color: '#ffffff' }}>{session?.user?.email}</strong>.
                                </p>
                                <button
                                    className="primary-button full-width"
                                    onClick={handleAccept}
                                    disabled={accepting}
                                    style={{ padding: '14px', fontSize: '15px', fontWeight: 600 }}
                                >
                                    {accepting ? '🚀 Joining Workspace...' : '✨ Accept Invitation & Join'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
