import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';

import { initKeycloak } from './config/keycloak.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadTestRouter from './routes/uploadTest.js';

const app = express();

const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());

// Session per Keycloak
const memoryStore = new session.MemoryStore();

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    secure: false, // Metti true in produzione con HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 ore
  }
}));

// Inizializza Keycloak
const keycloak = initKeycloak(memoryStore);
app.use(keycloak.middleware());

// Routes
app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api', uploadTestRouter);

app.get('/', (req, res) => {
  res.send('Backend Express con Keycloak è attivo.');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server in ascolto sulla porta ${PORT}`);
  console.log(`CORS abilitato per: ${process.env.CLIENT_URL || 'http://localhost:4200'}`);
  console.log(`Keycloak URL: ${process.env.KEYCLOAK_URL}`);
  console.log(`Keycloak Realm: ${process.env.KEYCLOAK_REALM}`);
});