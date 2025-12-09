import { Router } from 'express';
import { getAllProjects } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/projects - Recupera tutti i progetti
router.get('/', getAllProjects);

export default router;