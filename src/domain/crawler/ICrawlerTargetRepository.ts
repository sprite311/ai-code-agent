import { CrawlerTarget } from './CrawlerTarget';

/**
 * 爬虫目标仓储接口
 * 
 * 定义爬虫目标的存储和检索功能
 */
export interface ICrawlerTargetRepository {
  /**
   * 根据ID查找爬虫目标
   * 
   * @param id - 爬虫目标ID
   * @returns 爬虫目标，如果不存在则返回null
   */
  findById(id: string): Promise<CrawlerTarget | null>;
  
  /**
   * 保存爬虫目标
   * 
   * @param target - 要保存的爬虫目标
   * @returns 保存的爬虫目标
   */
  save(target: CrawlerTarget): Promise<CrawlerTarget>;
  
  /**
   * 删除爬虫目标
   * 
   * @param id - 要删除的爬虫目标ID
   * @returns 是否成功删除
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * 查找所有爬虫目标
   * 
   * @returns 爬虫目标列表
   */
  findAll(): Promise<CrawlerTarget[]>;
  
  /**
   * 查找需要爬取的目标
   * 
   * @param limit - 限制返回数量
   * @returns 需要爬取的目标列表
   */
  findTargetsForCrawling(limit?: number): Promise<CrawlerTarget[]>;
  
  /**
   * 更新爬取时间
   * 
   * @param id - 爬虫目标ID
   * @param timestamp - 爬取时间戳
   * @returns 更新后的爬虫目标
   */
  updateLastCrawled(id: string, timestamp: Date): Promise<CrawlerTarget>;
  
  /**
   * 根据类型查找爬虫目标
   * 
   * @param type - 爬虫目标类型
   * @returns 爬虫目标列表
   */
  findByType(type: string): Promise<CrawlerTarget[]>;
  
  /**
   * 根据优先级查找爬虫目标
   * 
   * @param minPriority - 最小优先级
   * @param maxPriority - 最大优先级
   * @returns 爬虫目标列表
   */
  findByPriority(minPriority: number, maxPriority: number): Promise<CrawlerTarget[]>;
}

