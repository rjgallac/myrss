const { pool } = require('../db/init');
const { v4: uuidv4 } = require('uuid');
const { getText, getLink } = require('./feedParser');

async function saveFeedItem(feedId, item) {
  const guid = getText(item.guid) || getText(item.id) || getLink(item.link) || uuidv4();
  const title = getText(item.title) || 'No title';
  const description = getText(item.description) || getText(item.summary) || '';
  const link = getLink(item.link) || getText(item.link) || '';
  const pubDate = getText(item.pubDate) || getText(item.published) || null;

  const existing = await pool.query(
    'SELECT id FROM items WHERE feed_id = $1 AND guid = $2',
    [feedId, guid]
  );
  if (existing.rows.length > 0) return false;

  const itemResult = await pool.query(
    `INSERT INTO items (feed_id, guid, title, description, link, pub_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [feedId, guid, title, description, link, pubDate]
  );

  const itemId = itemResult.rows[0].id;
  const users = await pool.query(
    `SELECT DISTINCT user_id FROM feeds WHERE id = $1`,
    [feedId]
  );
  for (const user of users.rows) {
    await pool.query(
      `INSERT INTO item_status (user_id, item_id, is_read, is_saved)
       VALUES ($1, $2, false, false)
       ON CONFLICT DO NOTHING`,
      [user.user_id, itemId]
    );
  }
  return true;
}

async function getAllFeeds() {
  const res = await pool.query('SELECT id, feed_url FROM feeds');
  return res.rows;
}

module.exports = { saveFeedItem, getAllFeeds };
