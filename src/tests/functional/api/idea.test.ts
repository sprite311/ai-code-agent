import request from 'supertest';
import { createApp } from '../../../interfaces/api/app';
import { configureContainer } from '../../../infrastructure/di/container';

// 模拟环境变量
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-api-key';

describe('Idea API', () => {
  let app: Express.Application;

  beforeAll(() => {
    // 配置依赖注入容器
    configureContainer();
    
    // 创建Express应用
    app = createApp();
    
    // 模拟LLM服务
    jest.mock('../../../infrastructure/llm/OpenAIService', () => {
      return {
        OpenAIService: jest.fn().mockImplementation(() => {
          return {
            generateCompletion: jest.fn().mockResolvedValue(
              'Title: Test Generated Idea\n\nThis is a test generated idea content.'
            )
          };
        })
      };
    });
  });

  describe('POST /api/ideas/generate', () => {
    it('should generate a new idea', async () => {
      const response = await request(app)
        .post('/api/ideas/generate')
        .send({ prompt: 'Generate an idea about AI' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('tags');
    });

    it('should return 400 if prompt is missing', async () => {
      const response = await request(app)
        .post('/api/ideas/generate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should generate multiple ideas', async () => {
      const response = await request(app)
        .post('/api/ideas/generate')
        .send({ prompt: 'Generate ideas about AI', count: 3 });

      expect(response.status).toBe(201);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
    });
  });
});

