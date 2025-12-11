import { Router } from 'express';
import { getAllIssues, getIssuesByProject, createIssue, updateIssue } from '../controllers/issueController.js';
import { uploader } from '../data/local/multerStorage/uploader.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { canModifyIssue } from '../middleware/issueOwnershipMiddleware.js';

const router = Router();

// GET /api/issues - Tutte le issue
router.get('/', getAllIssues);

// GET /api/issues/project/:projectName - Issue di un progetto specifico
router.get('/project/:projectName', getIssuesByProject);

// POST /api/issues - Crea una nuova issue
router.post('/', protect, checkRole("Amministratore"), uploader.array('images', 3), createIssue);

// PUT /api/issues/:id - Modifica un'issue (amministratori o creatore)
router.put('/:id', protect, canModifyIssue, updateIssue);

export default router;