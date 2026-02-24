import React, { useState, useEffect } from 'react';
import { itemAPI } from '../services/api';
import './ItemList.css';

export default function ItemList({ feedId, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

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

  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleMarkAsRead = async () => {
    try {
      await itemAPI.markAsRead(Array.from(selectedItems));
      setSelectedItems(new Set());
      loadItems();
    } catch (error) {
      console.error('Error marking items as read:', error);
    }
  };

  const handleToggleSaved = async (itemId) => {
    try {
      await itemAPI.toggleSaved(itemId);
      loadItems();
    } catch (error) {
      console.error('Error toggling saved status:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const allItemIds = items.map(item => item.id);
      await itemAPI.markAsRead(allItemIds);
      setSelectedItems(new Set());
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

        <button onClick={handleMarkAllAsRead} className="btn-primary">
          Mark all as read
        </button>

        {selectedItems.size > 0 && (
          <button onClick={handleMarkAsRead} className="btn-primary">
            Mark {selectedItems.size} as read
          </button>
        )}
      </div>

      <div className="items">
        {items.length === 0 ? (
          <p>No items found</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`item ${item.is_read ? 'read' : 'unread'}`}>
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => handleSelectItem(item.id)}
                className="item-checkbox"
              />
              <div className="item-content">
                <h3>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h3>
                <p className="item-meta">
                  {new Date(item.pub_date).toLocaleDateString()}
                </p>
                <p className="item-description">{(stripHtml(item.description) || '').substring(0, 200)}...</p>
              </div>
              <button
                onClick={() => handleToggleSaved(item.id)}
                className={`btn-save ${item.is_saved ? 'saved' : ''}`}
              >
                {item.is_saved ? '★' : '☆'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button onClick={() => setSkip(Math.max(0, skip - 10))}>Previous</button>
        <button onClick={() => setSkip(skip + 10)}>Next</button>
      </div>
    </div>
  );
}
