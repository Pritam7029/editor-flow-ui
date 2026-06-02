import { useEffect, useState } from 'react';
import { getInviteDetails, acceptWorkspaceInvite } from '../services/workspaceApi';
import { supabase } from '../config/supabaseclient';

export default function AcceptInvitePage({ session }) {
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
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

    const handleAccept = async () => {
        if (!token || accepting) return;
        setAccepting(true);
        setError('');

        try {
            await acceptWorkspaceInvite(token);
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

    const emailMismatch = invite && session?.user?.email?.toLowerCase() !== invite.email?.toLowerCase();

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

                        {emailMismatch ? (
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
