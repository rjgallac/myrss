const express = require('express');
const { pool } = require('../db/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get items from user's feeds (paginated)
router.get('/', authenticate, async (req, res) => {
  const { feed_id, skip = 0, limit = 10, only_unread = false, only_saved = false } = req.query;
  try {
    let query = `
      SELECT i.*, ist.is_read, ist.is_saved
      FROM items i
      JOIN feeds f ON i.feed_id = f.id
      JOIN item_status ist ON i.id = ist.item_id
      WHERE f.user_id = $1
    `;
    const params = [req.user.id];

    if (feed_id) {
      query += ` AND f.id = $${params.length + 1}`;
      params.push(feed_id);
    }

    if (only_unread === 'true') {
      query += ` AND ist.is_read = false`;
    }

    if (only_saved === 'true') {
      query += ` AND ist.is_saved = true`;
    }

    query += ` ORDER BY i.pub_date DESC
      OFFSET $${params.length + 1} LIMIT $${params.length + 2}`;
    params.push(skip, limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark items as read
router.post('/mark-read', authenticate, async (req, res) => {
  const { item_ids } = req.body;
  try {
    for (const item_id of item_ids) {
      await pool.query(
        `INSERT INTO item_status (user_id, item_id, is_read, is_saved)
         VALUES ($1, $2, true, false)
         ON CONFLICT (user_id, item_id) DO UPDATE SET is_read = true`,
        [req.user.id, item_id]
      );
    }
    res.json({ message: 'Items marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle saved status
router.post('/toggle-saved', authenticate, async (req, res) => {
  const { item_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO item_status (user_id, item_id, is_saved, is_read)
       VALUES ($1, $2, true, false)
       ON CONFLICT (user_id, item_id) DO UPDATE SET is_saved = NOT item_status.is_saved
       RETURNING *`,
      [req.user.id, item_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
