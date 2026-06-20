import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../config/supabaseclient';
import { AppProvider } from '../context/AppContext';
import { EncryptionProvider } from '../context/EncryptionContext';
import { SocketProvider } from '../context/SocketContext';
import { ChatProvider } from '../context/ChatContext';
import AppShell from '../components/layout/AppShell';
import LoginPage from '../pages/LoginPage';
import LandingLayout from '../components/landing/LandingLayout.jsx';
import Home from '../pages/landing/Home.jsx';
import Features from '../pages/landing/Features.jsx';
import Pricing from '../pages/landing/Pricing.jsx';
import About from '../pages/landing/About.jsx';
import Contact from '../pages/landing/Contact.jsx';
import PrivacyPolicy from '../pages/landing/PrivacyPolicy.jsx';
import PlanSelectionPage from '../pages/PlanSelectionPage';
import JoinWorkspacePage from '../pages/JoinWorkspacePage';
import AcceptInvitePage from '../pages/AcceptInvitePage';
import { bootstrapSession } from '../services/workspaceApi';

export default function AppRoutes() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [bootstrapData, setBootstrapData] = useState(null);
  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    // 2. Auth changes listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sync bootstrap data when session is established
  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      setBootstrapData(null);
      return;
    }

    // Load bootstrap data from backend
    let active = true;
    setBootstrapLoading(true);
    bootstrapSession()
      .then((data) => {
        if (!active) return;
        setBootstrapData(data);
        
        // Handle post-login routing decision if on auth/login paths
        if (location.pathname === '/login') {
          navigate((data && data.nextRoute) || '/dashboard');
        }
      })
      .catch((err) => {
        console.error('Bootstrap failed:', err);
      })
      .finally(() => {
        if (active) setBootstrapLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, authLoading, location.pathname]);

  const redirectPath = (bootstrapData && bootstrapData.nextRoute) || '/dashboard';

  if (authLoading || (session && bootstrapLoading && !bootstrapData)) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', background: 'var(--bg-main)' }}>
        <div className="spinner" style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={session ? <Navigate to={redirectPath} replace /> : <LandingLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Route>
      
      <Route 
        path="/login" 
        element={
          session ? <Navigate to={redirectPath} replace /> : <LoginPage />
        } 
      />

      <Route 
        path="/onboarding/plan" 
        element={
          !session ? <Navigate to="/" replace /> : (
            <PlanSelectionPage 
              session={session} 
              bootstrapData={bootstrapData} 
              onPlanSelected={async () => {
                // Refresh bootstrap on plan selection and redirect
                const data = await bootstrapSession();
                setBootstrapData(data);
                navigate((data && data.nextRoute) || '/dashboard');
              }} 
            />
          )
        } 
      />

      <Route 
        path="/join/:token" 
        element={
          <JoinWorkspacePage 
            session={session} 
            onJoinSuccess={async () => {
              const data = await bootstrapSession();
              setBootstrapData(data);
              navigate('/dashboard');
            }} 
          />
        } 
      />

      <Route 
        path="/accept-invite" 
        element={
          <AcceptInvitePage session={session} />
        } 
      />

      <Route 
        path="/dashboard" 
        element={
          !session ? <Navigate to="/" replace /> : (
            bootstrapData && bootstrapData.nextRoute === '/onboarding/plan' ? <Navigate to="/onboarding/plan" replace /> : (
              <AppProvider session={session}>
                <EncryptionProvider>
                  <SocketProvider>
                    <ChatProvider>
                      <AppShell />
                    </ChatProvider>
                  </SocketProvider>
                </EncryptionProvider>
              </AppProvider>
            )
          )
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

