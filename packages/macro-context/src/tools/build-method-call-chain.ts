import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface BuildMethodCallChainArgs {
  class_name: string;
  method_name: string;
  max_depth?: number;
  stop_at_packages?: string[];
  include_package_pattern?: string;
}

/**
 * Builds complete call chain from a method to all nested method calls,
 * stopping at framework boundaries.
 */
export async function buildMethodCallChain(
  client: JavaParserClient,
  args: BuildMethodCallChainArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('build_method_call_chain', {
      className: args.class_name,
      methodName: args.method_name,
      maxDepth: args.max_depth ?? 15,
      stopAtPackages: args.stop_at_packages,
      includePackagePattern: args.include_package_pattern,
    });

    return formatCallChain(result, args.class_name, args.method_name);
  } catch (error: any) {
    return formatError('Call Chain Analysis', error, args);
  }
}

function formatCallChain(result: any, className: string, methodName: string): string {
  const {
    entryPoint,
    callChain,
    leafMethods,
    frameworkBoundaries,
    callGraph,
    totalCalls,
    maxDepth,
    fileReferences,
  } = result;

  let markdown = `# Method Call Chain: ${className}.${methodName}\n\n`;

  // Entry Point
  markdown += `## Entry Point\n`;
  markdown += `\`${entryPoint.fullSignature}\` at ${entryPoint.file}:${entryPoint.line}\n\n`;

  // Call Chain
  if (callChain && callChain.length > 0) {
    markdown += `## Call Chain\n\n`;

    let currentDepth = -1;
    callChain.forEach((call: any) => {
      if (call.depth !== currentDepth) {
        currentDepth = call.depth;
        markdown += `### Depth ${currentDepth}: ${call.layerName || 'Method Calls'}\n\n`;
      }

      markdown += `**${call.caller} → ${call.callee}**\n`;
      markdown += `- **File:** \`${call.file}:${call.line}\`\n`;
      markdown += `- **Call Type:** ${call.callType}\n`;
      markdown += `- **Package:** ${call.package}\n`;

      if (call.stoppedAtFramework) {
        markdown += `- **Stopped:** Framework boundary (${call.frameworkName})\n`;
      }

      markdown += `\n`;
    });
  }

  // Leaf Methods
  if (leafMethods && leafMethods.length > 0) {
    markdown += `## Leaf Methods\n\n`;
    leafMethods.forEach((leaf: any) => {
      markdown += `- \`${leaf.signature}\` at ${leaf.file}:${leaf.line}\n`;
    });
    markdown += `\n`;
  }

  // Framework Boundaries
  if (frameworkBoundaries && frameworkBoundaries.length > 0) {
    markdown += `## Framework Boundaries\n\n`;
    frameworkBoundaries.forEach((boundary: any) => {
      markdown += `- **${boundary.className}.${boundary.methodName}**\n`;
      markdown += `  - Package: ${boundary.package}\n`;
      markdown += `  - Depth: ${boundary.depth}\n\n`;
    });
  }

  // Call Graph Visualization
  if (callGraph) {
    markdown += `## Call Graph Visualization\n\n`;
    markdown += '```\n';
    markdown += callGraph;
    markdown += '\n```\n\n';
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Calls:** ${totalCalls}\n`;
  markdown += `- **Max Depth:** ${maxDepth}\n`;
  markdown += `- **Framework Boundaries:** ${frameworkBoundaries?.length || 0}\n`;
  markdown += `- **Leaf Methods:** ${leafMethods?.length || 0}\n\n`;

  // File References
  if (fileReferences && fileReferences.length > 0) {
    markdown += `## File References\n\n`;
    fileReferences.forEach((ref: string) => {
      markdown += `- \`${ref}\`\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n`;
  markdown += `Complete call chain traced.\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Method "${context.method_name}" not found in ${context.class_name}`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Method name typo\n`;
  markdown += `- Method is private and not visible\n`;
  markdown += `- Method in parent/child class\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Verify method name\n`;
  markdown += `- Check visibility (public/protected/private)\n`;
  markdown += `- Use \`find_all_usages\` to locate method\n\n`;

  markdown += `**Context:** Entry point: ${context.class_name}.${context.method_name}\n`;

  return markdown;
}
