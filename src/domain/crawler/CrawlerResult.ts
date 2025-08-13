import { IdeaSourceType } from '../idea/IdeaSourceType';

/**
 * 爬虫结果状态
 */
export enum CrawlerResultStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed'
}

/**
 * 爬虫结果
 * 
 * 表示一次爬取操作的结果
 */
export class CrawlerResult {
  /**
   * 创建爬虫结果
   * 
   * @param targetId - 爬取目标ID
   * @param url - 爬取的URL
   * @param status - 爬取状态
   * @param items - 爬取的项目
   * @param error - 错误信息（如果有）
   * @param timestamp - 爬取时间戳
   */
  constructor(
    readonly targetId: string,
    readonly url: string,
    readonly status: CrawlerResultStatus,
    readonly items: CrawledItem[],
    readonly error: string | null = null,
    readonly timestamp: Date = new Date()
  ) {}

  /**
   * 获取成功爬取的项目数量
   * 
   * @returns 成功爬取的项目数量
   */
  getSuccessCount(): number {
    return this.items.length;
  }

  /**
   * 是否成功爬取
   * 
   * @returns 是否成功爬取
   */
  isSuccess(): boolean {
    return this.status === CrawlerResultStatus.SUCCESS;
  }

  /**
   * 是否部分成功
   * 
   * @returns 是否部分成功
   */
  isPartial(): boolean {
    return this.status === CrawlerResultStatus.PARTIAL;
  }

  /**
   * 是否失败
   * 
   * @returns 是否失败
   */
  isFailed(): boolean {
    return this.status === CrawlerResultStatus.FAILED;
  }
}

/**
 * 爬取的项目
 */
export interface CrawledItem {
  /**
   * 项目标题
   */
  title: string;
  
  /**
   * 项目内容
   */
  content: string;
  
  /**
   * 项目URL
   */
  url: string;
  
  /**
   * 项目来源类型
   */
  sourceType: IdeaSourceType;
  
  /**
   * 项目来源名称
   */
  sourceName: string;
  
  /**
   * 爬取时间
   */
  crawledAt: Date;
  
  /**
   * 作者（可选）
   */
  author?: string;
  
  /**
   * 发布日期（可选）
   */
  publishDate?: Date;
  
  /**
   * 标签（可选）
   */
  tags?: string[];
}

