import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import FeedPanel from '../components/FeedPanel';
import ItemList from '../components/ItemList';
import './Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      navigate('/');
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="dashboard">
      <header className="header">
        <button
          className="hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1>MyRSS Reader</h1>
        {user && (
          <div className="user-info">
            <img src={user.picture} alt={user.name} className="avatar" />
            <span>{user.name}</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        )}
      </header>

      <div className="main-content">
        <div className={`feed-panel-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
          <FeedPanel
            onSelectFeed={(feedId) => {
              setSelectedFeedId(feedId);
              setMobileMenuOpen(false);
            }}
            refreshTrigger={refreshKey}
          />
        </div>
        {selectedFeedId && (
          <ItemList feedId={selectedFeedId} refreshKey={refreshKey} />
        )}
      </div>
    </div>
  );
}
