import * as http from 'http';
import { routeMap } from './utils/routes.js';

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  const { url, method } = req;
  try {
    const route = routeMap.get(`${method}:${url}`);
    if (route) {
      return await route.handler(req, res);
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
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
