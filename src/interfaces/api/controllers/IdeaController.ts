import { Request, Response } from 'express';
import { container } from '../../../infrastructure/di/container';
import { IdeaGenerationService } from '../../../application/idea/IdeaGenerationService';
import { GenerateIdeaCommand } from '../../../application/idea/commands/GenerateIdeaCommand';
import { Category } from '../../../domain/category/Category';
import { CategoryId } from '../../../domain/category/CategoryId';

/**
 * 创意控制器
 * 
 * 处理创意相关的HTTP请求
 */
export class IdeaController {
  /**
   * 生成创意
   * 
   * @param req - HTTP请求
   * @param res - HTTP响应
   */
  async generateIdea(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, count = 1 } = req.body;
      
      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }
      
      // 获取应用服务
      const ideaGenerationService = container.resolve<IdeaGenerationService>('IdeaGenerationService');
      
      // 创建命令
      const command = new GenerateIdeaCommand(prompt, count);
      
      // 模拟一些分类
      const categories = [
        new Category(new CategoryId('category-1'), 'Technology', 'Tech related ideas'),
        new Category(new CategoryId('category-2'), 'Business', 'Business related ideas'),
        new Category(new CategoryId('category-3'), 'Art', 'Art related ideas'),
        new Category(new CategoryId('category-4'), 'Science', 'Science related ideas'),
        new Category(new CategoryId('category-5'), 'Health', 'Health related ideas')
      ];
      
      // 生成创意
      if (count === 1) {
        const idea = await ideaGenerationService.generateIdea(command, categories);
        res.status(201).json({
          id: idea.id.toString(),
          title: idea.title,
          content: idea.content.toString(),
          categories: idea.categories.map(c => ({
            id: c.id.toString(),
            name: c.name
          })),
          tags: idea.tags.map(t => ({
            name: t.getName(),
            relevance: t.getRelevance()
          })),
          creationDate: idea.creationDate
        });
      } else {
        const ideas = await ideaGenerationService.generateMultipleIdeas(command, categories);
        res.status(201).json(ideas.map(idea => ({
          id: idea.id.toString(),
          title: idea.title,
          content: idea.content.toString(),
          categories: idea.categories.map(c => ({
            id: c.id.toString(),
            name: c.name
          })),
          tags: idea.tags.map(t => ({
            name: t.getName(),
            relevance: t.getRelevance()
          })),
          creationDate: idea.creationDate
        })));
      }
    } catch (error) {
      console.error('Error generating idea:', error);
      res.status(500).json({ error: 'Failed to generate idea' });
    }
  }

  /**
   * 获取创意列表
   * 
   * @param req - HTTP请求
   * @param res - HTTP响应
   */
  async getIdeas(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现获取创意列表
      res.status(200).json({ message: 'Not implemented yet' });
    } catch (error) {
      console.error('Error getting ideas:', error);
      res.status(500).json({ error: 'Failed to get ideas' });
    }
  }

  /**
   * 获取创意详情
   * 
   * @param req - HTTP请求
   * @param res - HTTP响应
   */
  async getIdeaById(req: Request, res: Response): Promise<void> {
    try {
      // TODO: 实现获取创意详情
      res.status(200).json({ message: 'Not implemented yet' });
    } catch (error) {
      console.error('Error getting idea:', error);
      res.status(500).json({ error: 'Failed to get idea' });
    }
  }
}

