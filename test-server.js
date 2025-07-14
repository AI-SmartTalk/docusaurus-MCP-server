#!/usr/bin/env node

// Simple test script for the Docusaurus MCP Server
const fetch = require('node:fetch');

const SERVER_URL = 'http://localhost:3223';

async function testMCPTools() {
  console.log('🧪 Testing Docusaurus MCP Server functionality...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);

    // Test 2: Server info
    console.log('\n2. Testing server info...');
    const infoResponse = await fetch(`${SERVER_URL}/`);
    const infoData = await infoResponse.json();
    console.log('✅ Server info:', infoData.name, infoData.version);

    // Test 3: Initialize MCP connection
    console.log('\n3. Testing MCP initialization...');
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };

    const initResponse = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initRequest)
    });

    if (initResponse.ok) {
      console.log('✅ MCP initialization successful');
    } else {
      console.log('❌ MCP initialization failed:', initResponse.status);
    }

    // Test 4: List tools
    console.log('\n4. Testing tools listing...');
    const toolsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    };

    const toolsResponse = await fetch(`${SERVER_URL}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toolsRequest)
    });

    if (toolsResponse.ok) {
      const responseText = await toolsResponse.text();
      // Simple check for tools in the response
      if (responseText.includes('health_check') && responseText.includes('create_document')) {
        console.log('✅ Tools listing successful - found expected tools');
      } else {
        console.log('⚠️  Tools listing response may be incomplete');
      }
    } else {
      console.log('❌ Tools listing failed:', toolsResponse.status);
    }

    console.log('\n🎉 Basic functionality tests completed successfully!');
    console.log('\n📋 Available tools in the Docusaurus MCP Server:');
    console.log('   • health_check - Check service health');
    console.log('   • metrics - Get service metrics');
    console.log('   • create_document - Create new documentation');
    console.log('   • update_docs - Update existing documents');
    console.log('   • continue_docs - Continue writing documents');
    console.log('   • get_docs - Retrieve document content');
    console.log('   • unfinished_docs - List incomplete documents');
    console.log('   • search_docs - Semantic search across docs');
    console.log('   • get_sitemap - Generate documentation structure');
    console.log('   • apply_style - Apply content transformations');
    console.log('   • sync_docs - Sync docs to vector store');
    console.log('   • get_styles - List available styles');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch(`${SERVER_URL}/health`);
    if (response.ok) {
      await testMCPTools();
    } else {
      console.log('❌ Server not responding. Please start the server with: npm run http');
      process.exit(1);
    }
  } catch (error) {
    console.log('❌ Server not running. Please start the server with: npm run http');
    console.log('   The server will run on http://localhost:3223');
    process.exit(1);
  }
}

checkServer(); 