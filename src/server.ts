import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { 
  createDocument, 
  updateDocument, 
  continueDocument, 
  getDocumentContent, 
  getUnfinishedDocuments,
  syncDocuments 
} from './document-manager.js';
import { vectorStore } from './vector-store.js';
import { generateSitemap } from './sitemap.js';
import { applyStyle, getAvailableStyles } from './styles.js';
import { metricsService } from './metrics.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: "docusaurus-mcp-server",
    version: "1.0.0"
  });

  // Health check tool
  server.registerTool(
    "health_check",
    {
      title: "Health Check",
      description: "Check if the service is up and running",
      inputSchema: {}
    },
    async () => {
      metricsService.incrementRequests();
      const health = metricsService.getHealth();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(health, null, 2)
        }]
      };
    }
  );

  // Metrics tool
  server.registerTool(
    "metrics",
    {
      title: "Service Metrics",
      description: "Return metrics for the service in Grafana/Prometheus-compatible format",
      inputSchema: {}
    },
    async () => {
      metricsService.incrementRequests();
      const metrics = metricsService.getMetrics();
      return {
        content: [{
          type: "text",
          text: JSON.stringify(metrics, null, 2)
        }]
      };
    }
  );

  // Create document tool
  server.registerTool(
    "create_document",
    {
      title: "Create Document",
      description: "Create a new documentation entry",
      inputSchema: {
        path: z.string().describe("The path where the document should be created"),
        title: z.string().describe("The title of the document"),
        content: z.string().describe("The content of the document"),
        mark_incomplete: z.boolean().optional().describe("Whether to mark the document as incomplete")
      }
    },
    async ({ path, title, content, mark_incomplete = true }) => {
      metricsService.incrementRequests();
      try {
        const fullContent = `# ${title}\n\n${content}`;
        const result = await createDocument(path, fullContent, mark_incomplete);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error creating document: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Update document tool
  server.registerTool(
    "update_docs",
    {
      title: "Update Document",
      description: "Update a document at the given position",
      inputSchema: {
        path: z.string().describe("The path of the document to update"),
        line_begin: z.number().describe("Starting line number (0-based)"),
        line_end: z.number().describe("Ending line number (0-based)"),
        new_text: z.string().describe("New text to replace the specified lines")
      }
    },
    async ({ path, line_begin, line_end, new_text }) => {
      metricsService.incrementRequests();
      try {
        const result = await updateDocument(path, line_begin, line_end, new_text);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error updating document: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Continue document tool
  server.registerTool(
    "continue_docs",
    {
      title: "Continue Document",
      description: "Continue writing the document at end",
      inputSchema: {
        path: z.string().describe("The path of the document to continue"),
        continuation: z.string().describe("Content to append to the document")
      }
    },
    async ({ path, continuation }) => {
      metricsService.incrementRequests();
      try {
        const result = await continueDocument(path, continuation);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error continuing document: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get document tool
  server.registerTool(
    "get_docs",
    {
      title: "Get Document",
      description: "Get the content of a document at a given path",
      inputSchema: {
        path: z.string().describe("The path of the document to retrieve")
      }
    },
    async ({ path }) => {
      metricsService.incrementRequests();
      try {
        const content = await getDocumentContent(path);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ path, content }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting document: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get unfinished documents tool
  server.registerTool(
    "unfinished_docs",
    {
      title: "Unfinished Documents",
      description: "Get all the unfinished documents",
      inputSchema: {}
    },
    async () => {
      metricsService.incrementRequests();
      try {
        const unfinished = await getUnfinishedDocuments();
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ unfinished }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error getting unfinished documents: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Search documents tool
  server.registerTool(
    "search_docs",
    {
      title: "Search Documents",
      description: "Search knowledge in documentation embeddings",
      inputSchema: {
        query: z.string().describe("The search query"),
        top_k: z.number().optional().describe("Number of top results to return (default: 5)")
      }
    },
    async ({ query, top_k = 5 }) => {
      metricsService.incrementRequests();
      try {
        const results = await vectorStore.search(query, top_k);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ query, results }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error searching documents: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get sitemap tool
  server.registerTool(
    "get_sitemap",
    {
      title: "Get Sitemap",
      description: "Retrieve sitemap of the documentation structure",
      inputSchema: {}
    },
    async () => {
      metricsService.incrementRequests();
      try {
        const sitemap = await generateSitemap();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(sitemap, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error generating sitemap: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Apply style tool
  server.registerTool(
    "apply_style",
    {
      title: "Apply Style",
      description: "Apply style transformation to a document",
      inputSchema: {
        style_id: z.string().describe("The style ID to apply"),
        content: z.string().describe("The content to transform")
      }
    },
    async ({ style_id, content }) => {
      metricsService.incrementRequests();
      try {
        const result = applyStyle(style_id, content);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error applying style: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Sync documents tool
  server.registerTool(
    "sync_docs",
    {
      title: "Sync Documents",
      description: "Sync all documents in the docs directory to the vector store",
      inputSchema: {}
    },
    async () => {
      metricsService.incrementRequests();
      try {
        const result = await syncDocuments();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error syncing documents: ${error instanceof Error ? error.message : String(error)}`
          }]
        };
      }
    }
  );

  // Get available styles tool
  server.registerTool(
    "get_styles",
    {
      title: "Get Available Styles",
      description: "Get list of available style transformations",
      inputSchema: {}
    },
    async () => {
      metricsService.incrementRequests();
      const styles = getAvailableStyles();
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ available_styles: styles }, null, 2)
        }]
      };
    }
  );

  return server;
} 