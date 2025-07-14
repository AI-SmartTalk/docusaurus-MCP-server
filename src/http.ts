import express, { Request, Response, NextFunction } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

const app = express();
app.use(express.json());

// Enable CORS for browser-based clients
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id');
  res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/mcp', async (req: Request, res: Response) => {
  console.log('Received MCP POST request');
  
  try {
    // Create a new instance for each request in stateless mode
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // No session management
    });
    
    // Clean up when request closes
    res.on('close', () => {
      console.log('Request closed');
      transport.close();
      server.close();
    });
    
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  }
});

// SSE notifications not supported in stateless mode
app.get('/mcp', async (req: Request, res: Response) => {
  console.log('Received GET MCP request');
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed in stateless mode."
    },
    id: null
  });
});

// Session termination not needed in stateless mode
app.delete('/mcp', async (req: Request, res: Response) => {
  console.log('Received DELETE MCP request');
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed in stateless mode."
    },
    id: null
  });
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'basic-mcp-server',
    version: '1.0.0'
  });
});

// Root endpoint with server info
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'basic-mcp-server',
    version: '1.0.0',
    description: 'A basic MCP server without session management',
    transport: 'stateless-http',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    }
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MCP Stateless HTTP Server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Server info: http://localhost:${PORT}/`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
}); 