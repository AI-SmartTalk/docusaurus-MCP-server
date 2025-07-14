import express, { Request, Response, NextFunction } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const app = express();
app.use(express.json());

console.log("Express app initialized. Setting up middleware and routes...");

// Enable CORS for browser-based clients
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[CORS Middleware] ${req.method} ${req.url}`);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  
  if (req.method === 'OPTIONS') {
    console.log('[CORS Middleware] Responding to OPTIONS preflight');
    return res.sendStatus(200);
  }
  next();
});

app.post('/mcp', async (req: Request, res: Response) => {
  console.log('---');
  console.log('Received MCP POST request');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('---');
  
  try {
    // Create a new instance for each request in stateless mode
    console.log('[POST /mcp] Creating server instance...');
    const server = createServer();
    console.log('[POST /mcp] Creating StreamableHTTPServerTransport...');
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // No session management
    });
    
    // Clean up when request closes
    res.on('close', () => {
      console.log('[POST /mcp] Request closed by client or finished.');
      console.log('[POST /mcp] Closing transport and server...');
      transport.close();
      server.close();
    });
    
    console.log('[POST /mcp] Connecting server to transport...');
    await server.connect(transport);
    console.log('[POST /mcp] Handling request with transport...');
    await transport.handleRequest(req, res, req.body);
    console.log('[POST /mcp] Request handled successfully.');
  } catch (error) {
    console.error('[POST /mcp] Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
      console.log('[POST /mcp] Sent 500 Internal Server Error response.');
    } else {
      console.log('[POST /mcp] Response headers already sent, cannot send error response.');
    }
  }
});

// SSE notifications not supported in stateless mode
app.get('/mcp', async (req: Request, res: Response) => {
  console.log('---');
  console.log('Received GET MCP request');
  console.log('Headers:', req.headers);
  console.log('Query:', req.query);
  console.log('---');
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed in stateless mode."
    },
    id: null
  });
  console.log('[GET /mcp] Responded with 405 Method Not Allowed.');
});

// Session termination not needed in stateless mode
app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('---');
  console.log('Received DELETE MCP request');
  console.log('Headers:', req.headers);
  console.log('---');
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed in stateless mode."
    },
    id: null
  });
  console.log('[DELETE /mcp] Responded with 405 Method Not Allowed.');
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  console.log('Received health check request');
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'basic-mcp-server',
    version: '1.0.0'
  };
  res.json(health);
  console.log('Responded to /health:', health);
});

// Root endpoint with server info
app.get('/', (req: Request, res: Response) => {
  console.log('Received request for root endpoint /');
  const info = {
    name: 'basic-mcp-server',
    version: '1.0.0',
    description: 'A basic MCP server without session management',
    transport: 'stateless-http',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    }
  };
  res.json(info);
  console.log('Responded to / with server info:', info);
});

const HOST = process.env.HOST || '0.0.0.0';
const PORT = parseInt(process.env.PORT || '3223', 10);

console.log(`About to start server on ${HOST}:${PORT}...`);
app.listen(PORT, HOST, () => {
  console.log(`MCP Stateless HTTP Server listening on ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Server info: http://${HOST}:${PORT}/`);
  console.log(`MCP endpoint: http://${HOST}:${PORT}/mcp`);
  console.log('Server started successfully.');
}); 