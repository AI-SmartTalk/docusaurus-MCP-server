# Basic MCP Server

A basic Model Context Protocol (MCP) server implementation without session management, built with TypeScript and the MCP SDK.

## Features

This server provides a simple example of MCP capabilities including:

- **Tools**: Interactive functions that can be called by MCP clients
- **Resources**: Data sources that can be read by MCP clients  
- **Prompts**: Reusable prompt templates for LLM interactions

## Available Tools

- `echo` - Echoes back the provided message
- `add` - Adds two numbers together

## Available Resources

- `greeting://{name}` - Dynamic greeting generator
- `info://server` - Server information and metadata

## Available Prompts

- `welcome` - A welcome message prompt template

## Installation

```bash
npm install
```

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

## Development

```bash
# Build and run
npm run dev
```

## Architecture

The server is structured with:

- `src/server.ts` - Core server implementation with tools, resources, and prompts
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
make test-call-echo     # Test echo tool
make test-call-add      # Test add tool
make test-read-info     # Test reading info resource
make test-read-greeting # Test reading greeting resource
make test-get-prompt    # Test getting welcome prompt

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

### Using with MCP Inspector

1. Start the stdio server: `npm run stdio`
2. Connect MCP Inspector to the running server
3. Explore available tools, resources, and prompts

### HTTP Endpoints

When running the HTTP server:

- `GET /` - Server information
- `GET /health` - Health check
- `POST /mcp` - MCP protocol endpoint
- `GET /mcp` - Returns 405 (not supported in stateless mode)
- `DELETE /mcp` - Returns 405 (not supported in stateless mode)

## License

MIT 