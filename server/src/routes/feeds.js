const express = require('express');
const { pool } = require('../db/init');
const { authenticate } = require('../middleware/auth');
const { fetchAndSaveFeed } = require('../jobs/feedFetcher');

const router = express.Router();

// Get all user's feeds
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM feeds WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new feed
router.post('/', authenticate, async (req, res) => {
  const { feed_url, title } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO feeds (user_id, feed_url, title) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, feed_url, title]
    );
    
    const feed = result.rows[0];
    
    // Fetch feed immediately in background
    setTimeout(() => {
      fetchAndSaveFeed(feed.id, feed_url).catch(err => {
        console.error('Background fetch error:', err);
      });
    }, 100);
    
    res.status(201).json(feed);
  } catch (error) {
    if (error.message.includes('duplicate')) {
      res.status(400).json({ error: 'Feed already added' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Manual trigger to fetch all feeds (must be before /:id route)
router.post('/manual-fetch', authenticate, async (req, res) => {
  try {
    const feeds = await pool.query(
      'SELECT id, feed_url FROM feeds WHERE user_id = $1',
      [req.user.id]
    );
    
    const results = [];
    for (const feed of feeds.rows) {
      const result = await fetchAndSaveFeed(feed.id, feed.feed_url);
      results.push(result);
    }
    
    res.json({ 
      message: `Fetched ${feeds.rows.length} feeds`,
      results 
    });
  } catch (error) {
    console.error('Manual fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove a feed
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM feeds WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Feed deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
