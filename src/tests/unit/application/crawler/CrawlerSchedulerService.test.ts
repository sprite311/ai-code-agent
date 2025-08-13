import { CrawlerSchedulerService } from '../../../../application/crawler/CrawlerSchedulerService';
import { ICrawlerService } from '../../../../domain/crawler/ICrawlerService';
import { ICrawlerTargetRepository } from '../../../../domain/crawler/ICrawlerTargetRepository';
import { IIdeaRepository } from '../../../../domain/idea/IIdeaRepository';
import { ILLMService } from '../../../../domain/services/ILLMService';
import { IDomainEventDispatcher } from '../../../../domain/events/IDomainEventDispatcher';
import { CrawlerTarget, CrawlerTargetType } from '../../../../domain/crawler/CrawlerTarget';
import { CrawlerResult, CrawlerResultStatus, CrawledItem } from '../../../../domain/crawler/CrawlerResult';
import { IdeaSourceType } from '../../../../domain/idea/IdeaSourceType';
import { Idea } from '../../../../domain/idea/Idea';

// 模拟依赖
const mockCrawlerService: jest.Mocked<ICrawlerService> = {
  crawlTarget: jest.fn(),
  crawlTargets: jest.fn(),
  crawlUrl: jest.fn(),
  stopAll: jest.fn()
};

const mockTargetRepository: jest.Mocked<ICrawlerTargetRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findTargetsForCrawling: jest.fn(),
  updateLastCrawled: jest.fn(),
  findByType: jest.fn(),
  findByPriority: jest.fn()
};

const mockIdeaRepository: jest.Mocked<IIdeaRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findByTag: jest.fn(),
  findByCategory: jest.fn(),
  search: jest.fn(),
  findPopular: jest.fn(),
  findRecent: jest.fn()
};

const mockLLMService: jest.Mocked<ILLMService> = {
  generateCompletion: jest.fn(),
  generateCompletionStream: jest.fn()
};

const mockEventDispatcher: jest.Mocked<IDomainEventDispatcher> = {
  dispatch: jest.fn(),
  register: jest.fn()
};

describe('CrawlerSchedulerService', () => {
  let service: CrawlerSchedulerService;
  let originalSetInterval: typeof global.setInterval;
  let originalClearInterval: typeof global.clearInterval;

  beforeAll(() => {
    // 保存原始的定时器函数
    originalSetInterval = global.setInterval;
    originalClearInterval = global.clearInterval;
    
    // 模拟定时器函数
    global.setInterval = jest.fn() as any;
    global.clearInterval = jest.fn() as any;
  });

  afterAll(() => {
    // 恢复原始的定时器函数
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  });

  beforeEach(() => {
    // 重置模拟
    jest.clearAllMocks();
    
    // 创建服务实例
    service = new CrawlerSchedulerService(
      mockCrawlerService,
      mockTargetRepository,
      mockIdeaRepository,
      mockLLMService,
      mockEventDispatcher
    );
  });

  describe('startScheduledCrawling', () => {
    it('should start scheduled crawling with default parameters', () => {
      // 调用方法
      service.startScheduledCrawling();
      
      // 验证定时器设置
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 60 * 60 * 1000);
    });

    it('should start scheduled crawling with custom parameters', () => {
      // 调用方法
      service.startScheduledCrawling(30, 10);
      
      // 验证定时器设置
      expect(global.setInterval).toHaveBeenCalledWith(expect.any(Function), 30 * 60 * 1000);
    });

    it('should clear existing interval if present', () => {
      // 先启动一次
      service.startScheduledCrawling();
      
      // 再启动一次
      service.startScheduledCrawling();
      
      // 验证清除定时器
      expect(global.clearInterval).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopScheduledCrawling', () => {
    it('should stop scheduled crawling', () => {
      // 先启动
      service.startScheduledCrawling();
      
      // 再停止
      service.stopScheduledCrawling();
      
      // 验证清除定时器
      expect(global.clearInterval).toHaveBeenCalledTimes(1);
    });

    it('should do nothing if not running', () => {
      // 直接停止
      service.stopScheduledCrawling();
      
      // 验证没有清除定时器
      expect(global.clearInterval).not.toHaveBeenCalled();
    });
  });

  describe('crawlTargetManually', () => {
    it('should crawl a target manually', async () => {
      // 模拟目标
      const target = new CrawlerTarget(
        'test-id',
        'https://example.com',
        'Example Site',
        CrawlerTargetType.WEBSITE,
        { contentContainer: '.content', title: '.title', content: '.body' }
      );
      
      // 模拟爬取结果
      const result = new CrawlerResult(
        'test-id',
        'https://example.com',
        CrawlerResultStatus.SUCCESS,
        [
          {
            title: 'Test Item',
            content: 'Test content',
            url: 'https://example.com/item',
            sourceType: IdeaSourceType.CRAWLED,
            sourceName: 'Example Site',
            crawledAt: new Date()
          }
        ]
      );
      
      // 设置模拟返回值
      mockTargetRepository.findById.mockResolvedValue(target);
      mockCrawlerService.crawlTarget.mockResolvedValue(result);
      mockIdeaRepository.save.mockImplementation(async (idea) => idea);
      mockLLMService.generateCompletion.mockResolvedValue('["tag1", "tag2"]');
      
      // 调用方法
      const crawlResult = await service.crawlTargetManually('test-id');
      
      // 验证结果
      expect(crawlResult).toBe(result);
      expect(mockTargetRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockCrawlerService.crawlTarget).toHaveBeenCalledWith(target);
      expect(mockIdeaRepository.save).toHaveBeenCalledTimes(1);
      expect(mockTargetRepository.updateLastCrawled).toHaveBeenCalledWith('test-id', expect.any(Date));
    });

    it('should throw error if target not found', async () => {
      // 设置模拟返回值
      mockTargetRepository.findById.mockResolvedValue(null);
      
      // 验证抛出错误
      await expect(service.crawlTargetManually('test-id')).rejects.toThrow('Crawler target not found');
    });
  });

  describe('crawlUrl', () => {
    it('should crawl a URL', async () => {
      // 模拟选择器
      const selectors = { contentContainer: '.content', title: '.title', content: '.body' };
      
      // 模拟爬取结果
      const result = new CrawlerResult(
        'temp-id',
        'https://example.com',
        CrawlerResultStatus.SUCCESS,
        [
          {
            title: 'Test Item',
            content: 'Test content',
            url: 'https://example.com/item',
            sourceType: IdeaSourceType.CRAWLED,
            sourceName: 'Example Site',
            crawledAt: new Date()
          }
        ]
      );
      
      // 设置模拟返回值
      mockCrawlerService.crawlUrl.mockResolvedValue(result);
      mockIdeaRepository.save.mockImplementation(async (idea) => idea);
      mockLLMService.generateCompletion.mockResolvedValue('["tag1", "tag2"]');
      
      // 调用方法
      const crawlResult = await service.crawlUrl('https://example.com', selectors);
      
      // 验证结果
      expect(crawlResult).toBe(result);
      expect(mockCrawlerService.crawlUrl).toHaveBeenCalledWith('https://example.com', selectors);
      expect(mockIdeaRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

