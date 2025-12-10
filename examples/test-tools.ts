#!/usr/bin/env ts-node

/**
 * Simple test script to verify MCP tools work end-to-end
 * Run with: npx tsx examples/test-tools.ts
 */

import { JavaParserClient } from '../packages/micro-context/src/java-parser-client.js';
import { resolveSymbol } from '../packages/micro-context/src/tools/resolve-symbol.js';
import { getFunctionDefinition } from '../packages/micro-context/src/tools/get-function-definition.js';
import * as path from 'path';

const WORKSPACE_ROOT = path.resolve(__dirname, 'test-spring-project');

async function main() {
  console.log('🧪 Testing Spring Boot MCP Tools\n');
  console.log(`📁 Workspace: ${WORKSPACE_ROOT}\n`);

  // Initialize JavaParser client
  const config = {
    packageInclude: 'com.example.demo.*',
    packageExclude: '',
    dtoPackages: ['com.example.demo.model'],
    entityPackages: ['com.example.demo.model'],
    maxDtoDepth: 10,
    callChainMaxDepth: 15,
    stopAtPackages: ['java.*', 'javax.*', 'org.springframework.*'],
    featureFlagPatterns: [],
  };

  const client = new JavaParserClient(WORKSPACE_ROOT, config);

  try {
    // Wait for Java service to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('=' .repeat(70));
    console.log('TEST 1: resolve_symbol - Resolve userService in UserController');
    console.log('='.repeat(70));

    const contextFile = path.join(
      WORKSPACE_ROOT,
      'src/main/java/com/example/demo/controller/UserController.java'
    );

    const symbolResult = await resolveSymbol(client, {
      symbol_name: 'userService',
      context_file: contextFile,
    });

    console.log(symbolResult);
    console.log('\n');

    console.log('='.repeat(70));
    console.log('TEST 2: get_function_definition - Get findById method');
    console.log('='.repeat(70));

    const functionResult = await getFunctionDefinition(client, {
      function_name: 'findById',
      class_name: 'com.example.demo.service.UserService',
      include_body: true,
    });

    console.log(functionResult);
    console.log('\n');

    console.log('='.repeat(70));
    console.log('TEST 3: get_function_definition - Get getAllUsers method');
    console.log('='.repeat(70));

    const controllerMethodResult = await getFunctionDefinition(client, {
      function_name: 'getAllUsers',
      class_name: 'com.example.demo.controller.UserController',
      include_body: true,
    });

    console.log(controllerMethodResult);
    console.log('\n');

    console.log('✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    client.dispose();
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
