import { IncomingMessage, ServerResponse } from 'http';

export type AsyncHandler = (req: IncomingMessage, res: ServerResponse) => Promise<any>;

/**
 * Wraps an async route handler to provide consistent try/catch and response handling.
 * If the handler returns data and hasn't ended the response, it will be sent as JSON with 200 OK.
 * If an error is thrown, it will be sent as JSON with the error's status or 500.
 */
export const asyncHandler = (handler: AsyncHandler) => {
  return async (req: IncomingMessage, res: ServerResponse) => {
    try {
      const result = await handler(req, res);
      if (res.writableEnded) return;

      if (!res.headersSent) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
      }
      res.end(JSON.stringify(result));
    } catch (error: any) {
      console.error('Error handling request:', error);

      const status = error.status || 500;
      const responseBody = {
        message: error.message || 'Internal Server Error',
        ...(error.status ? { status: error.status } : {}),
        ...error
      };

      if (!res.writableEnded) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseBody));
      }
    }
  };
};
