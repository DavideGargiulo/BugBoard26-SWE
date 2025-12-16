import { Router } from 'express';
import { getAllUsers, deleteUser } from '../controllers/userController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/users
router.get('/', protect, getAllUsers);

// DELETE /api/users/:email
// Elimina un utente (solo Amministratori)
router.delete('/:email', protect, checkRole('Amministratore'), deleteUser);

export default router;