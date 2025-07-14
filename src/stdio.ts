import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  console.error("Starting MCP server with stdio transport...");
  
  try {
    const server = createServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    console.error("MCP server connected and running on stdio");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 