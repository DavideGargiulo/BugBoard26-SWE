import { Router } from 'express';
const router = Router();

import { login, checkAuthStatus, logout } from '../controllers/authController.js';

// 1. POST /api/auth/login
// Riceve { username, password } da Angular e parla con Authentik
router.post('/login', login);

// 2. GET /api/auth/me
// Verifica se il cookie di sessione è valido e restituisce i dati dell'utente.
router.get('/me', checkAuthStatus);

// 3. POST /api/auth/logout
// Cancella il cookie di sessione.
router.post('/logout', logout);

export default router;