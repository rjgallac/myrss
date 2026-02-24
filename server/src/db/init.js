const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initializeDB() {
  try {
    // Creates tables if they don't exist
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        picture VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS feeds (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feed_url VARCHAR(500) NOT NULL,
        title VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, feed_url)
      );

      CREATE TABLE IF NOT EXISTS items (
        id SERIAL PRIMARY KEY,
        feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
        guid VARCHAR(500),
        title VARCHAR(500),
        description TEXT,
        content TEXT,
        link VARCHAR(500),
        pub_date TIMESTAMP,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS item_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        is_read BOOLEAN DEFAULT FALSE,
        is_saved BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id)
      );

      CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON feeds(user_id);
      CREATE INDEX IF NOT EXISTS idx_items_feed_id ON items(feed_id);
      CREATE INDEX IF NOT EXISTS idx_item_status_user ON item_status(user_id);
      CREATE INDEX IF NOT EXISTS idx_item_status_item ON item_status(item_id);
    `;

    await pool.query(schema);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDB
};
