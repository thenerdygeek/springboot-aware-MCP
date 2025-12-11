import { JavaParserClient } from '../java-parser-client.js';

export interface FindExecutionBranchesArgs {
  method_code: string;
  class_name?: string;
  method_name?: string;
}

/**
 * Analyzes all execution paths in a method to identify branch coverage requirements
 * for 100% test coverage. Useful for generating comprehensive tests.
 */
export async function findExecutionBranches(
  client: JavaParserClient,
  args: FindExecutionBranchesArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_execution_branches', {
      methodCode: args.method_code,
      className: args.class_name,
      methodName: args.method_name,
    });

    return formatExecutionBranches(result, args.method_name);
  } catch (error: any) {
    return formatError('Execution Branch Analysis', error, args);
  }
}

function formatExecutionBranches(result: any, methodName?: string): string {
  const {
    totalBranches,
    cyclomaticComplexity,
    maxNestingDepth,
    branches,
    testRecommendations,
    minimumTests,
    totalPaths,
    complexityLevel,
  } = result;

  const method = methodName || 'method';
  let markdown = `# Execution Branch Analysis: ${method}\n\n`;

  // Method Complexity
  markdown += `## Method Complexity\n`;
  markdown += `- **Total Branches:** ${totalBranches}\n`;
  markdown += `- **Cyclomatic Complexity:** ${cyclomaticComplexity}\n`;
  markdown += `- **Max Nesting Depth:** ${maxNestingDepth}\n`;
  markdown += `- **Complexity Level:** ${complexityLevel}\n\n`;

  // Branch Details
  if (branches && branches.length > 0) {
    markdown += `## Branch Details\n\n`;

    branches.forEach((branch: any, index: number) => {
      markdown += `### Branch ${index + 1} (Line ${branch.lineNumber}): ${branch.description}\n`;
      markdown += '```java\n';
      markdown += branch.codeSnippet;
      markdown += '\n```\n';
      markdown += `- **Type:** ${branch.type}\n`;
      markdown += `- **Paths:** ${branch.pathCount} (${branch.paths.join(', ')})\n`;
      markdown += `- **Nesting:** Level ${branch.nestingLevel}\n\n`;
    });
  }

  // Test Coverage Recommendations
  if (testRecommendations && testRecommendations.length > 0) {
    markdown += `## Test Coverage Recommendations\n\n`;

    testRecommendations.forEach((test: any, index: number) => {
      markdown += `### Test ${index + 1}: ${test.description}\n`;
      markdown += '```java\n';
      markdown += `@Test\n`;
      markdown += `void ${test.testMethodName}() {\n`;
      markdown += `    // ${test.scenario}\n`;
      markdown += `    // TODO: Implement test\n`;
      markdown += `}\n`;
      markdown += '```\n';
      markdown += `**Covers:** ${test.coversBranches.join(', ')}\n`;
      markdown += `**Scenario:** ${test.scenario}\n\n`;
    });
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Minimum Tests for 100% Coverage:** ${minimumTests}\n`;
  markdown += `- **Branch Coverage:** ${totalPaths} paths\n`;
  markdown += `- **Complexity:** ${complexityLevel}\n\n`;
  markdown += `---\n`;
  markdown += `${minimumTests} test case(s) recommended.\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || 'Unable to parse method code'}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Incomplete code snippet\n`;
  markdown += `- Syntax errors in code\n`;
  markdown += `- Unsupported Java version features\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Ensure code snippet is complete method\n`;
  markdown += `- Check for syntax errors\n`;
  markdown += `- Verify code compiles\n\n`;

  if (error.context || Object.keys(context).length > 0) {
    markdown += `**Context:**\n`;
    const errorContext = error.context || context;
    for (const [key, value] of Object.entries(errorContext)) {
      markdown += `- ${key}: ${value}\n`;
    }
  }

  return markdown;
}
