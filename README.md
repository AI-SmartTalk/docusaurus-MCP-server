# Docusaurus MCP Server

A comprehensive Model Context Protocol (MCP) server for Docusaurus documentation management, built with TypeScript and the MCP SDK. This server provides the same functionality as the Python MCP-Docusaurus application.

## Features

This server provides comprehensive documentation management capabilities including:

- **Document Management**: Create, read, update, and continue writing documentation
- **Vector Search**: Semantic search across documentation using embeddings
- **Sitemap Generation**: Hierarchical view of documentation structure
- **Style Transformations**: Apply various formatting styles to content
- **Health Monitoring**: Service health checks and metrics
- **Incomplete Document Tracking**: Track and manage unfinished documentation

## Available Tools

### Document Management
- `create_document` - Create a new documentation entry with title and content
- `update_docs` - Update specific lines in an existing document
- `continue_docs` - Append content to a document and remove incomplete markers
- `get_docs` - Retrieve the content of a document by path
- `unfinished_docs` - List all documents marked as incomplete

### Search & Discovery
- `search_docs` - Perform semantic search across documentation embeddings
- `get_sitemap` - Generate a hierarchical view of the documentation structure

### Content Transformation
- `apply_style` - Apply style transformations to markdown content
- `get_styles` - List available style transformations

### System Management
- `health_check` - Check service health and status
- `metrics` - Get service metrics (uptime, requests, document count)
- `sync_docs` - Sync all documents in the docs directory to the vector store

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

- `DOCS_DIR` - Path to the Docusaurus docs directory (default: `../aismarttalk-docs/docs`)
- `OPENAI_API_KEY` - OpenAI API key for embeddings (optional, falls back to simple text features)

## Building

```bash
npm run build
```

## Running the Server

### Option 1: stdio Transport

For command-line integration and testing:

```bash
npm run stdio
```

This starts the server using stdin/stdout for communication, suitable for:
- Command-line MCP clients
- Development and testing
- Integration with tools that support stdio

### Option 2: Stateless HTTP Transport

For web-based integration:

```bash
npm run http
```

This starts the server on port 3000 (or PORT environment variable) with:
- RESTful HTTP endpoint at `/mcp`
- Health check at `/health`
- Server info at `/`
- CORS enabled for browser clients
- No session management (stateless)

## Embeddings

The server supports two embedding approaches:

1. **OpenAI Embeddings** (Recommended): 
   - Set `OPENAI_API_KEY` environment variable
   - Uses `text-embedding-ada-002` model
   - High-quality semantic search

2. **Simple Text Features** (Fallback):
   - Used when OpenAI API key is not available
   - Basic word frequency and position features
   - Still provides reasonable search functionality

## Available Style Transformations

- `bold_headers` - Make all headers bold
- `add_spacing` - Add extra spacing between lines
- `remove_comments` - Remove HTML comments from content
- `clean_whitespace` - Clean up trailing whitespace and normalize newlines
- `add_toc` - Generate and add a table of contents
- `format_code_blocks` - Clean up code block formatting
- `highlight_notes` - Highlight Note/Warning/Important sections

## Development

```bash
# Build and run
npm run dev
```

## Architecture

The server is structured with:

- `src/server.ts` - Core server implementation with all tools
- `src/types.ts` - TypeScript type definitions
- `src/embeddings.ts` - Embedding generation (OpenAI + fallback)
- `src/vector-store.ts` - In-memory vector storage and search
- `src/document-manager.ts` - File system operations and document management
- `src/sitemap.ts` - Documentation structure generation
- `src/styles.ts` - Content style transformations
- `src/metrics.ts` - Health monitoring and metrics
- `src/stdio.ts` - stdio transport implementation  
- `src/http.ts` - Stateless HTTP transport implementation
- `src/index.ts` - Main entry point and exports

## Transport Details

### stdio Transport
- Uses standard input/output for communication
- Suitable for CLI tools and direct integration
- No network dependencies

### Stateless HTTP Transport  
- Each request creates a new server instance
- No session state maintained between requests
- Suitable for horizontally scalable deployments
- CORS-enabled for browser clients

## Testing

### Using the Makefile

The project includes a comprehensive Makefile for testing the HTTP server. 

**Requirements**: `curl`, `jq`, and a bash shell.

**Note**: The MCP server uses Server-Sent Events (SSE) format for responses, which requires a special parser script that's automatically generated.

```bash
# See all available commands
make help

# Build and start server for testing
make build
make start-http

# Run all tests
make test-all

# Test individual endpoints
make test-info          # Test GET / endpoint
make test-health        # Test GET /health endpoint  
make test-mcp-init      # Test MCP initialization
make test-list-tools    # Test listing tools
make test-search-docs   # Test document search
make test-create-doc    # Test document creation
make test-get-sitemap   # Test sitemap generation
make test-health-check  # Test health check tool
make test-metrics       # Test metrics tool

# Test error handling
make test-error-handling
make test-invalid-methods

# Run a proper MCP client sequence
make test-sequence

# Performance testing
make test-performance

# Clean up
make stop-server
make clean
```

### Quick Demo

For a complete demonstration of all features:

```bash
./demo.sh
```

This script will build the project, start the server, run various tests, and clean up automatically.

### Manual Testing

You can also test the server using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) or by implementing a simple MCP client.

## Example Usage

### Document Management Workflow

1. **Create a new document**:
   ```json
   {
     "tool": "create_document",
     "arguments": {
       "path": "api/new-endpoint.md",
       "title": "New API Endpoint",
       "content": "This endpoint provides...",
       "mark_incomplete": true
     }
   }
   ```

2. **Search for related content**:
   ```json
   {
     "tool": "search_docs",
     "arguments": {
       "query": "API authentication methods",
       "top_k": 5
     }
   }
   ```

3. **Continue writing the document**:
   ```json
   {
     "tool": "continue_docs",
     "arguments": {
       "path": "api/new-endpoint.md",
       "continuation": "## Authentication\n\nThis endpoint requires..."
     }
   }
   ```

4. **Apply style transformations**:
   ```json
   {
     "tool": "apply_style",
     "arguments": {
       "style_id": "add_toc",
       "content": "# My Document\n\n## Section 1..."
     }
   }
   ```

### HTTP Endpoints

When running the HTTP server:

- `GET /` - Server information
- `GET /health` - Health check
- `POST /mcp` - MCP protocol endpoint
- `GET /mcp` - Returns 405 (not supported in stateless mode)
- `DELETE /mcp` - Returns 405 (not supported in stateless mode)

## Comparison with Python Version

This TypeScript implementation provides the same functionality as the Python MCP-Docusaurus application:

| Feature | Python Version | TypeScript Version |
|---------|---------------|-------------------|
| Document CRUD | ✅ FastAPI + SQLAlchemy | ✅ fs-extra + vector store |
| Vector Search | ✅ PostgreSQL + pgvector | ✅ In-memory + cosine similarity |
| Embeddings | ✅ sentence-transformers | ✅ OpenAI API + fallback |
| Health/Metrics | ✅ FastAPI endpoints | ✅ MCP tools |
| Style Transforms | ✅ Python functions | ✅ TypeScript functions |
| Sitemap Generation | ✅ File system traversal | ✅ File system traversal |

## License

MIT 