const feedFetcher = require('./feedFetcher');
const cron = require('node-cron');

// --- Mocking Dependencies ---
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
}));

jest.mock('../services/feedParser', () => ({
  fetchAndParse: jest.fn(),
}));

jest.mock('../services/itemStore', () => {
  const actualStore = jest.requireActual('../services/itemStore');
  return {
    ...actualStore,
    saveFeedItem: jest.fn(),
    getAllFeeds: jest.fn(),
  };
});

// --- Tests ---

describe('fetchAndSaveFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and save items successfully', async () => {
    // Arrange
    const mockFeedId = '123';
    const mockUrl = 'https://example.com/rss';
    const mockItems = [{ id: 1, title: 'Test' }, { id: 2, title: 'Test 2' }];
    
    // Mock returning items
    require('../services/feedParser').fetchAndParse.mockResolvedValue(mockItems);
    // Mock save returning true (item was new)
    require('../services/itemStore').saveFeedItem.mockResolvedValue(true);

    // Act
    const result = await feedFetcher.fetchAndSaveFeed(mockFeedId, mockUrl);

    // Assert
    expect(result).toEqual({ success: true, itemCount: 2, savedCount: 2 });
    
    // Check fetch was called with correct URL
    expect(require('../services/feedParser').fetchAndParse).toHaveBeenCalledWith(mockUrl);
    
    // Check save was called for each item
    expect(require('../services/itemStore').saveFeedItem).toHaveBeenCalledTimes(2);
    expect(require('../services/itemStore').saveFeedItem).toHaveBeenNthCalledWith(1, mockFeedId, mockItems[0]);
    expect(require('../services/itemStore').saveFeedItem).toHaveBeenNthCalledWith(2, mockFeedId, mockItems[1]);
  });

  it('should count items that failed to save', async () => {
    // Arrange
    const mockItems = [{ id: 1 }, { id: 2 }, { id: 3 }];
    
    require('../services/feedParser').fetchAndParse.mockResolvedValue(mockItems);
    // First two saves succeed, third fails
    require('../services/itemStore').saveFeedItem
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValue(false);

    // Act
    const result = await feedFetcher.fetchAndSaveFeed('123', 'url');

    // Assert
    expect(result).toEqual({ success: true, itemCount: 3, savedCount: 2 });
    expect(require('../services/itemStore').saveFeedItem).toHaveBeenCalledTimes(3);
  });

  it('should return error on parse failure', async () => {
    // Arrange
    const errorMessage = 'Network Error';
    require('../services/feedParser').fetchAndParse.mockRejectedValue(new Error(errorMessage));

    // Act
    const result = await feedFetcher.fetchAndSaveFeed('123', 'url');

    // Assert
    expect(result).toEqual({ success: false, error: errorMessage });
    expect(require('../services/itemStore').saveFeedItem).not.toHaveBeenCalled();
  });
});
