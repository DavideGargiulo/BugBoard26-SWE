import { Router } from 'express';
import { getAllIssues, getIssuesByProject, createIssue, updateIssue, getIssueById } from '../controllers/issueController.js';
import { uploadImages } from '../middleware/uploaderMiddleware.js';
import { protect } from '../middleware/authMiddleware.js';
import { canModifyIssue } from '../middleware/issueOwnershipMiddleware.js';

const router = Router();

// GET /api/issues
router.get('/', protect, getAllIssues);

// GET /api/issues/project/:projectName
router.get('/project/:projectName', protect, getIssuesByProject);

// POST /api/issues
// Crea una nuova issue (solo Amministratori)
router.post('/', protect, uploadImages, createIssue);

// PUT /api/issues/:id
// Modifica un'issue (amministratori o creatore)
router.put('/:id', protect, canModifyIssue, updateIssue);

// GET /api/issues/:id
router.get('/:id', protect, getIssueById);

export default router;