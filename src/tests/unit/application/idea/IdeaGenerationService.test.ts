import { IdeaGenerationService } from '../../../../application/idea/IdeaGenerationService';
import { ILLMService } from '../../../../domain/services/ILLMService';
import { IIdeaRepository } from '../../../../domain/idea/IIdeaRepository';
import { IIdeaCategorizationService } from '../../../../domain/services/IdeaCategorizationService';
import { IDomainEventDispatcher } from '../../../../domain/events/IDomainEventDispatcher';
import { Idea } from '../../../../domain/idea/Idea';
import { IdeaContent } from '../../../../domain/idea/IdeaContent';
import { IdeaSource } from '../../../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../../../domain/idea/IdeaSourceType';
import { Category } from '../../../../domain/category/Category';
import { CategoryId } from '../../../../domain/category/CategoryId';
import { Tag } from '../../../../domain/idea/Tag';
import { GenerateIdeaCommand } from '../../../../application/idea/commands/GenerateIdeaCommand';
import { IdeaCreatedEvent } from '../../../../domain/events/idea/IdeaCreatedEvent';
import { IdeaCategorizedEvent } from '../../../../domain/events/idea/IdeaCategorizedEvent';
import { IdeaTaggedEvent } from '../../../../domain/events/idea/IdeaTaggedEvent';

// 模拟依赖
class MockLLMService implements ILLMService {
  async generateCompletion(prompt: string): Promise<string> {
    return 'This is a generated idea about AI technology.';
  }
}

class MockIdeaRepository implements IIdeaRepository {
  private ideas: Idea[] = [];

  async findById(id: any): Promise<Idea | null> {
    return this.ideas.find(i => i.id.toString() === id.toString()) || null;
  }

  async save(idea: Idea): Promise<Idea> {
    const existingIndex = this.ideas.findIndex(i => i.id.toString() === idea.id.toString());
    if (existingIndex >= 0) {
      this.ideas[existingIndex] = idea;
    } else {
      this.ideas.push(idea);
    }
    return idea;
  }

  async delete(id: any): Promise<boolean> {
    const initialLength = this.ideas.length;
    this.ideas = this.ideas.filter(i => i.id.toString() !== id.toString());
    return initialLength > this.ideas.length;
  }

  async findAll(): Promise<Idea[]> {
    return this.ideas;
  }

  async findByTag(): Promise<Idea[]> {
    return [];
  }

  async findByCategory(): Promise<Idea[]> {
    return [];
  }

  async search(): Promise<Idea[]> {
    return [];
  }

  async findPopular(): Promise<Idea[]> {
    return [];
  }

  async findRecent(): Promise<Idea[]> {
    return [];
  }
}

class MockCategorizationService implements IIdeaCategorizationService {
  async categorizeIdea(idea: Idea, availableCategories: Category[]): Promise<Category[]> {
    return [availableCategories[0]];
  }

  async suggestTags(idea: Idea): Promise<Tag[]> {
    return [new Tag('ai'), new Tag('technology')];
  }

  async extractKeyConcepts(): Promise<string[]> {
    return ['ai', 'technology'];
  }

  async calculateSimilarity(): Promise<number> {
    return 75;
  }

  async recommendRelatedIdeas(): Promise<Idea[]> {
    return [];
  }
}

class MockEventDispatcher implements IDomainEventDispatcher {
  public dispatchedEvents: any[] = [];

  register(): void {
    // Do nothing
  }

  async dispatch(event: any): Promise<void> {
    this.dispatchedEvents.push(event);
  }
}

describe('IdeaGenerationService', () => {
  let service: IdeaGenerationService;
  let llmService: ILLMService;
  let ideaRepository: IIdeaRepository;
  let categorizationService: IIdeaCategorizationService;
  let eventDispatcher: MockEventDispatcher;
  let categories: Category[];

  beforeEach(() => {
    llmService = new MockLLMService();
    ideaRepository = new MockIdeaRepository();
    categorizationService = new MockCategorizationService();
    eventDispatcher = new MockEventDispatcher();
    
    categories = [
      new Category(new CategoryId('category-1'), 'Technology', 'Tech related ideas'),
      new Category(new CategoryId('category-2'), 'Business', 'Business related ideas')
    ];

    service = new IdeaGenerationService(
      llmService,
      ideaRepository,
      categorizationService,
      eventDispatcher
    );
  });

  it('should generate an idea from a prompt', async () => {
    // Arrange
    const command = new GenerateIdeaCommand('Generate an idea about AI technology');

    // Act
    const result = await service.generateIdea(command, categories);

    // Assert
    expect(result).toBeDefined();
    expect(result.title).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.source.getType()).toBe(IdeaSourceType.GENERATED);
    
    // Verify idea was saved
    const savedIdeas = await ideaRepository.findAll();
    expect(savedIdeas).toHaveLength(1);
    expect(savedIdeas[0].id.toString()).toBe(result.id.toString());
    
    // Verify events were dispatched
    expect(eventDispatcher.dispatchedEvents).toHaveLength(3);
    expect(eventDispatcher.dispatchedEvents[0]).toBeInstanceOf(IdeaCreatedEvent);
    expect(eventDispatcher.dispatchedEvents[1]).toBeInstanceOf(IdeaCategorizedEvent);
    expect(eventDispatcher.dispatchedEvents[2]).toBeInstanceOf(IdeaTaggedEvent);
  });

  it('should handle LLM service errors gracefully', async () => {
    // Arrange
    const errorLLMService: ILLMService = {
      generateCompletion: jest.fn().mockRejectedValue(new Error('LLM service error'))
    };
    
    service = new IdeaGenerationService(
      errorLLMService,
      ideaRepository,
      categorizationService,
      eventDispatcher
    );
    
    const command = new GenerateIdeaCommand('Generate an idea about AI technology');

    // Act & Assert
    await expect(service.generateIdea(command, categories)).rejects.toThrow('Failed to generate idea');
  });

  it('should generate multiple ideas from a prompt', async () => {
    // Arrange
    const command = new GenerateIdeaCommand('Generate ideas about AI technology', 3);

    // Act
    const results = await service.generateMultipleIdeas(command, categories);

    // Assert
    expect(results).toHaveLength(3);
    
    // Verify ideas were saved
    const savedIdeas = await ideaRepository.findAll();
    expect(savedIdeas).toHaveLength(3);
    
    // Verify events were dispatched (3 ideas * 3 events per idea)
    expect(eventDispatcher.dispatchedEvents).toHaveLength(9);
  });
});

