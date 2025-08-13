import { MongoDBIdeaRepository } from '../../../../../infrastructure/persistence/mongodb/MongoDBIdeaRepository';
import { Idea } from '../../../../../domain/idea/Idea';
import { IdeaContent } from '../../../../../domain/idea/IdeaContent';
import { IdeaSource } from '../../../../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../../../../domain/idea/IdeaSourceType';
import { IdeaId } from '../../../../../domain/idea/IdeaId';
import { Collection, Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('MongoDBIdeaRepository', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let collection: Collection;
  let repository: MongoDBIdeaRepository;

  beforeAll(async () => {
    // 创建内存MongoDB服务器
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('test');
    collection = db.collection('ideas');
    repository = new MongoDBIdeaRepository(db);
  });

  afterAll(async () => {
    await client.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // 清空集合
    await collection.deleteMany({});
  });

  describe('save', () => {
    it('should save a new idea', async () => {
      // 创建测试创意
      const idea = Idea.create(
        'Test Idea',
        new IdeaContent('Test content'),
        new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
      );

      // 保存创意
      const savedIdea = await repository.save(idea);

      // 验证保存结果
      expect(savedIdea.id).toBeDefined();
      expect(savedIdea.title).toBe('Test Idea');
      expect(savedIdea.content.toString()).toBe('Test content');
      expect(savedIdea.source.getType()).toBe(IdeaSourceType.GENERATED);

      // 验证数据库中的文档
      const document = await collection.findOne({ _id: savedIdea.id.toObjectId() });
      expect(document).toBeDefined();
      expect(document?.title).toBe('Test Idea');
      expect(document?.content.text).toBe('Test content');
    });

    it('should update an existing idea', async () => {
      // 创建并保存测试创意
      const idea = Idea.create(
        'Test Idea',
        new IdeaContent('Test content'),
        new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
      );
      const savedIdea = await repository.save(idea);

      // 更新创意
      savedIdea.updateTitle('Updated Title');
      const updatedIdea = await repository.save(savedIdea);

      // 验证更新结果
      expect(updatedIdea.id).toEqual(savedIdea.id);
      expect(updatedIdea.title).toBe('Updated Title');

      // 验证数据库中的文档
      const document = await collection.findOne({ _id: savedIdea.id.toObjectId() });
      expect(document).toBeDefined();
      expect(document?.title).toBe('Updated Title');
    });
  });

  describe('findById', () => {
    it('should find an idea by id', async () => {
      // 创建并保存测试创意
      const idea = Idea.create(
        'Test Idea',
        new IdeaContent('Test content'),
        new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
      );
      const savedIdea = await repository.save(idea);

      // 查找创意
      const foundIdea = await repository.findById(savedIdea.id);

      // 验证查找结果
      expect(foundIdea).toBeDefined();
      expect(foundIdea?.id).toEqual(savedIdea.id);
      expect(foundIdea?.title).toBe('Test Idea');
      expect(foundIdea?.content.toString()).toBe('Test content');
    });

    it('should return null for non-existent id', async () => {
      // 查找不存在的创意
      const nonExistentId = new IdeaId('000000000000000000000000');
      const foundIdea = await repository.findById(nonExistentId);

      // 验证查找结果
      expect(foundIdea).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete an idea', async () => {
      // 创建并保存测试创意
      const idea = Idea.create(
        'Test Idea',
        new IdeaContent('Test content'),
        new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
      );
      const savedIdea = await repository.save(idea);

      // 删除创意
      const deleted = await repository.delete(savedIdea.id);

      // 验证删除结果
      expect(deleted).toBe(true);

      // 验证数据库中的文档已删除
      const document = await collection.findOne({ _id: savedIdea.id.toObjectId() });
      expect(document).toBeNull();
    });

    it('should return false for non-existent id', async () => {
      // 删除不存在的创意
      const nonExistentId = new IdeaId('000000000000000000000000');
      const deleted = await repository.delete(nonExistentId);

      // 验证删除结果
      expect(deleted).toBe(false);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      // 创建测试数据
      const ideas = [
        Idea.create(
          'Creative App Idea',
          new IdeaContent('A mobile app for creative people'),
          new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
        ),
        Idea.create(
          'Business Idea',
          new IdeaContent('A business for selling handmade crafts'),
          new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
        ),
        Idea.create(
          'Technology Concept',
          new IdeaContent('A new technology for renewable energy'),
          new IdeaSource(IdeaSourceType.CRAWLED, 'test', 'Test Source')
        )
      ];

      // 保存测试数据
      for (const idea of ideas) {
        await repository.save(idea);
      }
    });

    it('should search ideas by title', async () => {
      // 搜索创意
      const results = await repository.search('Creative');

      // 验证搜索结果
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Creative App Idea');
    });

    it('should search ideas by content', async () => {
      // 搜索创意
      const results = await repository.search('mobile');

      // 验证搜索结果
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Creative App Idea');
    });

    it('should return empty array for no matches', async () => {
      // 搜索创意
      const results = await repository.search('nonexistent');

      // 验证搜索结果
      expect(results.length).toBe(0);
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // 创建测试数据
      const ideas = [
        Idea.create(
          'Idea 1',
          new IdeaContent('Content 1'),
          new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
        ),
        Idea.create(
          'Idea 2',
          new IdeaContent('Content 2'),
          new IdeaSource(IdeaSourceType.GENERATED, 'test', 'Test Source')
        ),
        Idea.create(
          'Idea 3',
          new IdeaContent('Content 3'),
          new IdeaSource(IdeaSourceType.CRAWLED, 'test', 'Test Source')
        )
      ];

      // 保存测试数据
      for (const idea of ideas) {
        await repository.save(idea);
      }
    });

    it('should find all ideas', async () => {
      // 查找所有创意
      const results = await repository.findAll();

      // 验证查找结果
      expect(results.length).toBe(3);
    });

    it('should respect limit parameter', async () => {
      // 查找创意（限制数量）
      const results = await repository.findAll(2);

      // 验证查找结果
      expect(results.length).toBe(2);
    });

    it('should respect offset parameter', async () => {
      // 查找创意（跳过数量）
      const results = await repository.findAll(undefined, 2);

      // 验证查找结果
      expect(results.length).toBe(1);
    });
  });
});

