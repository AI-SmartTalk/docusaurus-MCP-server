import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main() {
  console.error("Starting MCP server with stdio transport...");
  
  try {
    console.log("[DEBUG] Creating MCP server instance...");
    const server = createServer();
    console.log("[DEBUG] MCP server instance created:", server);

    console.log("[DEBUG] Creating StdioServerTransport instance...");
    const transport = new StdioServerTransport();
    console.log("[DEBUG] StdioServerTransport instance created:", transport);
    
    console.log("[DEBUG] Connecting server to transport...");
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