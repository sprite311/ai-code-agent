import { DIContainer } from './DIContainer';
import { IIdeaRepository } from '../../domain/idea/IIdeaRepository';
import { InMemoryIdeaRepository } from '../persistence/InMemoryIdeaRepository';
import { MongoDBIdeaRepository } from '../persistence/mongodb/MongoDBIdeaRepository';
import { MongoDBConnectionManager } from '../persistence/mongodb/MongoDBConnectionManager';
import { ICrawlerTargetRepository } from '../../domain/crawler/ICrawlerTargetRepository';
import { InMemoryCrawlerTargetRepository } from '../persistence/InMemoryCrawlerTargetRepository';
import { MongoDBCrawlerTargetRepository } from '../persistence/mongodb/MongoDBCrawlerTargetRepository';
import { ICrawlerService } from '../../domain/crawler/ICrawlerService';
import { PuppeteerCrawlerService } from '../crawler/PuppeteerCrawlerService';
import { ILLMService } from '../../domain/services/ILLMService';
import { OpenAIService } from '../llm/OpenAIService';
import { IDomainEventDispatcher } from '../../domain/events/IDomainEventDispatcher';
import { InMemoryEventDispatcher } from '../messaging/InMemoryEventDispatcher';
import { IdeaGenerationService } from '../../application/idea/IdeaGenerationService';
import { CrawlerSchedulerService } from '../../application/crawler/CrawlerSchedulerService';
import { ElasticsearchService } from '../search/ElasticsearchService';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { LLMIdeaCategorizationService } from '../../domain/services/LLMIdeaCategorizationService';

/**
 * 依赖注入容器
 */
export class Container {
  private static instance: Container;
  private container: DIContainer;
  private initialized: boolean = false;

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {
    this.container = new DIContainer();
  }

  /**
   * 获取单例实例
   * 
   * @returns 容器实例
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  /**
   * 初始化容器
   * 
   * @param useMongoDb - 是否使用MongoDB
   * @param useElasticsearch - 是否使用Elasticsearch
   */
  async initialize(useMongoDb: boolean = false, useElasticsearch: boolean = false): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 注册事件分发器
    this.container.register<IDomainEventDispatcher>('eventDispatcher', () => {
      return new InMemoryEventDispatcher();
    });

    // 注册LLM服务
    this.container.register<ILLMService>('llmService', () => {
      const apiKey = process.env.OPENAI_API_KEY || '';
      return new OpenAIService(apiKey);
    });

    // 注册创意分类服务
    this.container.register('ideaCategorizationService', () => {
      const llmService = this.container.resolve<ILLMService>('llmService');
      return new LLMIdeaCategorizationService(llmService);
    });

    // 根据配置注册仓储
    if (useMongoDb) {
      await this.registerMongoDbRepositories();
    } else {
      this.registerInMemoryRepositories();
    }

    // 注册爬虫服务
    this.container.register<ICrawlerService>('crawlerService', () => {
      return new PuppeteerCrawlerService();
    });

    // 注册创意生成服务
    this.container.register('ideaGenerationService', () => {
      const ideaRepository = this.container.resolve<IIdeaRepository>('ideaRepository');
      const llmService = this.container.resolve<ILLMService>('llmService');
      const eventDispatcher = this.container.resolve<IDomainEventDispatcher>('eventDispatcher');
      return new IdeaGenerationService(ideaRepository, llmService, eventDispatcher);
    });

    // 注册爬虫调度服务
    this.container.register('crawlerSchedulerService', () => {
      const crawlerService = this.container.resolve<ICrawlerService>('crawlerService');
      const targetRepository = this.container.resolve<ICrawlerTargetRepository>('crawlerTargetRepository');
      const ideaRepository = this.container.resolve<IIdeaRepository>('ideaRepository');
      const llmService = this.container.resolve<ILLMService>('llmService');
      const eventDispatcher = this.container.resolve<IDomainEventDispatcher>('eventDispatcher');
      return new CrawlerSchedulerService(
        crawlerService,
        targetRepository,
        ideaRepository,
        llmService,
        eventDispatcher
      );
    });

    // 如果启用Elasticsearch，注册搜索服务
    if (useElasticsearch) {
      await this.registerElasticsearchService();
    }

    this.initialized = true;
  }

  /**
   * 注册内存仓储
   */
  private registerInMemoryRepositories(): void {
    // 注册创意仓储
    this.container.register<IIdeaRepository>('ideaRepository', () => {
      return new InMemoryIdeaRepository();
    });

    // 注册爬虫目标仓储
    this.container.register<ICrawlerTargetRepository>('crawlerTargetRepository', () => {
      return new InMemoryCrawlerTargetRepository();
    });
  }

  /**
   * 注册MongoDB仓储
   */
  private async registerMongoDbRepositories(): Promise<void> {
    const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017';
    const dbName = process.env.MONGODB_DB_NAME || 'creative_ideas';

    // 获取MongoDB连接
    const connectionManager = MongoDBConnectionManager.getInstance();
    const db = await connectionManager.connect(connectionString, dbName);

    // 注册创意仓储
    this.container.register<IIdeaRepository>('ideaRepository', () => {
      return new MongoDBIdeaRepository(db);
    });

    // 注册爬虫目标仓储
    this.container.register<ICrawlerTargetRepository>('crawlerTargetRepository', () => {
      return new MongoDBCrawlerTargetRepository(db);
    });
  }

  /**
   * 注册Elasticsearch服务
   */
  private async registerElasticsearchService(): Promise<void> {
    const connectionString = process.env.ELASTICSEARCH_URI || 'http://localhost:9200';

    try {
      const client = new ElasticsearchClient({
        node: connectionString
      });

      // 测试连接
      await client.ping();
      console.log('Connected to Elasticsearch');

      // 注册Elasticsearch服务
      this.container.register('elasticsearchService', () => {
        return new ElasticsearchService(client);
      });

      // 初始化索引
      const service = this.container.resolve<ElasticsearchService>('elasticsearchService');
      await service.initIndex();
    } catch (error) {
      console.error('Failed to connect to Elasticsearch:', error);
      console.warn('Elasticsearch service will not be available');
    }
  }

  /**
   * 解析服务
   * 
   * @param key - 服务键
   * @returns 服务实例
   */
  resolve<T>(key: string): T {
    if (!this.initialized) {
      throw new Error('Container not initialized. Call initialize() first.');
    }
    return this.container.resolve<T>(key);
  }
}

/**
 * 依赖注入容器类
 */
export class DIContainer {
  private services = new Map<string, () => any>();

  /**
   * 注册服务
   * 
   * @param key - 服务键
   * @param factory - 服务工厂函数
   */
  register<T>(key: string, factory: () => T): void {
    this.services.set(key, factory);
  }

  /**
   * 解析服务
   * 
   * @param key - 服务键
   * @returns 服务实例
   */
  resolve<T>(key: string): T {
    const factory = this.services.get(key);
    if (!factory) {
      throw new Error(`Service not found: ${key}`);
    }
    return factory() as T;
  }
}

