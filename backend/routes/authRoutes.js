import { Router } from 'express';
const router = Router();

import { login, checkAuthStatus, logout, register } from '../controllers/authController.js';
import { protect, checkRole } from '../middleware/authMiddleware.js';

// 1. POST /api/auth/login
// Riceve { email, password } dal frontend e comunica con Keycloak per ottenere i token
router.post('/login', login);

// 2. GET /api/auth/me
// Verifica lo stato di autenticazione con token JWT verificato
router.get('/me', protect, checkAuthStatus);

// 3. POST /api/auth/logout
// Revoca il refresh token su Keycloak e cancella i cookie di sessione
router.post('/logout', protect, logout);

// 4. POST /api/auth/register
// Solo un amministratore può creare nuovi utenti
router.post('/register', protect, checkRole('Amministratore'), register);

export default router;