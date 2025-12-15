import { Router } from 'express';
import { getCommentByIssueId, createComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploader } from '../data/local/multerStorage/uploader.js';

const router = Router();

// GET /api/comments/issue/:issueId
router.get('/issue/:issueId', getCommentByIssueId);

// POST /api/comments
// Body: testo, id_issue, attachments (file)
// Limite impostato a 5 file per commento (puoi cambiarlo)
router.post('/', protect, uploader.array('attachments', 3), createComment);

export default router;