import { Router } from 'express';
import { getAllUsers } from '../controllers/userController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';
import { deleteUser } from '../controllers/userController.js';

const router = Router();

// GET /api/users - Protetto da token
router.get('/', protect, getAllUsers);

// DELETE /api/users/:email - Protetto da token
router.delete('/:email', protect, checkRole('Amministratore'), deleteUser);

export default router;