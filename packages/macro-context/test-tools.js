#!/usr/bin/env node

/**
 * Test script for Macro Context MCP Server tools
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const WORKSPACE_ROOT = join(__dirname, '../java-parser-service/examples/test-spring-project');

console.log('🧪 Testing Macro Context MCP Server Tools\n');
console.log(`Workspace: ${WORKSPACE_ROOT}\n`);

// Start the macro-context server
const serverPath = join(__dirname, 'dist/index.js');
const server = spawn('node', [serverPath, WORKSPACE_ROOT], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;
const pendingRequests = new Map();

// Helper to send MCP request
function sendRequest(method, params) {
  return new Promise((resolve, reject) => {
    const id = messageId++;
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    pendingRequests.set(id, { resolve, reject });
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

// Process server responses
let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();

  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const response = JSON.parse(line);

      if (response.id && pendingRequests.has(response.id)) {
        const { resolve, reject } = pendingRequests.get(response.id);
        pendingRequests.delete(response.id);

        if (response.error) {
          reject(new Error(response.error.message || JSON.stringify(response.error)));
        } else {
          resolve(response.result);
        }
      }
    } catch (e) {
      console.error('Failed to parse response:', line);
    }
  }
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

// Run tests
async function runTests() {
  try {
    // Wait a moment for server to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Initialize the server
    await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });

    console.log('✅ Server initialized\n');

    // Test 1: build_method_call_chain
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST 1: build_method_call_chain');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const callChainResult = await sendRequest('tools/call', {
      name: 'build_method_call_chain',
      arguments: {
        class_name: 'UserService',
        method_name: 'getAllUsers',
        max_depth: 10
      }
    });

    console.log('Result:');
    console.log(callChainResult.content[0].text);
    console.log('\n');

    // Test 2: trace_data_transformation
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST 2: trace_data_transformation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const transformResult = await sendRequest('tools/call', {
      name: 'trace_data_transformation',
      arguments: {
        dto_class_name: 'UserDTO',
        endpoint: '/api/users',
        direction: 'both'
      }
    });

    console.log('Result:');
    console.log(transformResult.content[0].text);
    console.log('\n');

    // Test 3: find_all_usages
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST 3: find_all_usages');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const usagesResult = await sendRequest('tools/call', {
      name: 'find_all_usages',
      arguments: {
        target_name: 'getUserById',
        target_type: 'method',
        class_context: 'UserService'
      }
    });

    console.log('Result:');
    console.log(usagesResult.content[0].text);
    console.log('\n');

    // Test 4: trace_endpoint_to_repository
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TEST 4: trace_endpoint_to_repository');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const endpointResult = await sendRequest('tools/call', {
      name: 'trace_endpoint_to_repository',
      arguments: {
        endpoint_path: '/api/users',
        http_method: 'GET'
      }
    });

    console.log('Result:');
    console.log(endpointResult.content[0].text);
    console.log('\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All tests completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    server.kill();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    server.kill();
    process.exit(1);
  }
}

runTests();
