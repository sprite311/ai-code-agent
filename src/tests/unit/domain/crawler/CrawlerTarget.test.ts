import { CrawlerTarget, CrawlerTargetType } from '../../../../domain/crawler/CrawlerTarget';

describe('CrawlerTarget', () => {
  const mockSelectors = {
    contentContainer: '.content',
    title: '.title',
    content: '.body'
  };

  describe('constructor', () => {
    it('should create a valid crawler target', () => {
      const target = new CrawlerTarget(
        'test-id',
        'https://example.com',
        'Example Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors
      );

      expect(target.id).toBe('test-id');
      expect(target.url).toBe('https://example.com');
      expect(target.name).toBe('Example Site');
      expect(target.type).toBe(CrawlerTargetType.WEBSITE);
      expect(target.selectors).toEqual(mockSelectors);
      expect(target.priority).toBe(5); // Default priority
      expect(target.crawlFrequency).toBe(24); // Default frequency
      expect(target.lastCrawled).toBeNull();
    });

    it('should throw error for invalid URL', () => {
      expect(() => {
        new CrawlerTarget(
          'test-id',
          'invalid-url',
          'Example Site',
          CrawlerTargetType.WEBSITE,
          mockSelectors
        );
      }).toThrow('Invalid URL');
    });

    it('should throw error for invalid priority', () => {
      expect(() => {
        new CrawlerTarget(
          'test-id',
          'https://example.com',
          'Example Site',
          CrawlerTargetType.WEBSITE,
          mockSelectors,
          0 // Invalid priority (< 1)
        );
      }).toThrow('Priority must be between 1 and 10');

      expect(() => {
        new CrawlerTarget(
          'test-id',
          'https://example.com',
          'Example Site',
          CrawlerTargetType.WEBSITE,
          mockSelectors,
          11 // Invalid priority (> 10)
        );
      }).toThrow('Priority must be between 1 and 10');
    });

    it('should throw error for invalid crawl frequency', () => {
      expect(() => {
        new CrawlerTarget(
          'test-id',
          'https://example.com',
          'Example Site',
          CrawlerTargetType.WEBSITE,
          mockSelectors,
          5,
          0 // Invalid frequency (< 1)
        );
      }).toThrow('Crawl frequency must be at least 1 hour');
    });
  });

  describe('needsCrawling', () => {
    it('should return true if never crawled', () => {
      const target = new CrawlerTarget(
        'test-id',
        'https://example.com',
        'Example Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors
      );

      expect(target.needsCrawling()).toBe(true);
    });

    it('should return true if crawl frequency elapsed', () => {
      const lastCrawled = new Date();
      lastCrawled.setHours(lastCrawled.getHours() - 25); // 25 hours ago

      const target = new CrawlerTarget(
        'test-id',
        'https://example.com',
        'Example Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors,
        5,
        24, // 24 hour frequency
        lastCrawled
      );

      expect(target.needsCrawling()).toBe(true);
    });

    it('should return false if crawl frequency not elapsed', () => {
      const lastCrawled = new Date();
      lastCrawled.setHours(lastCrawled.getHours() - 12); // 12 hours ago

      const target = new CrawlerTarget(
        'test-id',
        'https://example.com',
        'Example Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors,
        5,
        24, // 24 hour frequency
        lastCrawled
      );

      expect(target.needsCrawling()).toBe(false);
    });
  });

  describe('getCrawlDelay', () => {
    it('should return lower delay for higher priority', () => {
      const highPriorityTarget = new CrawlerTarget(
        'test-id-1',
        'https://example.com',
        'High Priority Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors,
        10 // Highest priority
      );

      const lowPriorityTarget = new CrawlerTarget(
        'test-id-2',
        'https://example.com',
        'Low Priority Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors,
        1 // Lowest priority
      );

      const highPriorityDelay = highPriorityTarget.getCrawlDelay();
      const lowPriorityDelay = lowPriorityTarget.getCrawlDelay();

      expect(highPriorityDelay).toBeLessThan(lowPriorityDelay);
    });

    it('should never return delay less than 100ms', () => {
      const target = new CrawlerTarget(
        'test-id',
        'https://example.com',
        'Example Site',
        CrawlerTargetType.WEBSITE,
        mockSelectors,
        10 // Highest priority
      );

      expect(target.getCrawlDelay()).toBeGreaterThanOrEqual(100);
    });
  });
});

