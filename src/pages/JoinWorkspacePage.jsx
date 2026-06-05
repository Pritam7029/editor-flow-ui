import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseclient';
import { getJoinLinkDetails, requestWorkspaceAccess } from '../services/workspaceApi';

export default function JoinWorkspacePage({ session }) {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workspaceInfo, setWorkspaceInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getJoinLinkDetails(token)
      .then((res) => {
        if (!active) return;
        if (res && res.success) {
          setWorkspaceInfo(res.data);
        } else {
          setError((res && res.message) || 'Invalid join link');
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error('Failed to load join link details:', err);
        setError(err.message || 'Invitation link is invalid or has expired');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, session]);

  const handleGoogleLogin = async () => {
    try {
      setLoginLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href // Return exactly to this join page after login
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Login failed:', err);
      setError(err.message);
      setLoginLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    if (!session || !workspaceInfo) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        message,
        requestedRole: workspaceInfo.defaultRequestedRole || 'editor'
      };

      await requestWorkspaceAccess(token, payload);
      setRequestSubmitted(true);
    } catch (err) {
      console.error('Access request failed:', err);
      setError(err.message || 'Failed to request access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Case 1: User is not logged in
  if (!session) {
    return (
      <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Workspace Invitation</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
            You have been invited to join a collaborative workspace on EditorFlow. Please sign in with Google to accept the invite and request access.
          </p>

          {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '0.9rem' }}>{error}</div>}

          <button 
            onClick={handleGoogleLogin}
            disabled={loginLoading}
            className="primary-button" 
            style={{ width: '100%', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' }}
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
      </div>
    );
  }

  // Case 2: Link is invalid or expired
  if (error) {
    return (
      <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'var(--danger)' }}>Link Invalid</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
            {error}
          </p>
          <button onClick={() => navigate('/')} className="primary-button" style={{ padding: '0.5rem 2rem' }}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Case 3: Request submitted successfully
  if (requestSubmitted) {
    return (
      <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '460px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>Request Pending</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Your request to join <strong>{workspaceInfo && workspaceInfo.workspace ? workspaceInfo.workspace.name : 'the workspace'}</strong> has been submitted.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            An administrator has been notified and must approve your request before you can access the dashboard.
          </p>
          <button onClick={() => navigate('/')} className="primary-button" style={{ width: '100%', padding: '0.75rem' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Logged in, show workspace details and click to request access
  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '480px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>
          Join Workspace
        </h2>

        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem', lineHeight: '1.5', textAlign: 'center' }}>
          You have been invited to join: <br />
          <strong style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'block', marginTop: '8px' }}>
            {workspaceInfo && workspaceInfo.workspace ? workspaceInfo.workspace.name : 'Workspace'}
          </strong>
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
            Include a message for the workspace admin (optional)
          </label>
          <textarea
            className="text-input"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! I am joining as a video editor..."
            style={{ width: '100%' }}
          />
        </div>

        <button 
          onClick={handleRequestAccess}
          className="primary-button" 
          style={{ width: '100%', padding: '0.8rem', fontWeight: 'bold' }}
        >
          Request Access to Join
        </button>

        <button 
          onClick={() => navigate('/')} 
          className="text-button" 
          style={{ marginTop: '1rem', width: '100%', textAlign: 'center', fontSize: '0.9rem' }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
