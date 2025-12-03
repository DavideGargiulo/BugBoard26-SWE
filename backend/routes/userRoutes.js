import { Router } from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/users - Protetto da token
router.get('/', protect, getAllUsers);

export default router;