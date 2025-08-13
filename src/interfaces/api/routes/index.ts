import { Router } from 'express';
import ideaRoutes from './ideaRoutes';
import crawlerRoutes from './crawlerRoutes';
import searchRoutes from './searchRoutes';

const router = Router();

// API路由
router.use('/ideas', ideaRoutes);
router.use('/crawler', crawlerRoutes);
router.use('/search', searchRoutes);

export default router;

