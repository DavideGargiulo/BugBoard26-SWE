import { Router } from 'express';
import { getAllProjects, createProject } from '../controllers/projectController.js';
// Aggiungi extractTokenFromCookie agli import
import { protect, checkRole, extractTokenFromCookie } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/projects
router.get('/', getAllProjects);

// POST /api/projects
router.post('/', protect, checkRole('Amministratore'), createProject);

export default router;