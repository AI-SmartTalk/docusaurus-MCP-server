# Makefile for testing the MCP HTTP server
# Usage: make <target>

# Server configuration
SERVER_URL = http://localhost:3000
MCP_ENDPOINT = $(SERVER_URL)/mcp

.PHONY: help build start-http test-all test-info test-health test-mcp-init test-list-tools test-list-resources test-list-prompts test-call-echo test-call-add test-read-info test-read-greeting test-get-prompt test-invalid-methods

help: ## Show this help message
	@echo "Available commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the TypeScript project
	npm run build

start-http: ## Start the HTTP server in background
	@echo "Starting HTTP server..."
	npm run http 
	@echo "Server PID: $$!"
	@echo "Waiting for server to start..."
	@sleep 2

stop-http: ## Stop the HTTP server
	@echo "Stopping HTTP server..."
	npm run stop

test-all: test-info test-health test-mcp-init test-list-tools test-list-resources test-list-prompts test-call-echo test-call-add test-read-info test-read-greeting test-get-prompt test-invalid-methods ## Run all tests

test-info: ## Test GET / endpoint
	@echo "\n=== Testing Server Info ==="
	curl -s -X GET $(SERVER_URL)/ | jq .

test-health: ## Test GET /health endpoint
	@echo "\n=== Testing Health Check ==="
	curl -s -X GET $(SERVER_URL)/health | jq .

test-mcp-init: ## Test MCP initialization
	@echo "\n=== Testing MCP Initialization ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"roots":{"listChanged":true},"sampling":{}},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' | ./parse-sse.sh | jq .

test-list-tools: ## Test listing available tools
	@echo "\n=== Testing List Tools ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | ./parse-sse.sh | jq .

test-list-resources: ## Test listing available resources
	@echo "\n=== Testing List Resources ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":3,"method":"resources/list","params":{}}' | ./parse-sse.sh | jq .

test-list-prompts: ## Test listing available prompts
	@echo "\n=== Testing List Prompts ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":4,"method":"prompts/list","params":{}}' | ./parse-sse.sh | jq .

test-call-echo: ## Test calling the echo tool
	@echo "\n=== Testing Echo Tool ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello from Makefile test!"}}}' | ./parse-sse.sh | jq .

test-call-add: ## Test calling the add tool
	@echo "\n=== Testing Add Tool ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"add","arguments":{"a":42,"b":58}}}' | ./parse-sse.sh | jq .

test-read-info: ## Test reading the info resource
	@echo "\n=== Testing Read Info Resource ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":7,"method":"resources/read","params":{"uri":"info://server"}}' | ./parse-sse.sh | jq .

test-read-greeting: ## Test reading a greeting resource
	@echo "\n=== Testing Read Greeting Resource ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":8,"method":"resources/read","params":{"uri":"greeting://World"}}' | ./parse-sse.sh | jq .

test-get-prompt: ## Test getting a prompt
	@echo "\n=== Testing Get Welcome Prompt ==="
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":9,"method":"prompts/get","params":{"name":"welcome","arguments":{"name":"Tester"}}}' | ./parse-sse.sh | jq .

test-invalid-methods: ## Test invalid HTTP methods on MCP endpoint
	@echo "\n=== Testing Invalid Methods ==="
	@echo "Testing GET /mcp (should return 405):"
	curl -s -X GET $(MCP_ENDPOINT) | jq .
	@echo "\nTesting DELETE /mcp (should return 405):"
	curl -s -X DELETE $(MCP_ENDPOINT) | jq .

test-error-handling: ## Test error handling with invalid requests
	@echo "\n=== Testing Error Handling ==="
	@echo "Testing invalid JSON:"
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"invalid json"}' | ./parse-sse.sh | jq .
	@echo "\nTesting invalid method:"
	curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":10,"method":"invalid/method","params":{}}' | ./parse-sse.sh | jq .

# Sequential test with proper initialization
test-sequence: ## Run a proper MCP client sequence
	@echo "\n=== Running MCP Client Sequence ==="
	@echo "1. Initialize..."
	@curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' | ./parse-sse.sh | jq .
	@echo "\n2. List capabilities..."
	@curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | ./parse-sse.sh | jq .tools
	@echo "\n3. Use a tool..."
	@curl -s -X POST $(MCP_ENDPOINT) \
		-H "Content-Type: application/json" \
		-H "Accept: application/json, text/event-stream" \
		-d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"echo","arguments":{"message":"Sequence test complete!"}}}' | ./parse-sse.sh | jq .result.content

# Performance test
test-performance: ## Run performance test with multiple concurrent requests
	@echo "\n=== Performance Test ==="
	@echo "Running 10 concurrent echo requests..."
	@for i in {1..10}; do \
		curl -s -X POST $(MCP_ENDPOINT) \
			-H "Content-Type: application/json" \
			-H "Accept: application/json, text/event-stream" \
			-d '{"jsonrpc":"2.0","id":'$$i',"method":"tools/call","params":{"name":"echo","arguments":{"message":"Request '$$i'"}}}' | ./parse-sse.sh & \
	done; wait
	@echo "All requests completed!"

# Clean up
stop-server: ## Stop any running HTTP servers
	@echo "Stopping HTTP servers..."
	@pkill -f "npm run http" || echo "No HTTP server running"
	@pkill -f "node dist/http.js" || echo "No HTTP server running"

clean: ## Clean build artifacts
	rm -rf dist/
	rm -rf node_modules/.cache/ 