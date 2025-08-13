import { IIdeaRepository } from '../../../domain/idea/IIdeaRepository';
import { Idea } from '../../../domain/idea/Idea';
import { IdeaId } from '../../../domain/idea/IdeaId';
import { IdeaContent } from '../../../domain/idea/IdeaContent';
import { IdeaSource } from '../../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../../domain/idea/IdeaSourceType';
import { Tag } from '../../../domain/idea/Tag';
import { CategoryId } from '../../../domain/category/CategoryId';
import { Category } from '../../../domain/category/Category';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';

/**
 * MongoDB创意仓储
 * 
 * 基于MongoDB的创意仓储实现
 */
export class MongoDBIdeaRepository implements IIdeaRepository {
  private collection: Collection;
  
  /**
   * 创建MongoDB创意仓储
   * 
   * @param db - MongoDB数据库实例
   */
  constructor(private readonly db: Db) {
    this.collection = this.db.collection('ideas');
  }
  
  /**
   * 根据ID查找创意
   * 
   * @param id - 创意ID
   * @returns 创意实体，如果不存在则返回null
   */
  async findById(id: IdeaId): Promise<Idea | null> {
    const document = await this.collection.findOne({ _id: new ObjectId(id.toString()) });
    
    if (!document) {
      return null;
    }
    
    return this.documentToEntity(document);
  }
  
  /**
   * 保存创意
   * 
   * @param idea - 要保存的创意
   * @returns 保存的创意
   */
  async save(idea: Idea): Promise<Idea> {
    const document = this.entityToDocument(idea);
    
    if (document._id) {
      // 更新现有创意
      await this.collection.updateOne(
        { _id: document._id },
        { $set: document }
      );
    } else {
      // 添加新创意
      const result = await this.collection.insertOne(document);
      document._id = result.insertedId;
    }
    
    return this.documentToEntity(document);
  }
  
  /**
   * 删除创意
   * 
   * @param id - 要删除的创意ID
   * @returns 是否成功删除
   */
  async delete(id: IdeaId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: new ObjectId(id.toString()) });
    return result.deletedCount === 1;
  }
  
  /**
   * 查找所有创意
   * 
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async findAll(limit?: number, offset = 0): Promise<Idea[]> {
    const query = this.collection.find({}).skip(offset);
    
    if (limit !== undefined) {
      query.limit(limit);
    }
    
    const documents = await query.toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 根据标签查找创意
   * 
   * @param tag - 标签名称
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async findByTag(tag: string, limit?: number, offset = 0): Promise<Idea[]> {
    const query = this.collection.find({
      'tags.name': { $regex: new RegExp(tag, 'i') }
    }).skip(offset);
    
    if (limit !== undefined) {
      query.limit(limit);
    }
    
    const documents = await query.toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 根据分类查找创意
   * 
   * @param categoryId - 分类ID
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async findByCategory(categoryId: CategoryId, limit?: number, offset = 0): Promise<Idea[]> {
    const query = this.collection.find({
      'categories.id': categoryId.toString()
    }).skip(offset);
    
    if (limit !== undefined) {
      query.limit(limit);
    }
    
    const documents = await query.toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 搜索创意
   * 
   * @param query - 搜索查询
   * @param limit - 限制返回数量
   * @param offset - 跳过的数量
   * @returns 创意列表
   */
  async search(query: string, limit?: number, offset = 0): Promise<Idea[]> {
    const searchQuery = this.collection.find({
      $or: [
        { title: { $regex: new RegExp(query, 'i') } },
        { 'content.text': { $regex: new RegExp(query, 'i') } }
      ]
    }).skip(offset);
    
    if (limit !== undefined) {
      searchQuery.limit(limit);
    }
    
    const documents = await searchQuery.toArray();
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 查找热门创意
   * 
   * @param limit - 限制返回数量
   * @returns 热门创意列表
   */
  async findPopular(limit = 10): Promise<Idea[]> {
    const documents = await this.collection.find({})
      .sort({ popularity: -1 })
      .limit(limit)
      .toArray();
    
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 查找最新创意
   * 
   * @param limit - 限制返回数量
   * @returns 最新创意列表
   */
  async findRecent(limit = 10): Promise<Idea[]> {
    const documents = await this.collection.find({})
      .sort({ creationDate: -1 })
      .limit(limit)
      .toArray();
    
    return documents.map(doc => this.documentToEntity(doc));
  }
  
  /**
   * 将文档转换为实体
   * 
   * @param document - MongoDB文档
   * @returns 创意实体
   */
  private documentToEntity(document: any): Idea {
    // 创建创意内容
    const content = new IdeaContent(document.content.text);
    
    // 创建创意来源
    const source = new IdeaSource(
      document.source.type as IdeaSourceType,
      document.source.reference,
      document.source.name
    );
    
    // 创建创意ID
    const id = new IdeaId(document._id.toString());
    
    // 创建创意实体
    const idea = Idea.createWithId(
      id,
      document.title,
      content,
      source,
      new Date(document.creationDate)
    );
    
    // 设置人气
    idea.popularity = document.popularity || 0;
    
    // 添加标签
    if (document.tags && Array.isArray(document.tags)) {
      document.tags.forEach((tag: any) => {
        idea.addTag(new Tag(tag.name, tag.relevance));
      });
    }
    
    // 添加分类
    if (document.categories && Array.isArray(document.categories)) {
      document.categories.forEach((category: any) => {
        const categoryId = new CategoryId(category.id);
        const categoryEntity = new Category(
          categoryId,
          category.name,
          category.description
        );
        idea.addCategory(categoryEntity);
      });
    }
    
    return idea;
  }
  
  /**
   * 将实体转换为文档
   * 
   * @param idea - 创意实体
   * @returns MongoDB文档
   */
  private entityToDocument(idea: Idea): any {
    const document: any = {
      title: idea.title,
      content: {
        text: idea.content.toString()
      },
      source: {
        type: idea.source.getType(),
        reference: idea.source.getReference(),
        name: idea.source.getName()
      },
      creationDate: idea.creationDate,
      popularity: idea.popularity,
      tags: idea.tags.map(tag => ({
        name: tag.getName(),
        relevance: tag.getRelevance()
      })),
      categories: idea.categories.map(category => ({
        id: category.id.toString(),
        name: category.name,
        description: category.description
      }))
    };
    
    // 如果有ID，则添加到文档
    if (idea.id) {
      try {
        document._id = new ObjectId(idea.id.toString());
      } catch (error) {
        // 如果ID不是有效的ObjectId，则不设置_id，让MongoDB自动生成
        console.warn(`Invalid ObjectId: ${idea.id.toString()}, will generate a new one`);
      }
    }
    
    return document;
  }
  
  /**
   * 创建MongoDB创意仓储
   * 
   * @param connectionString - MongoDB连接字符串
   * @param dbName - 数据库名称
   * @returns MongoDB创意仓储实例
   */
  static async create(connectionString: string, dbName: string): Promise<MongoDBIdeaRepository> {
    const client = new MongoClient(connectionString);
    await client.connect();
    const db = client.db(dbName);
    
    // 创建索引
    const collection = db.collection('ideas');
    await collection.createIndex({ title: 'text', 'content.text': 'text' });
    await collection.createIndex({ 'tags.name': 1 });
    await collection.createIndex({ 'categories.id': 1 });
    await collection.createIndex({ creationDate: -1 });
    await collection.createIndex({ popularity: -1 });
    
    return new MongoDBIdeaRepository(db);
  }
}

