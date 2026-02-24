const cron = require('node-cron');
const fetch = require('node-fetch');
const { XMLParser } = require('fast-xml-parser');
const { pool } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

async function fetchAndSaveFeed(feedId, feedUrl) {
  try {
    console.log(`⏳ Fetching feed ${feedId}: ${feedUrl}`);
    const response = await fetch(feedUrl, { timeout: 10000 });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text'
    });
    const parsed = parser.parse(xml);

    // helpers to handle various feed formats
    const getText = (node) => {
      if (node === undefined || node === null) return '';
      if (Array.isArray(node)) node = node[0];
      if (typeof node === 'string') return node;
      if (typeof node === 'object') {
        if (node['#text'] !== undefined) return node['#text'];
        // fallback: return first primitive value
        for (const k of Object.keys(node)) {
          const v = node[k];
          if (typeof v === 'string') return v;
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
        }
        return '';
      }
      return String(node);
    };

    const getLink = (linkNode) => {
      if (!linkNode) return '';
      if (Array.isArray(linkNode)) {
        // prefer element with href attribute (Atom)
        for (const l of linkNode) {
          if (l && typeof l === 'object' && l['@_href']) return l['@_href'];
          if (typeof l === 'string') return l;
        }
        // fallback to first
        const first = linkNode[0];
        if (typeof first === 'string') return first;
        if (first && first['@_href']) return first['@_href'];
        return '';
      }
      if (typeof linkNode === 'string') return linkNode;
      if (linkNode['@_href']) return linkNode['@_href'];
      return '';
    };

    // Handle both RSS and Atom feeds (support channel as object or array)
    let items = [];
    if (parsed.rss) {
      let channel = parsed.rss.channel;
      if (Array.isArray(channel)) channel = channel[0];
      if (channel && channel.item) items = channel.item;
    } else if (parsed.feed) {
      items = parsed.feed.entry;
    }

    if (!Array.isArray(items)) items = items ? [items] : [];

    console.log(`  Found ${items.length} items`);

    let savedCount = 0;
    for (const item of items) {
      const guid = getText(item.guid) || getText(item.id) || getLink(item.link) || uuidv4();
      const title = getText(item.title) || 'No title';
      const description = getText(item.description) || getText(item.summary) || '';
      const link = getLink(item.link) || getText(item.link) || '';
      const pubDate = getText(item.pubDate) || getText(item.published) || null;

      // Check if item already exists
      const existing = await pool.query(
        'SELECT id FROM items WHERE feed_id = $1 AND guid = $2',
        [feedId, guid]
      );

      if (existing.rows.length === 0) {
        const itemResult = await pool.query(
          `INSERT INTO items (feed_id, guid, title, description, link, pub_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [feedId, guid, title, description, link, pubDate]
        );

        const itemId = itemResult.rows[0].id;

        // Create initial item_status for all users following this feed
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
        savedCount++;
      }
    }

    console.log(`✓ Feed ${feedId}: saved ${savedCount} new items`);
    return { success: true, itemCount: items.length, savedCount };
  } catch (error) {
    console.error(`✗ Error fetching feed ${feedId}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function fetchAllFeeds() {
  try {
    const feeds = await pool.query('SELECT id, feed_url FROM feeds');
    console.log(`\n📡 Starting feed fetch for ${feeds.rows.length} feeds...`);
    
    for (const feed of feeds.rows) {
      await fetchAndSaveFeed(feed.id, feed.feed_url);
    }
    
    console.log('✅ Feed fetch complete\n');
  } catch (error) {
    console.error('Feed fetcher error:', error);
  }
}

function startFeedFetcher() {
  // Run every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    await fetchAllFeeds();
  });

  console.log('🚀 Feed fetcher started (runs every 30 minutes)');
  
  // Fetch immediately on startup
  setTimeout(() => {
    fetchAllFeeds();
  }, 2000);
}

module.exports = { startFeedFetcher, fetchAndSaveFeed, fetchAllFeeds };
