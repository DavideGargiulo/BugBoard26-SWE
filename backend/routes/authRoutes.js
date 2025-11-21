import express from 'express';
import {
    login,
    callback,
    logout,
    me
} from '../controllers/authController.js';

const router = express.Router();

// GET /api/auth/login -> Reindirizza l'utente su Authentik
router.get('/login', login);

// GET /api/auth/callback -> Authentik ci rimanda qui con il codice
router.get('/callback', callback);

// GET /api/auth/me -> Il frontend chiama questo per sapere chi è loggato
router.get('/me',QAme);

// POST /api/auth/logout -> Distrugge la sessione
router.post('/logout', logout);

export default router;