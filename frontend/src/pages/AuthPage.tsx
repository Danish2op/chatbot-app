import React, { useState, useEffect } from 'react';
import { useSignInEmailPassword, useSignUpEmailPassword, useAuthenticationStatus } from '@nhost/react';
import { Navigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { signInEmailPassword, isLoading: signInLoading, error: signInError } = useSignInEmailPassword();
  const { signUpEmailPassword, isLoading: signUpLoading, error: signUpError } = useSignUpEmailPassword();
  const { isAuthenticated } = useAuthenticationStatus();

  useEffect(() => {
    if (isAuthenticated) {
      // User is already authenticated, redirect to chat
    }
  }, [isAuthenticated]);

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignIn) {
      await signInEmailPassword(email, password);
    } else {
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      await signUpEmailPassword(email, password);
    }
  };

  const isLoading = signInLoading || signUpLoading;
  const error = signInError || signUpError;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isSignIn ? 'Sign In' : 'Sign Up'}</h1>
        
        {error && (
          <div className="error-message">
            {error.message}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          
          {!isSignIn && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={6}
              />
            </div>
          )}
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isSignIn ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        
        <div className="auth-toggle">
          <p>
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setIsSignIn(!isSignIn)}
              disabled={isLoading}
              className="link-button"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;