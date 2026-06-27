import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './component/navbar.jsx';
import Footer from './component/footer.jsx';
import Landing from './pages/landing.jsx';
import LoginPage from './pages/login-page.jsx';
import RegisterPage from './pages/register-page.jsx';
import Dashboard from './pages/student/dashboard.jsx';
import { api } from './api';
import './App.css';

function App() {
  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('woody-token');
    setUser(null);
    setView('login');
    window.location.hash = '#login';
  }, []);

  const checkSession = useCallback(async () => {
    const token = localStorage.getItem('woody-token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
      // If we have a valid user and we're on the dashboard hash, stay on dashboard
      if (window.location.hash === '#student-dashboard') {
        setView('dashboard');
      }
    } catch (err) {
      // api.js already cleared the token and set hash to #login on 401
      // We just need to update React state here
      console.warn('Session check failed:', err.message);
      localStorage.removeItem('woody-token');
      setUser(null);
      setView('login');
    } finally {
      setLoading(false);
    }
  }, []);

  // Run session check once on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Listen to hash changes for navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const token = localStorage.getItem('woody-token');

      if (hash === '#login') {
        setView('login');
      } else if (hash === '#register') {
        setView('register');
      } else if (hash === '#student-dashboard') {
        if (token) {
          setView('dashboard');
        } else {
          // No token — send to login
          window.location.hash = '#login';
        }
      } else {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Run once to handle the initial URL on first load
    if (!loading) {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [loading]);

  // Full-screen loading spinner while checking session
  if (loading) {
    return (
      <div
        className="app-workspace"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: 16,
          background: 'var(--wood-bg)',
        }}
      >
        <div style={{ fontSize: '52px', animation: 'spin 1.5s linear infinite' }}>🌿</div>
        <p style={{ fontFamily: 'var(--heading)', fontSize: 18, color: 'var(--wood-ink-muted)' }}>
          Opening your cabin…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Dashboard — full-page layout (no shared navbar / footer)
  if (view === 'dashboard') {
    return (
      <Dashboard
        onLogout={handleLogout}
        user={user}
        onUserUpdate={setUser}
      />
    );
  }

  // Auth pages — no navbar / footer
  if (view === 'login' || view === 'register') {
    return (
      <main className="main-content">
        {view === 'login' && <LoginPage onLoginSuccess={checkSession} />}
        {view === 'register' && <RegisterPage onRegisterSuccess={checkSession} />}
      </main>
    );
  }

  // Landing page
  return (
    <div className="app-workspace">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="main-content">
        {view === 'landing' && <Landing user={user} />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
