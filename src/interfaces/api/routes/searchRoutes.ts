import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { Container } from '../../../infrastructure/di/container';

const router = Router();
const container = Container.getInstance();

// 获取控制器实例
const searchController = new SearchController(
  container.resolve('elasticsearchService'),
  container.resolve('ideaRepository')
);

// 搜索路由
router.get('/', (req, res) => searchController.search(req, res));
router.post('/advanced', (req, res) => searchController.advancedSearch(req, res));
router.get('/similar/:id', (req, res) => searchController.getSimilarIdeas(req, res));
router.post('/rebuild-index', (req, res) => searchController.rebuildIndex(req, res));

export default router;

