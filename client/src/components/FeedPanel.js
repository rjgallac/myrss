import React, { useState, useEffect } from 'react';
import { feedAPI } from '../services/api';
import './FeedPanel.css';

export default function FeedPanel({ onSelectFeed, refreshTrigger }) {
  const [feeds, setFeeds] = useState([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedTitle, setNewFeedTitle] = useState('');
  const [selectedFeedId, setSelectedFeedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFeeds();
  }, [refreshTrigger]);

  const loadFeeds = async () => {
    try {
      const response = await feedAPI.getFeeds();
      setFeeds(response.data);
      if (response.data.length > 0 && !selectedFeedId) {
        handleSelectFeed(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading feeds:', error);
    }
  };

  const handleAddFeed = async (e) => {
    e.preventDefault();
    if (!newFeedUrl) return;

    try {
      setLoading(true);
      await feedAPI.addFeed(newFeedUrl, newFeedTitle || 'Untitled Feed');
      setNewFeedUrl('');
      setNewFeedTitle('');
      await loadFeeds();
    } catch (error) {
      console.error('Error adding feed:', error);
      alert('Failed to add feed. Make sure the URL is valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFeed = async (feedId) => {
    if (!window.confirm('Remove this feed?')) return;

    try {
      await feedAPI.removeFeed(feedId);
      if (selectedFeedId === feedId) {
        setSelectedFeedId(null);
      }
      await loadFeeds();
    } catch (error) {
      console.error('Error removing feed:', error);
    }
  };

  const handleSelectFeed = (feedId) => {
    setSelectedFeedId(feedId);
    onSelectFeed(feedId);
  };

  return (
    <div className="feed-panel">
      <h2>Feeds</h2>

      <form onSubmit={handleAddFeed} className="add-feed-form">
        <input
          type="url"
          placeholder="Feed URL (e.g., https://news.ycombinator.com/rss)"
          value={newFeedUrl}
          onChange={(e) => setNewFeedUrl(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Feed title (optional)"
          value={newFeedTitle}
          onChange={(e) => setNewFeedTitle(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Feed'}
        </button>
      </form>

      <div className="feed-list">
        {feeds.length === 0 ? (
          <p className="no-feeds">No feeds yet. Add one above!</p>
        ) : (
          feeds.map((feed) => (
            <div
              key={feed.id}
              className={`feed-item ${selectedFeedId === feed.id ? 'active' : ''}`}
              onClick={() => handleSelectFeed(feed.id)}
            >
              <div className="feed-info">
                <h4>{feed.title || 'Untitled Feed'}</h4>
                <p className="feed-url">{feed.feed_url}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFeed(feed.id);
                }}
                className="btn-remove"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
