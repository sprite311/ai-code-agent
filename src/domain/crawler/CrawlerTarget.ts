/**
 * 爬虫目标类型
 */
export enum CrawlerTargetType {
  WEBSITE = 'website',
  BLOG = 'blog',
  FORUM = 'forum',
  SOCIAL_MEDIA = 'social_media',
  NEWS = 'news'
}

/**
 * 爬虫目标
 * 
 * 表示一个要爬取的目标网站
 */
export class CrawlerTarget {
  /**
   * 创建爬虫目标
   * 
   * @param id - 目标ID
   * @param url - 目标URL
   * @param name - 目标名称
   * @param type - 目标类型
   * @param selectors - CSS选择器配置
   * @param priority - 优先级（1-10，10为最高）
   * @param crawlFrequency - 爬取频率（小时）
   * @param lastCrawled - 上次爬取时间
   */
  constructor(
    readonly id: string,
    readonly url: string,
    readonly name: string,
    readonly type: CrawlerTargetType,
    readonly selectors: CrawlerSelectors,
    readonly priority: number = 5,
    readonly crawlFrequency: number = 24,
    readonly lastCrawled: Date | null = null
  ) {
    this.validateUrl(url);
    this.validatePriority(priority);
    this.validateCrawlFrequency(crawlFrequency);
  }

  /**
   * 检查目标是否需要爬取
   * 
   * @returns 是否需要爬取
   */
  needsCrawling(): boolean {
    if (!this.lastCrawled) {
      return true;
    }

    const now = new Date();
    const hoursSinceLastCrawl = (now.getTime() - this.lastCrawled.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastCrawl >= this.crawlFrequency;
  }

  /**
   * 获取爬取延迟（毫秒）
   * 
   * 基于优先级计算爬取延迟，优先级越高延迟越低
   * 
   * @returns 爬取延迟（毫秒）
   */
  getCrawlDelay(): number {
    // 基础延迟1000毫秒，优先级越高延迟越低
    return Math.max(100, 1000 - (this.priority * 100));
  }

  /**
   * 验证URL
   * 
   * @param url - 要验证的URL
   */
  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  /**
   * 验证优先级
   * 
   * @param priority - 要验证的优先级
   */
  private validatePriority(priority: number): void {
    if (priority < 1 || priority > 10) {
      throw new Error('Priority must be between 1 and 10');
    }
  }

  /**
   * 验证爬取频率
   * 
   * @param frequency - 要验证的爬取频率
   */
  private validateCrawlFrequency(frequency: number): void {
    if (frequency < 1) {
      throw new Error('Crawl frequency must be at least 1 hour');
    }
  }
}

/**
 * 爬虫选择器配置
 */
export interface CrawlerSelectors {
  /**
   * 内容容器选择器
   */
  contentContainer: string;
  
  /**
   * 标题选择器
   */
  title: string;
  
  /**
   * 内容选择器
   */
  content: string;
  
  /**
   * 日期选择器（可选）
   */
  date?: string;
  
  /**
   * 作者选择器（可选）
   */
  author?: string;
  
  /**
   * 标签选择器（可选）
   */
  tags?: string;
  
  /**
   * 分页选择器（可选）
   */
  pagination?: string;
  
  /**
   * 下一页选择器（可选）
   */
  nextPage?: string;
}

