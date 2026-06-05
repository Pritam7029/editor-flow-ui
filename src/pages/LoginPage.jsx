import { useState } from 'react';
import { supabase } from '../config/supabaseclient';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/login'
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <div style={{ padding: '2.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '400px', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(4px)', textAlign: 'center' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--primary) 0%, #a78bfa 100%)', color: '#fff', fontSize: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>
          ✦
        </div>

        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.75rem', fontWeight: '700' }}>
          Welcome to EditorFlow
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Collaborative workspace management for video and editor teams.
        </p>
        
        {error && <div style={{ color: 'var(--danger)', marginBottom: '1.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="primary-button" 
          style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', border: 'none', borderRadius: '8px', background: 'var(--primary)', color: '#fff', boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)', transition: 'transform 0.15s ease' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}
