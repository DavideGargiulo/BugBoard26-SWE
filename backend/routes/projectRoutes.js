import { Router } from 'express';
import { getAllProjects, createProject, deleteProject } from '../controllers/projectController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/projects
router.get('/', protect, getAllProjects);

// POST /api/projects
router.post('/', protect, checkRole('Amministratore'), createProject);

// DELETE /api/projects/:nome
router.delete('/:nome', protect, checkRole('Amministratore'), deleteProject);

export default router;