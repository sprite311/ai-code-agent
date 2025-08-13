import { CrawlerTarget } from './CrawlerTarget';
import { CrawlerResult } from './CrawlerResult';

/**
 * 爬虫服务接口
 * 
 * 定义爬虫服务的功能
 */
export interface ICrawlerService {
  /**
   * 爬取单个目标
   * 
   * @param target - 爬取目标
   * @returns 爬取结果
   */
  crawlTarget(target: CrawlerTarget): Promise<CrawlerResult>;
  
  /**
   * 爬取多个目标
   * 
   * @param targets - 爬取目标列表
   * @param concurrency - 并发数量
   * @returns 爬取结果列表
   */
  crawlTargets(targets: CrawlerTarget[], concurrency?: number): Promise<CrawlerResult[]>;
  
  /**
   * 爬取URL
   * 
   * @param url - 要爬取的URL
   * @param selectors - CSS选择器配置
   * @returns 爬取结果
   */
  crawlUrl(url: string, selectors: any): Promise<CrawlerResult>;
  
  /**
   * 停止所有爬取任务
   */
  stopAll(): Promise<void>;
}

