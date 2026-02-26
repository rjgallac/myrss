const cron = require('node-cron');

// service modules
const { fetchAndParse } = require('../services/feedParser');
const { saveFeedItem, getAllFeeds } = require('../services/itemStore');


async function fetchAndSaveFeed(feedId, feedUrl) {
  try {
    console.log(`⏳ Fetching feed ${feedId}: ${feedUrl}`);
    const items = await fetchAndParse(feedUrl);
    console.log(`  Found ${items.length} items`);

    let savedCount = 0;
    for (const item of items) {
      if (await saveFeedItem(feedId, item)) savedCount++;
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
    const feeds = await getAllFeeds();
    console.log(`\n📡 Starting feed fetch for ${feeds.length} feeds...`);
    
    for (const feed of feeds) {
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
