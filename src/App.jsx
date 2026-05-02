import { useEffect, useState } from 'react';
import { supabase } from './config/supabaseclient';
import { AppProvider } from './context/AppContext';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', background: 'var(--bg-main)' }}>Loading...</div>;
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <AppProvider session={session}>
      <AppShell />
    </AppProvider>
  );
}
