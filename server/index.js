import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';
import { createAuthRouter } from './routes/auth.js';
import { createTrackerRouter } from './routes/tracker.js';
import { ensurePatternHuntSeed } from './seedPatternHunt.js';
import { ensureGlobalContent } from './seedRoadmap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// Trust proxy so req.ip and rate limits are correct behind Render/Railway proxies.
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: config.isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS: only allow the configured origins (never "*").
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
}));

app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Global rate limit for all API requests.
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// Setup routes
const { router: authRouter, authenticate, requireRole } = createAuthRouter(prisma);
const trackerRouter = createTrackerRouter(prisma, authenticate, requireRole);

app.use('/api/auth', authRouter);
app.use('/api', trackerRouter);

// Serve client in production (built dist/).
if (config.isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath, { maxAge: '1d', index: false }));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Central error handler: never leak stack traces or secrets in production.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || (err.type === 'entity.too.large' ? 413 : 500);
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  });
});

const startServer = (portToTry) => {
  const server = app.listen(portToTry, async () => {
    try {
      await ensureGlobalContent(prisma);
    } catch (e) {
      console.error('Global seed error:', e);
    }
    try {
      await ensurePatternHuntSeed(prisma);
    } catch (e) {
      console.error('Pattern Hunt seed error:', e);
    }
    console.log(`DSA Tracker API Server running on port ${portToTry} (${config.isProd ? 'production' : 'development'})`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (config.isProd) {
        console.error(`Port ${portToTry} is already in use. Exiting.`);
        process.exit(1);
      }
      console.warn(`Port ${portToTry} already in use. Trying ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server startup error:', err);
      process.exit(1);
    }
  });
};

startServer(config.port);