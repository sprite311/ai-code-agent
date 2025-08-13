import { Router } from 'express';
import { IdeaController } from '../controllers/IdeaController';

const router = Router();
const ideaController = new IdeaController();

/**
 * @route POST /api/ideas/generate
 * @desc 生成创意
 * @access Public
 */
router.post('/generate', (req, res) => ideaController.generateIdea(req, res));

/**
 * @route GET /api/ideas
 * @desc 获取创意列表
 * @access Public
 */
router.get('/', (req, res) => ideaController.getIdeas(req, res));

/**
 * @route GET /api/ideas/:id
 * @desc 获取创意详情
 * @access Public
 */
router.get('/:id', (req, res) => ideaController.getIdeaById(req, res));

export default router;

