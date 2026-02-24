import React, { useEffect } from 'react';
import './Login.css';

export default function Login() {
  useEffect(() => {
    // Check if user is already authenticated
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      window.location.href = '/dashboard';
    }
  }, []);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>MyRSS Reader</h1>
        <p>Keep up with your favorite feeds</p>
        
        <button onClick={handleGoogleLogin} className="btn-google">
          <span>Sign in with Google</span>
        </button>

        <div className="features">
          <h3>Features:</h3>
          <ul>
            <li>✓ Subscribe to RSS feeds</li>
            <li>✓ Mark items as read (batch)</li>
            <li>✓ Save items for later</li>
            <li>✓ View only unread items</li>
            <li>✓ Automatic feed updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
