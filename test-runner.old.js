#!/usr/bin/env node

/**
 * Test Runner for Spring Boot MCP Servers
 * Executes automated tests for all 16 tools
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

/**
 * Print colored console output
 */
function printInfo(message) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
}

function printSuccess(message) {
  console.log(`${colors.green}[PASS]${colors.reset} ${message}`);
}

function printError(message) {
  console.log(`${colors.red}[FAIL]${colors.reset} ${message}`);
}

function printWarning(message) {
  console.log(`${colors.yellow}[SKIP]${colors.reset} ${message}`);
}

/**
 * Execute a tool and capture output
 */
async function executeTool(serverPath, toolRequest) {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('node', [
      path.join(serverPath, 'dist/index.js'),
      TEST_PROJECT_PATH
    ]);

    let stdout = '';
    let stderr = '';
    let responseData = '';

    // Send request via stdin
    serverProcess.stdin.write(JSON.stringify(toolRequest) + '\n');
    serverProcess.stdin.end();

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;

      // Look for JSON response in stdout
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.result || parsed.error) {
              responseData = line;
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    });

    serverProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    serverProcess.on('close', (code) => {
      if (code === 0 && responseData) {
        try {
          const response = JSON.parse(responseData);
          resolve({
            success: true,
            response: response,
            stdout: stdout,
            stderr: stderr
          });
        } catch (e) {
          resolve({
            success: false,
            error: 'Failed to parse response',
            stdout: stdout,
            stderr: stderr
          });
        }
      } else {
        resolve({
          success: false,
          error: `Process exited with code ${code}`,
          stdout: stdout,
          stderr: stderr
        });
      }
    });

    serverProcess.on('error', (error) => {
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      serverProcess.kill();
      resolve({
        success: false,
        error: 'Timeout (30s)',
        stdout: stdout,
        stderr: stderr
      });
    }, 30000);
  });
}

/**
 * Run a single test case
 */
async function runTest(testCase) {
  results.total++;

  printInfo(`Running: ${testCase.id} - ${testCase.name}`);

  try {
    const result = await executeTool(testCase.serverPath, testCase.request);

    if (result.success) {
      // Validate response
      const validation = testCase.validate(result.response);

      if (validation.passed) {
        results.passed++;
        printSuccess(`${testCase.id}: PASSED`);

        results.tests.push({
          id: testCase.id,
          name: testCase.name,
          status: 'PASSED',
          duration: validation.duration || 0,
          output: result.response
        });

        return true;
      } else {
        results.failed++;
        printError(`${testCase.id}: FAILED - ${validation.reason}`);

        results.tests.push({
          id: testCase.id,
          name: testCase.name,
          status: 'FAILED',
          reason: validation.reason,
          expected: testCase.expected,
          actual: result.response
        });

        return false;
      }
    } else {
      results.failed++;
      printError(`${testCase.id}: FAILED - ${result.error}`);

      results.tests.push({
        id: testCase.id,
        name: testCase.name,
        status: 'FAILED',
        reason: result.error,
        stderr: result.stderr
      });

      return false;
    }
  } catch (error) {
    results.failed++;
    printError(`${testCase.id}: ERROR - ${error.message}`);

    results.tests.push({
      id: testCase.id,
      name: testCase.name,
      status: 'ERROR',
      error: error.message
    });

    return false;
  }
}

/**
 * Define test cases
 */
function getTestCases() {
  const microContextPath = path.join(__dirname, 'packages/micro-context');
  const macroContextPath = path.join(__dirname, 'packages/macro-context');
  const componentContextPath = path.join(__dirname, 'packages/spring-component');

  return [
    // Phase 2: Micro Context Tests
    {
      id: 'TC-2.1.1',
      name: 'get_class_info - Simple class',
      serverPath: microContextPath,
      request: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'get_class_info',
          arguments: {
            class_name: 'User'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Class Information:') && content.includes('Fields')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Output format incorrect' };
      }
    },

    {
      id: 'TC-2.2.1',
      name: 'get_method_body - Service method',
      serverPath: microContextPath,
      request: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'get_method_body',
          arguments: {
            class_name: 'UserService',
            method_name: 'findById'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Method Body:') && content.includes('public')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Method body not found' };
      }
    },

    {
      id: 'TC-2.3.1',
      name: 'get_dto_structure - DTO analysis',
      serverPath: microContextPath,
      request: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'get_dto_structure',
          arguments: {
            class_name: 'UserDTO',
            max_depth: 2
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('DTO Structure:') && content.includes('Fields')) {
          return { passed: true };
        }
        return { passed: false, reason: 'DTO structure not found' };
      }
    },

    {
      id: 'TC-2.4.1',
      name: 'find_mockable_dependencies - Service dependencies',
      serverPath: microContextPath,
      request: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'find_mockable_dependencies',
          arguments: {
            class_name: 'UserService'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Mockable Dependencies:') || content.includes('Dependencies Found:')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Dependencies not found' };
      }
    },

    {
      id: 'TC-2.5.1',
      name: 'find_execution_branches - Method branches',
      serverPath: microContextPath,
      request: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/call',
        params: {
          name: 'find_execution_branches',
          arguments: {
            class_name: 'UserService',
            method_name: 'findById'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Execution Branches:') || content.includes('Branch')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Branches not found' };
      }
    },

    // Phase 3: Macro Context Tests
    {
      id: 'TC-3.1.1',
      name: 'build_method_call_chain - Controller to repository',
      serverPath: macroContextPath,
      request: {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/call',
        params: {
          name: 'build_method_call_chain',
          arguments: {
            class_name: 'UserController',
            method_name: 'getUser',
            max_depth: 10
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Method Call Chain:') || content.includes('Call Chain')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Call chain not found' };
      }
    },

    {
      id: 'TC-3.4.1',
      name: 'trace_endpoint_to_repository - Complete flow',
      serverPath: macroContextPath,
      request: {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'trace_endpoint_to_repository',
          arguments: {
            endpoint_path: '/api/users',
            http_method: 'POST'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Endpoint to Repository') || content.includes('Complete Flow')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Flow trace not found' };
      }
    },

    {
      id: 'TC-3.5.1',
      name: 'find_entity_by_table - Table to entity mapping',
      serverPath: macroContextPath,
      request: {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'find_entity_by_table',
          arguments: {
            table_name: 'users'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Entity Mapping:') || content.includes('Entity Class')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Entity mapping not found' };
      }
    },

    // Phase 4: Component Context Tests
    {
      id: 'TC-4.1.1',
      name: 'analyze_controller_method - POST endpoint',
      serverPath: componentContextPath,
      request: {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'analyze_controller_method',
          arguments: {
            controller_name: 'UserController',
            method_name: 'createUser'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Controller Method Analysis:') && content.includes('Method Signature')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Method analysis not found' };
      }
    },

    {
      id: 'TC-4.2.1',
      name: 'find_controller_for_endpoint - Exact match',
      serverPath: componentContextPath,
      request: {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: {
          name: 'find_controller_for_endpoint',
          arguments: {
            endpoint: '/api/users',
            http_method: 'GET'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Endpoint Handler:') || content.includes('Handler Found')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Handler not found' };
      }
    },

    {
      id: 'TC-4.3.1',
      name: 'find_implementations - Interface implementations',
      serverPath: componentContextPath,
      request: {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: {
          name: 'find_implementations',
          arguments: {
            interface_or_abstract_class: 'UserRepository'
          }
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Implementations:') || content.includes('Parent Type')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Implementations not found' };
      }
    },

    {
      id: 'TC-4.4.1',
      name: 'find_feature_flag_usage - All flags',
      serverPath: componentContextPath,
      request: {
        jsonrpc: '2.0',
        id: 12,
        method: 'tools/call',
        params: {
          name: 'find_feature_flag_usage',
          arguments: {}
        }
      },
      validate: (response) => {
        if (!response.result) {
          return { passed: false, reason: 'No result in response' };
        }
        const content = response.result.content?.[0]?.text || '';
        if (content.includes('Feature Flag Usage') || content.includes('Flags Detected')) {
          return { passed: true };
        }
        return { passed: false, reason: 'Flag analysis not completed' };
      }
    }
  ];
}

/**
 * Write results to report file
 */
function writeReport() {
  let reportContent = `

## Results Summary

- **Total Tests:** ${results.total}
- **Passed:** ${results.passed} ✅
- **Failed:** ${results.failed} ❌
- **Skipped:** ${results.skipped} ⚠️
- **Success Rate:** ${((results.passed / results.total) * 100).toFixed(2)}%

---

## Detailed Results

`;

  // Group by status
  const passed = results.tests.filter(t => t.status === 'PASSED');
  const failed = results.tests.filter(t => t.status === 'FAILED' || t.status === 'ERROR');
  const skipped = results.tests.filter(t => t.status === 'SKIPPED');

  // Passed tests
  if (passed.length > 0) {
    reportContent += `### Passed Tests (${passed.length})\n\n`;
    passed.forEach(test => {
      reportContent += `- ✅ **${test.id}**: ${test.name}\n`;
    });
    reportContent += '\n';
  }

  // Failed tests
  if (failed.length > 0) {
    reportContent += `### Failed Tests (${failed.length})\n\n`;
    failed.forEach(test => {
      reportContent += `- ❌ **${test.id}**: ${test.name}\n`;
      reportContent += `  - **Reason:** ${test.reason || test.error || 'Unknown'}\n`;
      if (test.stderr) {
        reportContent += `  - **Error Output:** \`${test.stderr.substring(0, 200)}\`\n`;
      }
      reportContent += '\n';
    });
  }

  // Skipped tests
  if (skipped.length > 0) {
    reportContent += `### Skipped Tests (${skipped.length})\n\n`;
    skipped.forEach(test => {
      reportContent += `- ⚠️ **${test.id}**: ${test.name}\n`;
    });
    reportContent += '\n';
  }

  reportContent += `---

## Recommendations

`;

  if (results.failed > 0) {
    reportContent += `
### Action Items

1. Review failed test cases above
2. Check error messages and stderr output
3. Verify test project has all required classes
4. Ensure Spring Boot annotations are present
5. Check Java parser service logs for errors

`;
  }

  if (results.passed === results.total) {
    reportContent += `
🎉 **All tests passed!** The MCP servers are working correctly.

`;
  } else if (results.passed / results.total >= 0.8) {
    reportContent += `
✅ **Most tests passed.** Review failed tests for minor issues.

`;
  } else {
    reportContent += `
⚠️ **Significant test failures.** Review configuration and test project setup.

`;
  }

  // Append to report file
  fs.appendFileSync(REPORT_FILE, reportContent);

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
  console.log('');

  // Get all test cases
  const testCases = getTestCases();
  printInfo(`Total test cases: ${testCases.length}`);
  console.log('');

  // Run all tests
  for (const testCase of testCases) {
    await runTest(testCase);
  }

  // Write final report
  console.log('');
  writeReport();

  // Display summary
  console.log('');
  console.log('========================================');
  console.log('Test Execution Complete');
  console.log('========================================');
  console.log('');
  console.log(`Total:   ${results.total}`);
  console.log(`${colors.green}Passed:  ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed:  ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}Skipped: ${results.skipped}${colors.reset}`);
  console.log('');
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  console.log('');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
