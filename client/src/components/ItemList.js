import React, { useState, useEffect } from 'react';
import { itemAPI } from '../services/api';
import './ItemList.css';

export default function ItemList({ feedId, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(true);

  useEffect(() => {
    loadItems();
  }, [feedId, refreshKey, unreadOnly, skip]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemAPI.getItems({
        feed_id: feedId,
        skip,
        limit: 10,
        only_unread: unreadOnly
      });
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html) => {
    if (!html) return '';
    try {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || '';
    } catch (e) {
      return String(html);
    }
  };





  const handleMarkAllAsRead = async () => {
    try {
      const allItemIds = items.map(item => item.id);
      await itemAPI.markAsRead(allItemIds);
      loadItems();
    } catch (error) {
      console.error('Error marking items as read:', error);
    }
  };

  if (loading) return <div className="loading">Loading items...</div>;

  return (
    <div className="item-list">
      <div className="controls">
        <label>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => {
              setUnreadOnly(e.target.checked);
              setSkip(0);
            }}
          />
          Unread only
        </label>
      </div>

      <div className="items">
        {items.length === 0 ? (
          <p>No items found</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`item ${item.is_read ? 'read' : 'unread'}`}>
              <div className="item-content">
                <h3>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h3>
                <p className="item-description">{(stripHtml(item.description) || '').substring(0, 200)}...</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setSkip(Math.max(0, skip - 10))}>Previous</button>
        <button onClick={() => setSkip(skip + 10)}>Next</button>
        <button onClick={handleMarkAllAsRead} className="btn-mark-all">Mark all as read</button>
      </div>
    </div>
  );
}
