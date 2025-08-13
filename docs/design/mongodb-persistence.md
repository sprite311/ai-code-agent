# MongoDB持久化设计文档

## 1. 概述

本文档描述了创意想法生成应用的MongoDB持久化层设计。MongoDB作为一个文档型数据库，非常适合存储结构灵活的创意数据。

## 2. 数据模型

### 2.1 创意（Ideas）集合

**文档结构：**

```json
{
  "_id": ObjectId("60d21b4667d0d8992e610c85"),
  "title": "创意标题",
  "content": {
    "text": "创意内容文本"
  },
  "source": {
    "type": "GENERATED",
    "reference": "reference-id",
    "name": "来源名称"
  },
  "creationDate": ISODate("2023-01-01T00:00:00Z"),
  "popularity": 10,
  "tags": [
    {
      "name": "标签1",
      "relevance": 0.9
    },
    {
      "name": "标签2",
      "relevance": 0.7
    }
  ],
  "categories": [
    {
      "id": "category-id-1",
      "name": "分类1",
      "description": "分类描述"
    }
  ]
}
```

**索引：**

```javascript
db.ideas.createIndex({ title: "text", "content.text": "text" });
db.ideas.createIndex({ "tags.name": 1 });
db.ideas.createIndex({ "categories.id": 1 });
db.ideas.createIndex({ creationDate: -1 });
db.ideas.createIndex({ popularity: -1 });
```

### 2.2 爬虫目标（Crawler Targets）集合

**文档结构：**

```json
{
  "_id": ObjectId("60d21b4667d0d8992e610c86"),
  "id": "target-id",
  "url": "https://example.com",
  "name": "目标名称",
  "type": "WEBSITE",
  "selectors": {
    "contentContainer": ".content",
    "title": ".title",
    "content": ".body",
    "date": ".date",
    "author": ".author",
    "tags": ".tags",
    "pagination": ".pagination",
    "nextPage": ".next-page"
  },
  "priority": 5,
  "crawlFrequency": 24,
  "lastCrawled": ISODate("2023-01-01T00:00:00Z")
}
```

**索引：**

```javascript
db.crawler_targets.createIndex({ type: 1 });
db.crawler_targets.createIndex({ priority: -1 });
db.crawler_targets.createIndex({ lastCrawled: 1 });
```

## 3. 仓储实现

### 3.1 MongoDBIdeaRepository

实现`IIdeaRepository`接口，提供创意的存储和检索功能。

**主要方法：**

- `findById(id: IdeaId): Promise<Idea | null>`：根据ID查找创意
- `save(idea: Idea): Promise<Idea>`：保存创意
- `delete(id: IdeaId): Promise<boolean>`：删除创意
- `findAll(limit?: number, offset?: number): Promise<Idea[]>`：查找所有创意
- `findByTag(tag: string, limit?: number, offset?: number): Promise<Idea[]>`：根据标签查找创意
- `findByCategory(categoryId: CategoryId, limit?: number, offset?: number): Promise<Idea[]>`：根据分类查找创意
- `search(query: string, limit?: number, offset?: number): Promise<Idea[]>`：搜索创意
- `findPopular(limit?: number): Promise<Idea[]>`：查找热门创意
- `findRecent(limit?: number): Promise<Idea[]>`：查找最新创意

**实现细节：**

- 使用MongoDB的文本索引进行搜索
- 使用投影限制返回字段
- 使用排序和分页优化查询性能
- 实现实体和文档之间的映射

### 3.2 MongoDBCrawlerTargetRepository

实现`ICrawlerTargetRepository`接口，提供爬虫目标的存储和检索功能。

**主要方法：**

- `findById(id: string): Promise<CrawlerTarget | null>`：根据ID查找爬虫目标
- `save(target: CrawlerTarget): Promise<CrawlerTarget>`：保存爬虫目标
- `delete(id: string): Promise<boolean>`：删除爬虫目标
- `findAll(): Promise<CrawlerTarget[]>`：查找所有爬虫目标
- `findTargetsForCrawling(limit?: number): Promise<CrawlerTarget[]>`：查找需要爬取的目标
- `updateLastCrawled(id: string, timestamp: Date): Promise<CrawlerTarget>`：更新爬取时间
- `findByType(type: string): Promise<CrawlerTarget[]>`：根据类型查找爬虫目标
- `findByPriority(minPriority: number, maxPriority: number): Promise<CrawlerTarget[]>`：根据优先级查找爬虫目标

**实现细节：**

- 使用复合查询条件查找需要爬取的目标
- 使用原子更新操作更新爬取时间
- 实现实体和文档之间的映射

## 4. 连接管理

### 4.1 MongoDBConnectionManager

管理MongoDB连接的单例类。

**主要方法：**

- `getInstance(): MongoDBConnectionManager`：获取单例实例
- `connect(connectionString: string, dbName: string): Promise<Db>`：连接到MongoDB
- `getDb(): Db`：获取数据库实例
- `close(): Promise<void>`：关闭连接

**实现细节：**

- 使用单例模式确保只有一个连接实例
- 实现连接池管理
- 提供错误处理和重试机制

## 5. 对象映射

### 5.1 实体到文档映射

将领域实体映射到MongoDB文档。

**Idea实体到文档映射：**

```typescript
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
```

### 5.2 文档到实体映射

将MongoDB文档映射到领域实体。

**文档到Idea实体映射：**

```typescript
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
```

## 6. 性能优化

### 6.1 索引优化

- 为常用查询字段创建索引
- 为全文搜索创建文本索引
- 为排序字段创建索引
- 定期分析和优化索引

### 6.2 查询优化

- 使用投影限制返回字段
- 使用分页限制结果数量
- 避免深度嵌套查询
- 使用聚合管道优化复杂查询

### 6.3 连接优化

- 使用连接池管理连接
- 实现连接重试机制
- 监控连接状态

## 7. 事务支持

MongoDB 4.0+支持多文档事务，可以在需要原子性的操作中使用。

**事务示例：**

```typescript
const session = client.startSession();
session.startTransaction();

try {
  // 执行多个操作
  await collection1.updateOne({ _id: id1 }, { $set: { field: value1 } }, { session });
  await collection2.updateOne({ _id: id2 }, { $set: { field: value2 } }, { session });
  
  // 提交事务
  await session.commitTransaction();
} catch (error) {
  // 回滚事务
  await session.abortTransaction();
  throw error;
} finally {
  // 结束会话
  session.endSession();
}
```

## 8. 错误处理

### 8.1 连接错误

- 实现重试机制
- 记录连接错误
- 提供友好的错误消息

### 8.2 查询错误

- 验证查询参数
- 捕获和记录查询异常
- 提供详细的错误信息

### 8.3 映射错误

- 处理无效的ObjectId
- 处理缺失字段
- 提供默认值

## 9. 测试策略

### 9.1 单元测试

- 使用MongoDB内存服务器进行测试
- 测试仓储方法
- 测试实体和文档映射

### 9.2 集成测试

- 测试与实际MongoDB的集成
- 测试事务和并发操作
- 测试错误处理和恢复

### 9.3 性能测试

- 测试大数据量下的性能
- 测试并发操作性能
- 测试索引效果

