import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "basic-mcp-server",
    version: "1.0.0"
  });

  // Register a simple echo tool
  server.registerTool(
    "echo",
    {
      title: "Echo Tool",
      description: "Echoes back the provided message",
      inputSchema: {
        message: z.string().describe("The message to echo back")
      }
    },
    async ({ message }) => ({
      content: [{
        type: "text",
        text: `Echo: ${message}`
      }]
    })
  );

  // Register a calculator tool
  server.registerTool(
    "add",
    {
      title: "Addition Calculator",
      description: "Add two numbers together",
      inputSchema: {
        a: z.number().describe("First number"),
        b: z.number().describe("Second number")
      }
    },
    async ({ a, b }) => ({
      content: [{
        type: "text",
        text: `${a} + ${b} = ${a + b}`
      }]
    })
  );

  // Register a greeting resource
  server.registerResource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    {
      title: "Greeting Resource",
      description: "Dynamic greeting generator"
    },
    async (uri, { name }) => ({
      contents: [{
        uri: uri.href,
        text: `Hello, ${name}! Welcome to the basic MCP server.`,
        mimeType: "text/plain"
      }]
    })
  );

  // Register a static info resource
  server.registerResource(
    "info",
    "info://server",
    {
      title: "Server Information",
      description: "Basic information about this MCP server",
      mimeType: "application/json"
    },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: JSON.stringify({
          name: "basic-mcp-server",
          version: "1.0.0",
          description: "A basic MCP server implementation",
          capabilities: ["tools", "resources", "prompts"],
          created: new Date().toISOString()
        }, null, 2),
        mimeType: "application/json"
      }]
    })
  );

  // Register a simple prompt
  server.registerPrompt(
    "welcome",
    {
      title: "Welcome Prompt",
      description: "A welcome message prompt",
      argsSchema: {
        name: z.string().describe("The name to welcome")
      }
    },
    ({ name }) => ({
      messages: [{
        role: "assistant",
        content: {
          type: "text",
          text: `Welcome to our MCP server, ${name}! I'm here to help you explore the available tools and resources.`
        }
      }]
    })
  );

  return server;
} 