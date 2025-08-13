import { LLMIdeaCategorizationService } from '../../../../domain/services/LLMIdeaCategorizationService';
import { Idea } from '../../../../domain/idea/Idea';
import { IdeaId } from '../../../../domain/idea/IdeaId';
import { IdeaContent } from '../../../../domain/idea/IdeaContent';
import { IdeaSource } from '../../../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../../../domain/idea/IdeaSourceType';
import { Category } from '../../../../domain/category/Category';
import { CategoryId } from '../../../../domain/category/CategoryId';
import { Tag } from '../../../../domain/idea/Tag';
import { ILLMService } from '../../../../domain/services/ILLMService';

// 模拟LLM服务
class MockLLMService implements ILLMService {
  async generateCompletion(prompt: string): Promise<string> {
    if (prompt.includes('categorize')) {
      return JSON.stringify({
        categories: ['technology', 'innovation'],
        explanation: 'This idea is related to technology and innovation.'
      });
    } else if (prompt.includes('suggest tags')) {
      return JSON.stringify({
        tags: [
          { name: 'ai', relevance: 95 },
          { name: 'machine learning', relevance: 90 },
          { name: 'innovation', relevance: 85 }
        ]
      });
    } else if (prompt.includes('extract key concepts')) {
      return JSON.stringify({
        concepts: ['artificial intelligence', 'automation', 'efficiency']
      });
    } else if (prompt.includes('calculate similarity')) {
      return JSON.stringify({
        similarity_score: 75,
        common_themes: ['technology', 'innovation']
      });
    }
    return '';
  }
}

describe('LLMIdeaCategorizationService', () => {
  let service: LLMIdeaCategorizationService;
  let mockLLMService: ILLMService;
  let idea: Idea;
  let categories: Category[];

  beforeEach(() => {
    mockLLMService = new MockLLMService();
    service = new LLMIdeaCategorizationService(mockLLMService);

    // 创建测试创意
    idea = new Idea(
      new IdeaId('idea-123'),
      'AI-powered productivity tool',
      new IdeaContent('A tool that uses AI to automate repetitive tasks and improve productivity.'),
      new IdeaSource(IdeaSourceType.GENERATED, 'prompt-123'),
      new Date()
    );

    // 创建测试分类
    categories = [
      new Category(new CategoryId('category-1'), 'Technology', 'Tech related ideas'),
      new Category(new CategoryId('category-2'), 'Business', 'Business related ideas'),
      new Category(new CategoryId('category-3'), 'Innovation', 'Innovative ideas'),
      new Category(new CategoryId('category-4'), 'Health', 'Health related ideas')
    ];
  });

  it('should categorize an idea correctly', async () => {
    // Act
    const result = await service.categorizeIdea(idea, categories);

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].name.toLowerCase()).toBe('technology');
    expect(result[1].name.toLowerCase()).toBe('innovation');
  });

  it('should suggest tags for an idea', async () => {
    // Act
    const tags = await service.suggestTags(idea);

    // Assert
    expect(tags).toHaveLength(3);
    expect(tags[0].getName()).toBe('ai');
    expect(tags[0].getRelevance()).toBe(95);
    expect(tags[1].getName()).toBe('machine learning');
    expect(tags[2].getName()).toBe('innovation');
  });

  it('should extract key concepts from an idea', async () => {
    // Act
    const concepts = await service.extractKeyConcepts(idea);

    // Assert
    expect(concepts).toHaveLength(3);
    expect(concepts).toContain('artificial intelligence');
    expect(concepts).toContain('automation');
    expect(concepts).toContain('efficiency');
  });

  it('should calculate similarity between two ideas', async () => {
    // Arrange
    const ideaB = new Idea(
      new IdeaId('idea-456'),
      'Machine learning for business',
      new IdeaContent('Using machine learning to improve business processes.'),
      new IdeaSource(IdeaSourceType.GENERATED, 'prompt-456'),
      new Date()
    );

    // Act
    const similarity = await service.calculateSimilarity(idea, ideaB);

    // Assert
    expect(similarity).toBe(75);
  });

  it('should recommend related ideas', async () => {
    // Arrange
    const candidateIdeas = [
      new Idea(
        new IdeaId('idea-456'),
        'Machine learning for business',
        new IdeaContent('Using machine learning to improve business processes.'),
        new IdeaSource(IdeaSourceType.GENERATED, 'prompt-456'),
        new Date()
      ),
      new Idea(
        new IdeaId('idea-789'),
        'Health monitoring app',
        new IdeaContent('An app that monitors health metrics.'),
        new IdeaSource(IdeaSourceType.GENERATED, 'prompt-789'),
        new Date()
      )
    ];

    // Mock the calculateSimilarity method
    jest.spyOn(service, 'calculateSimilarity').mockImplementation(async (a, b) => {
      if (b.id.toString() === 'idea-456') return 75;
      if (b.id.toString() === 'idea-789') return 30;
      return 0;
    });

    // Act
    const recommendations = await service.recommendRelatedIdeas(idea, candidateIdeas);

    // Assert
    expect(recommendations).toHaveLength(1); // Only the first idea should be recommended (similarity > 50)
    expect(recommendations[0].id.toString()).toBe('idea-456');
  });
});

