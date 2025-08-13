import { MongoClient, Db } from 'mongodb';

/**
 * MongoDB连接管理器
 * 
 * 管理MongoDB连接的单例类
 */
export class MongoDBConnectionManager {
  private static instance: MongoDBConnectionManager;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  
  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {}
  
  /**
   * 获取单例实例
   * 
   * @returns MongoDB连接管理器实例
   */
  static getInstance(): MongoDBConnectionManager {
    if (!MongoDBConnectionManager.instance) {
      MongoDBConnectionManager.instance = new MongoDBConnectionManager();
    }
    return MongoDBConnectionManager.instance;
  }
  
  /**
   * 连接到MongoDB
   * 
   * @param connectionString - MongoDB连接字符串
   * @param dbName - 数据库名称
   * @returns MongoDB数据库实例
   */
  async connect(connectionString: string, dbName: string): Promise<Db> {
    if (this.db) {
      return this.db;
    }
    
    try {
      this.client = new MongoClient(connectionString);
      await this.client.connect();
      this.db = this.client.db(dbName);
      
      console.log(`Connected to MongoDB database: ${dbName}`);
      return this.db;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }
  
  /**
   * 获取数据库实例
   * 
   * @returns MongoDB数据库实例
   */
  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB connection not established. Call connect() first.');
    }
    return this.db;
  }
  
  /**
   * 关闭连接
   */
  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('MongoDB connection closed');
    }
  }
}

