import { ICrawlerService } from '../../domain/crawler/ICrawlerService';
import { ICrawlerTargetRepository } from '../../domain/crawler/ICrawlerTargetRepository';
import { IIdeaRepository } from '../../domain/idea/IIdeaRepository';
import { Idea } from '../../domain/idea/Idea';
import { IdeaContent } from '../../domain/idea/IdeaContent';
import { IdeaSource } from '../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../domain/idea/IdeaSourceType';
import { IDomainEventDispatcher } from '../../domain/events/IDomainEventDispatcher';
import { IdeaCreatedEvent } from '../../domain/events/idea/IdeaCreatedEvent';
import { CrawlerResult, CrawledItem } from '../../domain/crawler/CrawlerResult';
import { ILLMService } from '../../domain/services/ILLMService';

/**
 * 爬虫调度服务
 * 
 * 负责调度爬虫任务和处理爬取结果
 */
export class CrawlerSchedulerService {
  private isRunning: boolean = false;
  private scheduledTask: NodeJS.Timeout | null = null;

  /**
   * 创建爬虫调度服务
   * 
   * @param crawlerService - 爬虫服务
   * @param targetRepository - 爬虫目标仓储
   * @param ideaRepository - 创意仓储
   * @param llmService - LLM服务
   * @param eventDispatcher - 事件分发器
   */
  constructor(
    private readonly crawlerService: ICrawlerService,
    private readonly targetRepository: ICrawlerTargetRepository,
    private readonly ideaRepository: IIdeaRepository,
    private readonly llmService: ILLMService,
    private readonly eventDispatcher: IDomainEventDispatcher
  ) {}

  /**
   * 启动定时爬取
   * 
   * @param intervalMinutes - 爬取间隔（分钟）
   * @param targetsPerRun - 每次运行爬取的目标数量
   */
  startScheduledCrawling(intervalMinutes: number = 60, targetsPerRun: number = 5): void {
    if (this.scheduledTask) {
      clearInterval(this.scheduledTask);
    }

    // 立即执行一次
    this.runScheduledCrawling(targetsPerRun);

    // 设置定时任务
    this.scheduledTask = setInterval(() => {
      this.runScheduledCrawling(targetsPerRun);
    }, intervalMinutes * 60 * 1000);

    console.log(`Scheduled crawler started with interval of ${intervalMinutes} minutes`);
  }

  /**
   * 停止定时爬取
   */
  stopScheduledCrawling(): void {
    if (this.scheduledTask) {
      clearInterval(this.scheduledTask);
      this.scheduledTask = null;
      console.log('Scheduled crawler stopped');
    }
  }

  /**
   * 运行定时爬取
   * 
   * @param targetsPerRun - 每次运行爬取的目标数量
   */
  private async runScheduledCrawling(targetsPerRun: number): Promise<void> {
    if (this.isRunning) {
      console.log('Crawler is already running, skipping this run');
      return;
    }

    try {
      this.isRunning = true;
      console.log(`Starting scheduled crawling run for ${targetsPerRun} targets`);

      // 获取需要爬取的目标
      const targets = await this.targetRepository.findTargetsForCrawling(targetsPerRun);

      if (targets.length === 0) {
        console.log('No targets need crawling at this time');
        this.isRunning = false;
        return;
      }

      console.log(`Found ${targets.length} targets to crawl`);

      // 爬取目标
      const results = await this.crawlerService.crawlTargets(targets);

      // 处理爬取结果
      for (const result of results) {
        await this.processResult(result);

        // 更新目标的最后爬取时间
        await this.targetRepository.updateLastCrawled(result.targetId, new Date());
      }

      console.log(`Completed scheduled crawling run, processed ${results.length} targets`);
    } catch (error) {
      console.error('Error during scheduled crawling:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 处理爬取结果
   * 
   * @param result - 爬取结果
   */
  private async processResult(result: CrawlerResult): Promise<void> {
    if (result.isFailed() || result.items.length === 0) {
      console.log(`Skipping failed or empty result for target ${result.targetId}`);
      return;
    }

    console.log(`Processing ${result.items.length} items from target ${result.targetId}`);

    for (const item of result.items) {
      await this.processItem(item);
    }
  }

  /**
   * 处理爬取的项目
   * 
   * @param item - 爬取的项目
   */
  private async processItem(item: CrawledItem): Promise<void> {
    try {
      // 创建创意内容
      const ideaContent = new IdeaContent(item.content);
      
      // 创建创意来源
      const ideaSource = new IdeaSource(
        item.sourceType,
        item.url,
        item.sourceName
      );
      
      // 创建创意
      const idea = Idea.create(
        item.title,
        ideaContent,
        ideaSource
      );
      
      // 如果有标签，添加到创意
      if (item.tags && item.tags.length > 0) {
        for (const tagName of item.tags) {
          idea.addTag(tagName);
        }
      } else {
        // 使用LLM生成标签
        await this.generateTagsWithLLM(idea);
      }
      
      // 保存创意
      await this.ideaRepository.save(idea);
      
      // 发布创意创建事件
      await this.eventDispatcher.dispatch(
        new IdeaCreatedEvent(idea.id, idea.title, idea.source.getType())
      );
      
      console.log(`Saved idea: ${idea.title} (ID: ${idea.id.toString()})`);
    } catch (error) {
      console.error('Error processing crawled item:', error);
    }
  }

  /**
   * 使用LLM为创意生成标签
   * 
   * @param idea - 创意
   */
  private async generateTagsWithLLM(idea: Idea): Promise<void> {
    try {
      const prompt = `
        Please suggest 3-5 relevant tags for the following idea.
        
        Title: ${idea.title}
        Content: ${idea.content.toString()}
        
        Return your response as a JSON array of strings, for example:
        ["technology", "innovation", "ai"]
      `;
      
      const response = await this.llmService.generateCompletion(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });
      
      try {
        const tags = JSON.parse(response);
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            if (typeof tag === 'string') {
              idea.addTag(tag);
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing LLM response for tags:', parseError);
      }
    } catch (error) {
      console.error('Error generating tags with LLM:', error);
    }
  }

  /**
   * 手动爬取目标
   * 
   * @param targetId - 爬虫目标ID
   * @returns 爬取结果
   */
  async crawlTargetManually(targetId: string): Promise<CrawlerResult> {
    const target = await this.targetRepository.findById(targetId);
    
    if (!target) {
      throw new Error(`Crawler target not found: ${targetId}`);
    }
    
    const result = await this.crawlerService.crawlTarget(target);
    
    // 处理爬取结果
    await this.processResult(result);
    
    // 更新目标的最后爬取时间
    await this.targetRepository.updateLastCrawled(targetId, new Date());
    
    return result;
  }

  /**
   * 爬取URL
   * 
   * @param url - 要爬取的URL
   * @param selectors - CSS选择器配置
   * @returns 爬取结果
   */
  async crawlUrl(url: string, selectors: any): Promise<CrawlerResult> {
    const result = await this.crawlerService.crawlUrl(url, selectors);
    
    // 处理爬取结果
    await this.processResult(result);
    
    return result;
  }
}

