import { Request, Response } from 'express';
import { ElasticsearchService, AdvancedSearchOptions } from '../../../infrastructure/search/ElasticsearchService';
import { IIdeaRepository } from '../../../domain/idea/IIdeaRepository';
import { IdeaId } from '../../../domain/idea/IdeaId';

/**
 * 搜索控制器
 * 
 * 处理搜索相关的API请求
 */
export class SearchController {
  /**
   * 创建搜索控制器
   * 
   * @param elasticsearchService - Elasticsearch服务
   * @param ideaRepository - 创意仓储
   */
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly ideaRepository: IIdeaRepository
  ) {}

  /**
   * 搜索创意
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async search(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit, offset } = req.query;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }
      
      const results = await this.elasticsearchService.search(
        query,
        limit ? parseInt(limit as string) : undefined,
        offset ? parseInt(offset as string) : undefined
      );
      
      res.json(results);
    } catch (error) {
      console.error('Error searching ideas:', error);
      res.status(500).json({ error: 'Failed to search ideas' });
    }
  }

  /**
   * 高级搜索
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async advancedSearch(req: Request, res: Response): Promise<void> {
    try {
      const { 
        query, 
        tags, 
        categories, 
        sourceTypes, 
        dateFrom, 
        dateTo, 
        limit, 
        offset 
      } = req.body;
      
      // 构建搜索选项
      const options: AdvancedSearchOptions = {
        query,
        tags: Array.isArray(tags) ? tags : undefined,
        categories: Array.isArray(categories) ? categories : undefined,
        sourceTypes: Array.isArray(sourceTypes) ? sourceTypes : undefined,
        dateFrom: dateFrom ? new Date(dateFrom) : undefined,
        dateTo: dateTo ? new Date(dateTo) : undefined,
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined
      };
      
      const results = await this.elasticsearchService.advancedSearch(options);
      
      res.json(results);
    } catch (error) {
      console.error('Error performing advanced search:', error);
      res.status(500).json({ error: 'Failed to perform advanced search' });
    }
  }

  /**
   * 获取相似创意
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getSimilarIdeas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit } = req.query;
      
      const ideaId = new IdeaId(id);
      
      // 检查创意是否存在
      const idea = await this.ideaRepository.findById(ideaId);
      
      if (!idea) {
        res.status(404).json({ error: 'Idea not found' });
        return;
      }
      
      const similarIdeas = await this.elasticsearchService.getSimilarIdeas(
        ideaId,
        limit ? parseInt(limit as string) : undefined
      );
      
      res.json(similarIdeas);
    } catch (error) {
      console.error('Error getting similar ideas:', error);
      res.status(500).json({ error: 'Failed to get similar ideas' });
    }
  }

  /**
   * 重建索引
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async rebuildIndex(req: Request, res: Response): Promise<void> {
    try {
      // 初始化索引
      await this.elasticsearchService.initIndex();
      
      // 获取所有创意
      const ideas = await this.ideaRepository.findAll();
      
      // 批量索引创意
      await this.elasticsearchService.bulkIndexIdeas(ideas);
      
      res.json({ 
        message: 'Index rebuilt successfully', 
        indexedCount: ideas.length 
      });
    } catch (error) {
      console.error('Error rebuilding index:', error);
      res.status(500).json({ error: 'Failed to rebuild index' });
    }
  }
}

