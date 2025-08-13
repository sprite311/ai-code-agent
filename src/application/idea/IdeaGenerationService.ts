import { ILLMService } from '../../domain/services/ILLMService';
import { IIdeaRepository } from '../../domain/idea/IIdeaRepository';
import { IIdeaCategorizationService } from '../../domain/services/IdeaCategorizationService';
import { IDomainEventDispatcher } from '../../domain/events/IDomainEventDispatcher';
import { Idea } from '../../domain/idea/Idea';
import { IdeaContent } from '../../domain/idea/IdeaContent';
import { IdeaSource } from '../../domain/idea/IdeaSource';
import { IdeaSourceType } from '../../domain/idea/IdeaSourceType';
import { Category } from '../../domain/category/Category';
import { GenerateIdeaCommand } from './commands/GenerateIdeaCommand';
import { IdeaCreatedEvent } from '../../domain/events/idea/IdeaCreatedEvent';
import { IdeaCategorizedEvent } from '../../domain/events/idea/IdeaCategorizedEvent';
import { IdeaTaggedEvent } from '../../domain/events/idea/IdeaTaggedEvent';

/**
 * 创意生成应用服务
 * 
 * 负责协调创意生成过程
 */
export class IdeaGenerationService {
  /**
   * 创建创意生成服务
   * 
   * @param llmService - LLM服务
   * @param ideaRepository - 创意仓储
   * @param categorizationService - 创意分类服务
   * @param eventDispatcher - 事件分发器
   */
  constructor(
    private readonly llmService: ILLMService,
    private readonly ideaRepository: IIdeaRepository,
    private readonly categorizationService: IIdeaCategorizationService,
    private readonly eventDispatcher: IDomainEventDispatcher
  ) {}

  /**
   * 生成单个创意
   * 
   * @param command - 生成创意命令
   * @param availableCategories - 可用的分类列表
   * @returns 生成的创意
   */
  async generateIdea(command: GenerateIdeaCommand, availableCategories: Category[]): Promise<Idea> {
    try {
      // 构建提示
      const prompt = this.buildGenerationPrompt(command.prompt);
      
      // 调用LLM生成创意
      const generatedContent = await this.llmService.generateCompletion(prompt, {
        temperature: 0.7,
        maxTokens: 1000
      });
      
      // 从生成的内容中提取标题和正文
      const { title, content } = this.extractTitleAndContent(generatedContent);
      
      // 创建创意实体
      const ideaContent = new IdeaContent(content);
      const ideaSource = new IdeaSource(IdeaSourceType.GENERATED, command.prompt);
      const idea = Idea.create(title, ideaContent, ideaSource);
      
      // 对创意进行分类
      const categories = await this.categorizationService.categorizeIdea(idea, availableCategories);
      categories.forEach(category => idea.addCategory(category));
      
      // 为创意添加标签
      const tags = await this.categorizationService.suggestTags(idea);
      tags.forEach(tag => idea.addTag(tag));
      
      // 保存创意
      await this.ideaRepository.save(idea);
      
      // 发布事件
      await this.publishEvents(idea, categories);
      
      return idea;
    } catch (error) {
      console.error('Error generating idea:', error);
      throw new Error('Failed to generate idea');
    }
  }

  /**
   * 生成多个创意
   * 
   * @param command - 生成创意命令
   * @param availableCategories - 可用的分类列表
   * @returns 生成的创意列表
   */
  async generateMultipleIdeas(command: GenerateIdeaCommand, availableCategories: Category[]): Promise<Idea[]> {
    const ideas: Idea[] = [];
    
    for (let i = 0; i < command.count; i++) {
      const idea = await this.generateIdea(command, availableCategories);
      ideas.push(idea);
    }
    
    return ideas;
  }

  /**
   * 构建生成提示
   * 
   * @param userPrompt - 用户提示
   * @returns 完整的生成提示
   */
  private buildGenerationPrompt(userPrompt: string): string {
    return `
      Generate a creative and innovative idea based on the following prompt:
      "${userPrompt}"
      
      Your response should include:
      1. A concise and catchy title for the idea
      2. A detailed description of the idea (at least 100 words)
      
      Format your response as:
      Title: [Idea Title]
      
      [Idea Description]
    `;
  }

  /**
   * 从生成的内容中提取标题和正文
   * 
   * @param generatedContent - 生成的内容
   * @returns 标题和正文
   */
  private extractTitleAndContent(generatedContent: string): { title: string; content: string } {
    // 尝试从格式化的响应中提取标题和内容
    const titleMatch = generatedContent.match(/Title:\s*(.+?)(?:\n|$)/i);
    
    if (titleMatch) {
      // 找到了格式化的标题
      const title = titleMatch[1].trim();
      // 移除标题部分，剩余的作为内容
      const content = generatedContent
        .replace(/Title:\s*.+?(?:\n|$)/i, '')
        .trim();
      
      return { title, content };
    } else {
      // 没有找到格式化的标题，使用第一行作为标题
      const lines = generatedContent.split('\n');
      const title = lines[0].trim();
      const content = lines.slice(1).join('\n').trim();
      
      return { title, content };
    }
  }

  /**
   * 发布创意相关事件
   * 
   * @param idea - 创意
   * @param categories - 分类列表
   */
  private async publishEvents(idea: Idea, categories: Category[]): Promise<void> {
    // 创意创建事件
    await this.eventDispatcher.dispatch(
      new IdeaCreatedEvent(idea.id, idea.title, idea.source.getType())
    );
    
    // 创意分类事件
    if (categories.length > 0) {
      await this.eventDispatcher.dispatch(
        new IdeaCategorizedEvent(
          idea.id,
          categories.map(c => c.id)
        )
      );
    }
    
    // 创意标记事件
    if (idea.tags.length > 0) {
      await this.eventDispatcher.dispatch(
        new IdeaTaggedEvent(
          idea.id,
          idea.tags.map(t => t.getName())
        )
      );
    }
  }
}

