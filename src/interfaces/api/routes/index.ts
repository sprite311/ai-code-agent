import { Router } from 'express';
import ideaRoutes from './ideaRoutes';

const router = Router();

// API路由
router.use('/ideas', ideaRoutes);

// 健康检查
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;

