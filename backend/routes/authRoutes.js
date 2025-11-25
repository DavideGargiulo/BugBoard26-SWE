import { Router } from 'express';
const router = Router();

import { login, checkAuthStatus, logout } from '../controllers/authController.js';

// 1. POST /api/auth/login
// Riceve { email, password } dal frontend e comunica con Keycloak per ottenere i token
router.post('/login', login);

// 2. GET /api/auth/me
// Verifica lo stato di autenticazione leggendo i cookie httpOnly.
// Se l'access token è scaduto, il controller tenta automaticamente il refresh.
router.get('/me', checkAuthStatus);

// 3. POST /api/auth/logout
// Revoca il refresh token su Keycloak e cancella i cookie di sessione.
router.post('/logout', logout);

export default router;