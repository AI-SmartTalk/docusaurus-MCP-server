import { createServer } from "./server.js";

export { createServer };

// Example usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("Basic MCP Server");
  console.log("===============");
  console.log("");
  console.log("This is a basic MCP server implementation without session management.");
  console.log("");
  console.log("Usage:");
  console.log("  npm run stdio    - Start server with stdio transport");
  console.log("  npm run http     - Start server with HTTP transport");
  console.log("");
  console.log("Available tools:");
  console.log("  - echo: Echo back a message");
  console.log("  - add: Add two numbers together");
  console.log("");
  console.log("Available resources:");
  console.log("  - greeting://{name} - Dynamic greeting generator");
  console.log("  - info://server - Server information");
  console.log("");
  console.log("Available prompts:");
  console.log("  - welcome - Welcome message prompt");
} 