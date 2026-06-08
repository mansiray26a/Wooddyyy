import React, { useState } from 'react';
import { api } from '../api';
import '../styles/register.css';

export default function RegisterPage({ onRegisterSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Custom mismatch flag
  const passwordsMatch = password && confirmPassword ? password === confirmPassword : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !password || !confirmPassword) return;
    if (password !== confirmPassword) return;

    setError('');
    setFormSubmitted(true);
    try {
      const data = await api.post('/api/auth/register', {
        fullName,
        email,
        phone,
        password
      });
      localStorage.setItem('woody-token', data.token);
      if (onRegisterSuccess) await onRegisterSuccess();
      window.location.hash = '#student-dashboard';
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      setFormSubmitted(false);
    }
  };

  return (
    <div className="register-container">
      {/* Back to Home */}
      <a href="#" className="back-to-home-link">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to Home</span>
      </a>

      {/* Decorative Book-Sprout Illustration on Left */}
      <div className="desk-sprout-illustration">
        <svg width="70" height="90" viewBox="0 0 70 90" fill="none">
          {/* Wooden plant sprout */}
          <path d="M35 80C35 40 25 25 35 10" stroke="#2C5E3B" strokeWidth="3" strokeLinecap="round" />
          <path d="M35 45C22 40 15 42 12 45C10 47 18 52 35 50" fill="#E8F3D6" stroke="#2D2C24" strokeWidth="2" />
          <path d="M35 30C48 25 55 27 58 30C60 32 52 37 35 35" fill="#E8F3D6" stroke="#2D2C24" strokeWidth="2" />
          {/* Wooden desk surface outline */}
          <path d="M5 80H65" stroke="#2D2C24" strokeWidth="3" strokeLinecap="round" />
          {/* Pot */}
          <path d="M22 62L48 62L44 80L26 80L22 62Z" fill="#F7E7D9" stroke="#2D2C24" strokeWidth="2.5" />
        </svg>
        <span className="sprout-text handwritten">Plant your goal!</span>
      </div>

      {/* Main Registration Form Sheet */}
      <div className="register-paper sketch-border sketch-shadow">
        {/* Binder tape accent at top */}
        <div className="paper-tape"></div>

        <div className="register-header">
          <h2 className="register-title">Craft Your Workspace</h2>
          <p className="register-subtitle">Set up your digital learning desk and begin your focus journey.</p>
        </div>

        {error && (
          <div className="error-message sketch-border-sm" style={{ backgroundColor: '#FFEDEB', color: '#C62828', padding: '10px 14px', fontSize: '13px', marginBottom: '16px', border: '2px solid #C62828', borderRadius: '4px', textAlign: 'center', fontFamily: 'var(--sans)', fontWeight: 'bold' }}>
            ⚠️ {error}
          </div>
        )}

        {formSubmitted ? (
          <div className="mock-success-screen text-center">
            <span className="handwritten" style={{ fontSize: '32px' }}>Workspace Carved! 🎉</span>
            <div className="growing-flower-animation mt-4">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="flower-grow-svg">
                {/* Sprout growing */}
                <path d="M40 75C40 40 38 25 40 15" stroke="#2C5E3B" strokeWidth="3" strokeLinecap="round" />
                <path d="M40 45C25 40 20 42 18 45" stroke="#2D2C24" strokeWidth="2" />
                {/* Blossoming Flower */}
                <circle cx="40" cy="15" r="8" fill="#E6A817" stroke="#2D2C24" strokeWidth="2" />
                <circle cx="40" cy="5" r="5" fill="#FFFDF9" stroke="#2D2C24" strokeWidth="1.5" />
                <circle cx="30" cy="15" r="5" fill="#FFFDF9" stroke="#2D2C24" strokeWidth="1.5" />
                <circle cx="50" cy="15" r="5" fill="#FFFDF9" stroke="#2D2C24" strokeWidth="1.5" />
                <circle cx="40" cy="25" r="5" fill="#FFFDF9" stroke="#2D2C24" strokeWidth="1.5" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-3">Opening your cabin dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            
            {/* Full Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                className="form-input sketch-border-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Woody Sharma"
                required
              />
            </div>

            {/* Email ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email ID</label>
              <input
                type="email"
                id="email"
                className="form-input sketch-border-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                className="form-input sketch-border-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98765 43210"
                required
              />
            </div>

            {/* Grid layout for passwords on wider devices */}
            <div className="password-grid">
              
              {/* Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-input sketch-border-sm pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17.6 17.6a10.9 10.9 0 0 1-5.6 1.4c-7 0-11-8-11-8a19.4 19.4 0 0 1 3.5-4.5"></path>
                        <path d="M23 12s-4 8-11 8a11 11 0 0 1-2.2-.2"></path>
                        <path d="M9.5 4.5A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-1.8 2.5"></path>
                        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`form-input sketch-border-sm pr-10 ${!passwordsMatch ? 'input-error' : ''}`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M17.6 17.6a10.9 10.9 0 0 1-5.6 1.4c-7 0-11-8-11-8a19.4 19.4 0 0 1 3.5-4.5"></path>
                        <path d="M23 12s-4 8-11 8a11 11 0 0 1-2.2-.2"></path>
                        <path d="M9.5 4.5A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-1.8 2.5"></path>
                        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2.5"></line>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Inline warning for password mismatch */}
            {!passwordsMatch && (
              <span className="password-mismatch-warning handwritten text-center">
                ⚠️ passwords do not match yet!
              </span>
            )}

            {/* Terms of workspace check */}
            <label className="remember-me-label mt-2">
              <input type="checkbox" className="custom-checkbox" required />
              <span className="ml-2 text-xs">I agree to focus mindfully & support peers</span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!passwordsMatch}
              className={`btn-sketch btn-sketch-primary sketch-border sketch-shadow w-full justify-center mt-3 ${!passwordsMatch ? 'btn-disabled' : ''}`}
            >
              <span>Carve Workspace</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </form>
        )}

        <div className="register-footer text-center">
          <span>Already have a workspace carved?</span>
          <a href="#login" className="login-redirect-link font-bold">
            Enter study cabin &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
