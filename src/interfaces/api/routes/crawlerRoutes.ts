import { Router } from 'express';
import { CrawlerController } from '../controllers/CrawlerController';
import { Container } from '../../../infrastructure/di/container';

const router = Router();
const container = Container.getInstance();

// 获取控制器实例
const crawlerController = new CrawlerController(
  container.resolve('crawlerSchedulerService'),
  container.resolve('crawlerTargetRepository')
);

// 爬虫目标路由
router.get('/targets', (req, res) => crawlerController.getAllTargets(req, res));
router.get('/targets/:id', (req, res) => crawlerController.getTarget(req, res));
router.post('/targets', (req, res) => crawlerController.createTarget(req, res));
router.put('/targets/:id', (req, res) => crawlerController.updateTarget(req, res));
router.delete('/targets/:id', (req, res) => crawlerController.deleteTarget(req, res));

// 爬取操作路由
router.post('/targets/:id/crawl', (req, res) => crawlerController.crawlTarget(req, res));
router.post('/crawl-url', (req, res) => crawlerController.crawlUrl(req, res));

// 定时爬取路由
router.post('/schedule/start', (req, res) => crawlerController.startScheduledCrawling(req, res));
router.post('/schedule/stop', (req, res) => crawlerController.stopScheduledCrawling(req, res));

export default router;

