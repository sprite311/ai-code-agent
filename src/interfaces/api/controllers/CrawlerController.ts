import { Request, Response } from 'express';
import { CrawlerSchedulerService } from '../../../application/crawler/CrawlerSchedulerService';
import { ICrawlerTargetRepository } from '../../../domain/crawler/ICrawlerTargetRepository';
import { CrawlerTarget, CrawlerTargetType, CrawlerSelectors } from '../../../domain/crawler/CrawlerTarget';
import { v4 as uuidv4 } from 'uuid';

/**
 * 爬虫控制器
 * 
 * 处理爬虫相关的API请求
 */
export class CrawlerController {
  /**
   * 创建爬虫控制器
   * 
   * @param crawlerSchedulerService - 爬虫调度服务
   * @param crawlerTargetRepository - 爬虫目标仓储
   */
  constructor(
    private readonly crawlerSchedulerService: CrawlerSchedulerService,
    private readonly crawlerTargetRepository: ICrawlerTargetRepository
  ) {}

  /**
   * 获取所有爬虫目标
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getAllTargets(req: Request, res: Response): Promise<void> {
    try {
      const targets = await this.crawlerTargetRepository.findAll();
      res.json(targets);
    } catch (error) {
      console.error('Error getting crawler targets:', error);
      res.status(500).json({ error: 'Failed to get crawler targets' });
    }
  }

  /**
   * 获取爬虫目标
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async getTarget(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const target = await this.crawlerTargetRepository.findById(id);
      
      if (!target) {
        res.status(404).json({ error: 'Crawler target not found' });
        return;
      }
      
      res.json(target);
    } catch (error) {
      console.error('Error getting crawler target:', error);
      res.status(500).json({ error: 'Failed to get crawler target' });
    }
  }

  /**
   * 创建爬虫目标
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async createTarget(req: Request, res: Response): Promise<void> {
    try {
      const { url, name, type, selectors, priority, crawlFrequency } = req.body;
      
      // 验证必填字段
      if (!url || !name || !type || !selectors) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // 创建爬虫目标
      const target = new CrawlerTarget(
        uuidv4(),
        url,
        name,
        type as CrawlerTargetType,
        selectors as CrawlerSelectors,
        priority || 5,
        crawlFrequency || 24
      );
      
      // 保存爬虫目标
      const savedTarget = await this.crawlerTargetRepository.save(target);
      
      res.status(201).json(savedTarget);
    } catch (error) {
      console.error('Error creating crawler target:', error);
      res.status(500).json({ error: 'Failed to create crawler target' });
    }
  }

  /**
   * 更新爬虫目标
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async updateTarget(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { url, name, type, selectors, priority, crawlFrequency } = req.body;
      
      // 获取现有目标
      const existingTarget = await this.crawlerTargetRepository.findById(id);
      
      if (!existingTarget) {
        res.status(404).json({ error: 'Crawler target not found' });
        return;
      }
      
      // 创建更新后的目标
      const updatedTarget = new CrawlerTarget(
        id,
        url || existingTarget.url,
        name || existingTarget.name,
        type as CrawlerTargetType || existingTarget.type,
        selectors as CrawlerSelectors || existingTarget.selectors,
        priority || existingTarget.priority,
        crawlFrequency || existingTarget.crawlFrequency,
        existingTarget.lastCrawled
      );
      
      // 保存更新后的目标
      const savedTarget = await this.crawlerTargetRepository.save(updatedTarget);
      
      res.json(savedTarget);
    } catch (error) {
      console.error('Error updating crawler target:', error);
      res.status(500).json({ error: 'Failed to update crawler target' });
    }
  }

  /**
   * 删除爬虫目标
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async deleteTarget(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 删除目标
      const deleted = await this.crawlerTargetRepository.delete(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Crawler target not found' });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting crawler target:', error);
      res.status(500).json({ error: 'Failed to delete crawler target' });
    }
  }

  /**
   * 手动爬取目标
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async crawlTarget(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 手动爬取目标
      const result = await this.crawlerSchedulerService.crawlTargetManually(id);
      
      res.json(result);
    } catch (error) {
      console.error('Error crawling target:', error);
      res.status(500).json({ error: 'Failed to crawl target' });
    }
  }

  /**
   * 爬取URL
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async crawlUrl(req: Request, res: Response): Promise<void> {
    try {
      const { url, selectors } = req.body;
      
      // 验证必填字段
      if (!url || !selectors) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }
      
      // 爬取URL
      const result = await this.crawlerSchedulerService.crawlUrl(url, selectors);
      
      res.json(result);
    } catch (error) {
      console.error('Error crawling URL:', error);
      res.status(500).json({ error: 'Failed to crawl URL' });
    }
  }

  /**
   * 启动定时爬取
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async startScheduledCrawling(req: Request, res: Response): Promise<void> {
    try {
      const { intervalMinutes, targetsPerRun } = req.body;
      
      // 启动定时爬取
      this.crawlerSchedulerService.startScheduledCrawling(
        intervalMinutes || 60,
        targetsPerRun || 5
      );
      
      res.json({ message: 'Scheduled crawling started' });
    } catch (error) {
      console.error('Error starting scheduled crawling:', error);
      res.status(500).json({ error: 'Failed to start scheduled crawling' });
    }
  }

  /**
   * 停止定时爬取
   * 
   * @param req - 请求对象
   * @param res - 响应对象
   */
  async stopScheduledCrawling(req: Request, res: Response): Promise<void> {
    try {
      // 停止定时爬取
      this.crawlerSchedulerService.stopScheduledCrawling();
      
      res.json({ message: 'Scheduled crawling stopped' });
    } catch (error) {
      console.error('Error stopping scheduled crawling:', error);
      res.status(500).json({ error: 'Failed to stop scheduled crawling' });
    }
  }
}

