import { ICrawlerTargetRepository } from '../../../domain/crawler/ICrawlerTargetRepository';
import { CrawlerTarget, CrawlerTargetType, CrawlerSelectors } from '../../../domain/crawler/CrawlerTarget';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';

/**
 * MongoDB爬虫目标仓储
 * 
 * 基于MongoDB的爬虫目标仓储实现
 */
export class MongoDBCrawlerTargetRepository implements ICrawlerTargetRepository {
  private collection: Collection;
  
  /**
   * 创建MongoDB爬虫目标仓储
   * 
   * @param db - MongoDB数据库实例
   */
  constructor(private readonly db: Db) {
    this.collection = this.db.collection('crawler_targets');
  }
  
  /**
   * 根据ID查找爬虫目标
   * 
   * @param id - 爬虫目标ID
   * @returns 爬虫目标，如果不存在则返回null
   */
  async findById(id: string): Promise<CrawlerTarget | null> {
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      // 如果ID不是有效的ObjectId，则使用字符串ID查询
      const document = await this.collection.findOne({ id });
      return document ? this.documentToEntity(document) : null;
    }
    
    const document = await this.collection.findOne({ _id: objectId });
    return document ? this.documentToEntity(document) : null;
  }
  
  /**
   * 保存爬虫目标
   * 
   * @param target - 要保存的爬虫目标
   * @returns 保存的爬虫目标
   */
  async save(target: CrawlerTarget): Promise<CrawlerTarget> {
    const document = this.entityToDocument(target);
    
    if (document._id) {
      // 更新现有目标
      await this.collection.updateOne(
        { _id: document._id },
        { $set: document }
      );
    } else {
      // 添加新目标
      const result = await this.collection.insertOne(document);
      document._id = result.insertedId;
      document.id = result.insertedId.toString();
    }
    
    return this.documentToEntity(document);
  }
  
  /**
   * 删除爬虫目标
   * 
   * @param id - 要删除的爬虫目标ID
   * @returns 是否成功删除
   */
  async delete(id: string): Promise<boolean> {
    let objectId;
    try {
      objectId = new ObjectId(id);
      const result = await this.collection.deleteOne({ _id: objectId });
      return result.deletedCount === 1;
    } catch (error) {
      // 如果ID不是有效的ObjectId，则使用字符串ID删除
      const result = await this.collection.deleteOne({ id });
      return result.deletedCount === 1;
    }
  }
  
  /**
   * 查找所有爬虫目标
   * 
   * @returns 爬虫目标列表
   */
  async findAll(): Promise<CrawlerTarget[]> {
    const documents = await this.collection.find({}).toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 查找需要爬取的目标
   * 
   * @param limit - 限制返回数量
   * @returns 需要爬取的目标列表
   */
  async findTargetsForCrawling(limit?: number): Promise<CrawlerTarget[]> {
    const now = new Date();
    
    // 查找上次爬取时间为空或者已经超过爬取频率的目标
    const query = {
      $or: [
        { lastCrawled: null },
        {
          $expr: {
            $gte: [
              { $divide: [{ $subtract: [now, '$lastCrawled'] }, 3600000] }, // 转换为小时
              '$crawlFrequency'
            ]
          }
        }
      ]
    };
    
    // 按优先级排序
    const cursor = this.collection.find(query).sort({ priority: -1 });
    
    // 限制返回数量
    if (limit !== undefined && limit > 0) {
      cursor.limit(limit);
    }
    
    const documents = await cursor.toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 更新爬取时间
   * 
   * @param id - 爬虫目标ID
   * @param timestamp - 爬取时间戳
   * @returns 更新后的爬虫目标
   */
  async updateLastCrawled(id: string, timestamp: Date): Promise<CrawlerTarget> {
    let objectId;
    let filter;
    
    try {
      objectId = new ObjectId(id);
      filter = { _id: objectId };
    } catch (error) {
      // 如果ID不是有效的ObjectId，则使用字符串ID
      filter = { id };
    }
    
    const result = await this.collection.findOneAndUpdate(
      filter,
      { $set: { lastCrawled: timestamp } },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      throw new Error(`Crawler target not found: ${id}`);
    }
    
    return this.documentToEntity(result.value);
  }
  
  /**
   * 根据类型查找爬虫目标
   * 
   * @param type - 爬虫目标类型
   * @returns 爬虫目标列表
   */
  async findByType(type: string): Promise<CrawlerTarget[]> {
    const documents = await this.collection.find({ type }).toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 根据优先级查找爬虫目标
   * 
   * @param minPriority - 最小优先级
   * @param maxPriority - 最大优先级
   * @returns 爬虫目标列表
   */
  async findByPriority(minPriority: number, maxPriority: number): Promise<CrawlerTarget[]> {
    const documents = await this.collection.find({
      priority: { $gte: minPriority, $lte: maxPriority }
    }).toArray();
    
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 将文档转换为实体
   * 
   * @param document - MongoDB文档
   * @returns 爬虫目标实体
   */
  private documentToEntity(document: any): CrawlerTarget {
    return new CrawlerTarget(
      document.id || document._id.toString(),
      document.url,
      document.name,
      document.type as CrawlerTargetType,
      document.selectors as CrawlerSelectors,
      document.priority,
      document.crawlFrequency,
      document.lastCrawled ? new Date(document.lastCrawled) : null
    );
  }
  
  /**
   * 将实体转换为文档
   * 
   * @param target - 爬虫目标实体
   * @returns MongoDB文档
   */
  private entityToDocument(target: CrawlerTarget): any {
    const document: any = {
      id: target.id,
      url: target.url,
      name: target.name,
      type: target.type,
      selectors: target.selectors,
      priority: target.priority,
      crawlFrequency: target.crawlFrequency,
      lastCrawled: target.lastCrawled
    };
    
    // 如果ID是有效的ObjectId，则设置_id
    try {
      document._id = new ObjectId(target.id);
    } catch (error) {
      // 如果不是有效的ObjectId，则保留字符串ID
    }
    
    return document;
  }
  
  /**
   * 创建MongoDB爬虫目标仓储
   * 
   * @param connectionString - MongoDB连接字符串
   * @param dbName - 数据库名称
   * @returns MongoDB爬虫目标仓储实例
   */
  static async create(connectionString: string, dbName: string): Promise<MongoDBCrawlerTargetRepository> {
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db(dbName);
    
    // 创建索引
    const collection = db.collection('crawler_targets');
    await collection.createIndex({ type: 1 });
    await collection.createIndex({ priority: -1 });
    await collection.createIndex({ lastCrawled: 1 });
    
    return new MongoDBCrawlerTargetRepository(db);
  }
}

