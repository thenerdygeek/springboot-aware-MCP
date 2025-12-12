import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindControllerForEndpointArgs {
  endpoint: string;
  http_method?: string;
}

/**
 * Finds which controller and method handles a specific API endpoint.
 * Supports path variable matching (e.g., /api/users/{id} matches /api/users/123).
 */
export async function findControllerForEndpoint(
  client: JavaParserClient,
  args: FindControllerForEndpointArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_controller_for_endpoint', {
      endpoint: args.endpoint,
      httpMethod: args.http_method,
    });

    return formatEndpointHandler(result, args.endpoint, args.http_method);
  } catch (error: any) {
    return formatError('Endpoint Handler Search', error, args);
  }
}

function formatEndpointHandler(
  result: any,
  endpoint: string,
  httpMethod?: string
): string {
  const {
    handler,
    completeMapping,
    methodSignature,
    quickInfo,
    relatedEndpoints,
    similarEndpoints,
    fileReference,
  } = result;

  let markdown = `# Endpoint Handler: ${httpMethod || 'ANY'} ${endpoint}\n\n`;

  if (!handler) {
    markdown += `## No Handler Found\n\n`;
    markdown += `No controller method found for \`${httpMethod || 'ANY'} ${endpoint}\`\n\n`;

    // Show similar endpoints
    if (similarEndpoints && similarEndpoints.length > 0) {
      markdown += `### Similar Endpoints Found:\n\n`;
      markdown += `| Path | HTTP | Controller | Method |\n`;
      markdown += `|------|------|------------|--------|\n`;
      similarEndpoints.forEach((ep: any) => {
        markdown += `| ${ep.path} | ${ep.httpMethod} | ${ep.controller} | ${ep.method} |\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }

  // Handler Found
  markdown += `## Handler Found\n`;
  markdown += `- **Controller:** ${handler.controller}\n`;
  markdown += `- **Method:** ${handler.method}\n`;
  markdown += `- **File:** \`${handler.file}\`\n\n`;

  // Complete Mapping
  if (completeMapping) {
    markdown += `## Complete Mapping\n`;
    markdown += `- **Base Path:** ${completeMapping.basePath || '/'}\n`;
    markdown += `- **Method Path:** ${completeMapping.methodPath || '/'}\n`;
    markdown += `- **Full Path:** ${completeMapping.fullPath}\n`;
    markdown += `- **HTTP Method:** ${completeMapping.httpMethod}\n\n`;
  }

  // Method Signature
  if (methodSignature) {
    markdown += `## Method Signature\n\`\`\`java\n${methodSignature}\n\`\`\`\n\n`;
  }

  // Quick Info
  if (quickInfo) {
    markdown += `## Quick Info\n`;
    markdown += `- **Request Type:** ${quickInfo.requestType || 'N/A'}\n`;
    markdown += `- **Response Type:** ${quickInfo.responseType || 'N/A'}\n`;
    markdown += `- **Async:** ${quickInfo.async ? 'Yes' : 'No'}\n\n`;
  }

  // Related Endpoints in Controller
  if (relatedEndpoints && relatedEndpoints.length > 0) {
    markdown += `## Related Endpoints in Controller\n\n`;
    markdown += `| Method | Path | HTTP | Handler |\n`;
    markdown += `|--------|------|------|----------|\n`;
    relatedEndpoints.forEach((ep: any) => {
      const isCurrent = ep.path === completeMapping?.fullPath &&
                        ep.httpMethod === completeMapping?.httpMethod;
      const marker = isCurrent ? '→ ' : '  ';
      markdown += `| ${marker}${ep.method} | ${ep.path} | ${ep.httpMethod} | ${ep.handlerMethod}() |\n`;
    });
    markdown += `\n`;
  }

  // File Reference
  if (fileReference) {
    markdown += `## File References\n\n`;
    markdown += `- Controller: \`${fileReference}\`\n\n`;
  }

  markdown += `---\n`;
  markdown += `Handler found.\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `No handler found for ${context.http_method || 'ANY'} ${context.endpoint}`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Endpoint path typo\n`;
  markdown += `- Endpoint not implemented\n`;
  markdown += `- Path variables not matched\n`;
  markdown += `- HTTP method mismatch\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Check endpoint spelling and case\n`;
  markdown += `- Try without path variables (e.g., /api/users instead of /api/users/123)\n`;
  markdown += `- Verify HTTP method is correct\n`;
  markdown += `- Use pattern matching: /api/users/{id}\n\n`;

  markdown += `**Context:** Searched for ${context.http_method || 'ANY'} ${context.endpoint}\n`;

  return markdown;
}
