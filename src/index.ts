import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import { routes } from './utils/routes.js';
import { jwtGuard } from './jwt/jwtGuard.js';
import { limiter } from './utils/rate-limiter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Multer Configuration: Memory storage as requested
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'https://democredit.netlify.app'],
  credentials: true
}));
app.use(cookieParser());

// Rate Limiter Middleware
app.use(async (req: any, res: any, next: any) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'global';
  try {
    await limiter.consume(ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many requests'
    });
  }
});

// Health check
app.get('/api', (req: any, res: any) => {
  res.json({
    message: 'Wallet Service MVP is running',
    version: '1.0.0'
  });
});

// Register Application Routes
routes.forEach(route => {
  const middlewares: any[] = [];

  // Authentication Guard
  if (!route.isPublic) {
    middlewares.push(async (req: any, res: any, next: any) => {
      try {
        await jwtGuard(req);
        next();
      } catch (e: any) {
        res.status(e.status || 401).json({
          error: e.message || 'Unauthorized'
        });
      }
    });
  }

  // Multer File Handling for Loans Application
  if (route.path === '/api/loans/apply') {
    middlewares.push(upload.single('bankStatement'));
  }

  const method = route.method.toLowerCase() as 'get' | 'post' | 'put' | 'delete' | 'patch';

  (app as any)[method](route.path, ...middlewares, async (req: express.Request, res: express.Response) => {
    try {
      const result = await route.handler(req as any, res as any);
      if (!res.writableEnded) {
        res.json(result);
      }
    } catch (error: any) {
      console.error(`Route error [${route.method} ${route.path}]:`, error);
      if (!res.headersSent) {
        res.status(error.status || 500).json({
          error: error.message || 'Internal Server Error'
        });
      }
    }
  });
});

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
