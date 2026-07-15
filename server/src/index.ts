import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api';
import { initDatabase } from './prisma/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    if (
      origin.startsWith('http://localhost:') || 
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('vercel.app') ||
      origin.includes('apticode')
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());

// Mount the modular routes under /api
app.use('/api', apiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString()
  });
});

// Initialize database dynamically and start listener
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`[Server] AptiCode secure API gateway listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('[Server] Critical Database Initialization Error:', err);
  app.listen(PORT, () => {
    console.log(`[Server] AptiCode secure API gateway listening on http://localhost:${PORT} (Database offline fallback)`);
  });
});
