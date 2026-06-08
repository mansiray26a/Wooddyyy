import React, { useState, useEffect } from 'react';
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

  const checkSession = async () => {
    const token = localStorage.getItem('woody-token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      console.error('Session validation failed:', err);
      localStorage.removeItem('woody-token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

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
          window.location.hash = '#login';
        }
      } else {
        setView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // parse on first load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('woody-token');
    setUser(null);
    window.location.hash = '#login';
  };

  if (loading) {
    return (
      <div className="app-workspace loading-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--wood-bg)' }}>
        <div className="spinner-sketch" style={{ fontSize: '48px', animation: 'spin 1.5s linear infinite' }}>🌿</div>
      </div>
    );
  }

  // Dashboard gets its own full-page layout (no shared navbar)
  if (view === 'dashboard') {
    return <Dashboard onLogout={handleLogout} user={user} onUserUpdate={setUser} />;
  }

  // Login & register pages get their own full-page layout (no navbar/footer)
  if (view === 'login' || view === 'register') {
    return (
      <main className="main-content">
        {view === 'login'    && <LoginPage onLoginSuccess={checkSession} />}
        {view === 'register' && <RegisterPage onRegisterSuccess={checkSession} />}
      </main>
    );
  }

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

