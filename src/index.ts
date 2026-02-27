import * as http from 'http';
import { routeMap } from './utils/routes.js';
import { jwtGuard } from './jwt/jwtGuard.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const { url, method } = req;
  const allowedOrigins = ['http://localhost:5173', 'https://democredit.netlify.app'];
  const origin: any = req.headers.origin;

  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  };

  try {
    const route = routeMap.get(`${method}:${url}`);
    if (route) {
      if (!route.isPublic) {
        await jwtGuard(req as any);
      }
      const result = await route.handler(req, res);
      if (!res.writableEnded) { //incase the write stream is not ended.
        res.end(result ? JSON.stringify(result) : undefined);
      }
      return;
    }

    // Default /api route (health check) or root
    if ((url === '/api') && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Wallet Service MVP is running',
        version: '1.0.0'
      }));
      return;
    }

    // 404 handler
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));

  } catch (error) {
    console.error('Request error:', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
