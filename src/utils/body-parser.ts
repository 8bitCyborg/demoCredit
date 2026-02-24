import { IncomingMessage } from 'http';

export async function getRequestBody(req: IncomingMessage): Promise<any> {
  const MAX_SIZE = 1024 * 1024 * 1024; // 1024 MB in bytes
  let currentSize = 0;

  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      currentSize += chunk.length;
      if (currentSize > MAX_SIZE) {
        req.destroy();
        reject(new Error('Payload too large: maximum size is 1024 MB'));
        return;
      }
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}
