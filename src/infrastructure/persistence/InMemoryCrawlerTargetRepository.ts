import { ICrawlerTargetRepository } from '../../domain/crawler/ICrawlerTargetRepository';
import { CrawlerTarget } from '../../domain/crawler/CrawlerTarget';

/**
 * 内存爬虫目标仓储
 * 
 * 基于内存的爬虫目标仓储实现，主要用于测试和原型开发
 */
export class InMemoryCrawlerTargetRepository implements ICrawlerTargetRepository {
  private targets: CrawlerTarget[] = [];

  /**
   * 根据ID查找爬虫目标
   * 
   * @param id - 爬虫目标ID
   * @returns 爬虫目标，如果不存在则返回null
   */
  async findById(id: string): Promise<CrawlerTarget | null> {
    const target = this.targets.find(t => t.id === id);
    return target || null;
  }

  /**
   * 保存爬虫目标
   * 
   * @param target - 要保存的爬虫目标
   * @returns 保存的爬虫目标
   */
  async save(target: CrawlerTarget): Promise<CrawlerTarget> {
    const existingIndex = this.targets.findIndex(t => t.id === target.id);
    
    if (existingIndex >= 0) {
      // 更新现有目标
      this.targets[existingIndex] = target;
    } else {
      // 添加新目标
      this.targets.push(target);
    }
    
    return target;
  }

  /**
   * 删除爬虫目标
   * 
   * @param id - 要删除的爬虫目标ID
   * @returns 是否成功删除
   */
  async delete(id: string): Promise<boolean> {
    const initialLength = this.targets.length;
    this.targets = this.targets.filter(t => t.id !== id);
    return initialLength > this.targets.length;
  }

  /**
   * 查找所有爬虫目标
   * 
   * @returns 爬虫目标列表
   */
  async findAll(): Promise<CrawlerTarget[]> {
    return [...this.targets];
  }

  /**
   * 查找需要爬取的目标
   * 
   * @param limit - 限制返回数量
   * @returns 需要爬取的目标列表
   */
  async findTargetsForCrawling(limit?: number): Promise<CrawlerTarget[]> {
    // 过滤需要爬取的目标
    const targetsToCrawl = this.targets.filter(target => target.needsCrawling());
    
    // 按优先级排序
    const sortedTargets = targetsToCrawl.sort((a, b) => b.priority - a.priority);
    
    // 限制返回数量
    if (limit !== undefined && limit > 0) {
      return sortedTargets.slice(0, limit);
    }
    
    return sortedTargets;
  }

  /**
   * 更新爬取时间
   * 
   * @param id - 爬虫目标ID
   * @param timestamp - 爬取时间戳
   * @returns 更新后的爬虫目标
   */
  async updateLastCrawled(id: string, timestamp: Date): Promise<CrawlerTarget> {
    const target = await this.findById(id);
    
    if (!target) {
      throw new Error(`Crawler target not found: ${id}`);
    }
    
    // 创建更新后的目标
    const updatedTarget = new CrawlerTarget(
      target.id,
      target.url,
      target.name,
      target.type,
      target.selectors,
      target.priority,
      target.crawlFrequency,
      timestamp
    );
    
    // 保存更新后的目标
    await this.save(updatedTarget);
    
    return updatedTarget;
  }

  /**
   * 根据类型查找爬虫目标
   * 
   * @param type - 爬虫目标类型
   * @returns 爬虫目标列表
   */
  async findByType(type: string): Promise<CrawlerTarget[]> {
    return this.targets.filter(target => target.type.toString() === type);
  }

  /**
   * 根据优先级查找爬虫目标
   * 
   * @param minPriority - 最小优先级
   * @param maxPriority - 最大优先级
   * @returns 爬虫目标列表
   */
  async findByPriority(minPriority: number, maxPriority: number): Promise<CrawlerTarget[]> {
    return this.targets.filter(
      target => target.priority >= minPriority && target.priority <= maxPriority
    );
  }
}

