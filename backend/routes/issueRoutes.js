import { Router } from 'express';
import { getAllIssues, getIssuesByProject, createIssue, updateIssue } from '../controllers/issueController.js';
import { uploadImages } from '../middleware/uploaderMiddleware.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { canModifyIssue } from '../middleware/issueOwnershipMiddleware.js';

const router = Router();

// GET /api/issues
router.get('/', protect, getAllIssues);

// GET /api/issues/project/:projectName
router.get('/project/:projectName', protect, getIssuesByProject);

// POST /api/issues
// Crea una nuova issue (solo Amministratori)
router.post('/', protect, checkRole('Amministratore'), uploadImages, createIssue);

// PUT /api/issues/:id
// Modifica un'issue (amministratori o creatore)
router.put('/:id', protect, canModifyIssue, updateIssue);

export default router;