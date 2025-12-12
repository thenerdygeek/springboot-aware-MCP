#!/usr/bin/env node

/**
 * Test Runner for Spring Boot MCP Servers
 * Properly implements MCP JSON-RPC 2.0 protocol
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const TEST_PROJECT_PATH = process.argv[2];
const REPORT_FILE = process.argv[3];

if (!TEST_PROJECT_PATH || !REPORT_FILE) {
  console.error('Usage: node test-runner.js <test-project-path> <report-file>');
  process.exit(1);
}

// Test results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function printInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[PASS]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[FAIL]${colors.reset} ${message}`);
}

/**
 * Execute a tool using proper MCP protocol
 */
async function executeTool(serverPath, toolName, toolArgs) {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', [
      path.join(serverPath, 'dist/index.js'),
      TEST_PROJECT_PATH
    ]);

    let messageBuffer = '';
    let messageId = 1;
    let initializeComplete = false;
    let toolResponse = null;

    // Timeout after 30 seconds
    const timeout = setTimeout(() => {
      serverProcess.kill();
      resolve({
        success: false,
        error: 'Timeout (30s)',
        response: null
      });
    }, 30000);

    // Parse incoming JSON-RPC messages
    function parseMessages(data) {
      messageBuffer += data;
      const lines = messageBuffer.split('\n');
      messageBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const message = JSON.parse(line);
            handleMessage(message);
          } catch (e) {
            // Not JSON, likely stderr logging
          }
        }
      }
    }

    // Handle incoming MCP messages
    function handleMessage(message) {
      // Response to initialize request
      if (message.id === 1 && message.result) {
        initializeComplete = true;

        // Send initialized notification
        const initializedNotification = {
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        };
        serverProcess.stdin.write(JSON.stringify(initializedNotification) + '\n');

        // Send tool call request
        const toolCallRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: toolArgs
          }
        };
        serverProcess.stdin.write(JSON.stringify(toolCallRequest) + '\n');
      }

      // Response to tool call
      if (message.id === 2) {
        if (message.result) {
          toolResponse = message.result;
          clearTimeout(timeout);
          serverProcess.kill();

          resolve({
            success: true,
            response: message.result,
            error: null
          });
        } else if (message.error) {
          clearTimeout(timeout);
          serverProcess.kill();

          resolve({
            success: false,
            response: null,
            error: message.error.message || JSON.stringify(message.error)
          });
        }
      }
    }

    serverProcess.stdout.on('data', (data) => {
      parseMessages(data.toString());
    });

    serverProcess.stderr.on('data', (data) => {
      // Server logging, ignore for now
    });

    serverProcess.on('close', (code) => {
      if (!toolResponse) {
        clearTimeout(timeout);
        resolve({
          success: false,
          response: null,
          error: `Server exited with code ${code} before responding`
        });
      }
    });

    serverProcess.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        response: null,
        error: err.message
      });
    });

    // Send initialize request
    const initializeRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: false
          }
        },
        clientInfo: {
          name: 'test-runner',
          version: '1.0.0'
        }
      }
    };

    serverProcess.stdin.write(JSON.stringify(initializeRequest) + '\n');
  });
}

/**
 * Validate test response
 */
function validateResponse(response, validations) {
  if (!response || !response.content || response.content.length === 0) {
    return { passed: false, reason: 'No content in response' };
  }

  const content = response.content[0].text;

  for (const validation of validations) {
    if (!content.includes(validation)) {
      return { passed: false, reason: `Missing expected content: ${validation}` };
    }
  }

  return { passed: true, reason: '' };
}

// Define test cases
const testCases = [
  // Phase 2: Micro Context Server (5 tools)
  {
    id: 'TC-2.1.1',
    name: 'resolve_symbol - Symbol resolution',
    serverPath: 'packages/micro-context',
    toolName: 'resolve_symbol',
    args: { symbol_name: 'userService', context_file: TEST_PROJECT_PATH + '/src/main/java/com/example/mcptest/controller/UserController.java' },
    validations: ['# Symbol Resolution:', 'userService']
  },
  {
    id: 'TC-2.2.1',
    name: 'get_function_definition - Service method',
    serverPath: 'packages/micro-context',
    toolName: 'get_function_definition',
    args: { class_name: 'UserService', function_name: 'createUser' },
    validations: ['# Method Definition:', 'createUser']
  },
  {
    id: 'TC-2.3.1',
    name: 'get_dto_structure - DTO analysis',
    serverPath: 'packages/micro-context',
    toolName: 'get_dto_structure',
    args: { class_name: 'UserDTO' },
    validations: ['# DTO Structure:', 'UserDTO']
  },
  {
    id: 'TC-2.4.1',
    name: 'find_mockable_dependencies - Service dependencies',
    serverPath: 'packages/micro-context',
    toolName: 'find_mockable_dependencies',
    args: { class_name: 'UserService' },
    validations: ['# Mockable Dependencies:', 'UserService']
  },
  {
    id: 'TC-2.5.1',
    name: 'find_execution_branches - Method branches',
    serverPath: 'packages/micro-context',
    toolName: 'find_execution_branches',
    args: {
      method_code: `public UserDTO createUser(UserDTO userDTO) {
        if (newUserValidationEnabled) {
            validateNewUser(userDTO);
        }
        if (userRepository.existsByUsername(userDTO.getUsername())) {
            throw new ResourceAlreadyExistsException("Username already exists");
        }
        User user = convertToEntity(userDTO);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
      }`,
      class_name: 'UserService',
      method_name: 'createUser'
    },
    validations: ['# Execution Branch Analysis:', 'createUser']
  },

  // Phase 3: Macro Context Server (7 tools)
  {
    id: 'TC-3.1.1',
    name: 'build_method_call_chain - Controller to repository',
    serverPath: 'packages/macro-context',
    toolName: 'build_method_call_chain',
    args: {
      class_name: 'UserController',
      method_name: 'createUser',
      max_depth: 5
    },
    validations: ['# Method Call Chain:', 'UserController']
  },
  {
    id: 'TC-3.4.1',
    name: 'trace_endpoint_to_repository - Complete flow',
    serverPath: 'packages/macro-context',
    toolName: 'trace_endpoint_to_repository',
    args: { endpoint_path: '/api/users' },
    validations: ['# Endpoint Flow:', 'api/users']
  },
  {
    id: 'TC-3.5.1',
    name: 'find_entity_by_table - Table to entity mapping',
    serverPath: 'packages/macro-context',
    toolName: 'find_entity_by_table',
    args: { table_name: 'users' },
    validations: ['# Entity Mapping:', 'users']
  },

  // Phase 4: Spring Component Server (4 tools)
  {
    id: 'TC-4.1.1',
    name: 'analyze_controller_method - POST endpoint',
    serverPath: 'packages/spring-component',
    toolName: 'analyze_controller_method',
    args: {
      controller_name: 'UserController',
      method_name: 'createUser'
    },
    validations: ['# Controller Method Analysis:', 'createUser']
  },
  {
    id: 'TC-4.2.1',
    name: 'find_controller_for_endpoint - Exact match',
    serverPath: 'packages/spring-component',
    toolName: 'find_controller_for_endpoint',
    args: {
      endpoint: '/api/users',
      http_method: 'POST'
    },
    validations: ['# Endpoint Handler:', '/api/users']
  },
  {
    id: 'TC-4.3.1',
    name: 'find_implementations - Interface implementations',
    serverPath: 'packages/spring-component',
    toolName: 'find_implementations',
    args: { interface_or_abstract_class: 'UserRepository' },
    validations: ['# Implementations:', 'UserRepository']
  },
  {
    id: 'TC-4.4.1',
    name: 'find_feature_flag_usage - All flags',
    serverPath: 'packages/spring-component',
    toolName: 'find_feature_flag_usage',
    args: {},
    validations: ['# Feature Flag']
  }
];

/**
 * Run a single test case
 */
async function runTest(testCase) {
  printInfo(`Running: ${testCase.id} - ${testCase.name}`);

  const result = await executeTool(
    testCase.serverPath,
    testCase.toolName,
    testCase.args
  );

  const testResult = {
    id: testCase.id,
    name: testCase.name,
    passed: false,
    error: null,
    response: null
  };

  if (result.success) {
    const validation = validateResponse(result.response, testCase.validations);

    if (validation.passed) {
      printSuccess(`${testCase.id}: PASSED`);
      testResult.passed = true;
      testResult.response = result.response.content[0].text.substring(0, 200);
      results.passed++;
    } else {
      printError(`${testCase.id}: FAILED - ${validation.reason}`);
      testResult.error = validation.reason;
      results.failed++;
    }
  } else {
    printError(`${testCase.id}: FAILED - ${result.error}`);
    testResult.error = result.error;
    results.failed++;
  }

  results.tests.push(testResult);
  results.total++;
}

/**
 * Generate test report
 */
function generateReport() {
  const successRate = ((results.passed / results.total) * 100).toFixed(2);

  let report = fs.readFileSync(REPORT_FILE, 'utf8');

  // Add detailed results
  report += '\n\n## Detailed Results\n\n';

  for (const test of results.tests) {
    report += `### ${test.id}: ${test.name}\n\n`;

    if (test.passed) {
      report += `**Status:** ✅ PASSED\n\n`;
      report += `**Response Preview:**\n\`\`\`\n${test.response}...\n\`\`\`\n\n`;
    } else {
      report += `**Status:** ❌ FAILED\n\n`;
      report += `**Error:** ${test.error}\n\n`;
    }

    report += '---\n\n';
  }

  // Update results summary
  const summarySection = `## Results Summary\n\n- **Total Tests:** ${results.total}\n- **Passed:** ${results.passed} ✅\n- **Failed:** ${results.failed} ❌\n- **Skipped:** ${results.skipped} ⚠️\n- **Success Rate:** ${successRate}%\n\n---\n`;

  report = report.replace(/## Test Results Summary\n\n/, `## Test Results Summary\n\n${summarySection}`);

  fs.writeFileSync(REPORT_FILE, report);
  printInfo(`Report updated: ${REPORT_FILE}`);
}

/**
 * Main test execution
 */
async function main() {
  console.log('\n========================================');
  console.log('Spring Boot MCP Servers - Test Runner');
  console.log('========================================\n');

  printInfo(`Test Project: ${TEST_PROJECT_PATH}`);
  printInfo(`Report File: ${REPORT_FILE}`);
  printInfo(`Total test cases: ${testCases.length}\n`);

  // Run all tests
  for (const testCase of testCases) {
    await runTest(testCase);
  }

  // Generate report
  generateReport();

  // Display summary
  console.log('\n========================================');
  console.log('Test Execution Complete');
  console.log('========================================\n');
  console.log(`Total:   ${results.total}`);
  console.log(`${colors.green}Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  console.log(`\nSuccess Rate: ${((results.passed / results.total) * 100).toFixed(2)}%\n`);

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
