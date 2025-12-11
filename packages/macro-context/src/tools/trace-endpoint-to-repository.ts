import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface TraceEndpointToRepositoryArgs {
  endpoint_path: string;
  http_method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
}

/**
 * Traces complete flow from REST endpoint through service layer to repository.
 * Shows Controller → Service → Repository → Entity flow.
 */
export async function traceEndpointToRepository(
  client: JavaParserClient,
  args: TraceEndpointToRepositoryArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('trace_endpoint_to_repository', {
      endpointPath: args.endpoint_path,
      httpMethod: args.http_method,
    });

    return formatEndpointTrace(result, args.endpoint_path);
  } catch (error: any) {
    return formatError('Endpoint to Repository Trace', error, args);
  }
}

function formatEndpointTrace(result: any, endpointPath: string): string {
  const {
    endpoint,
    controllerMethod,
    serviceCalls,
    repositoryCalls,
    entities,
    flowDiagram,
    layers,
    totalHops,
    fileReferences,
  } = result;

  let markdown = `# Endpoint Flow: ${endpointPath}\n\n`;

  // Endpoint Info
  if (endpoint) {
    markdown += `## Endpoint\n`;
    markdown += `- **Path:** ${endpoint.path}\n`;
    markdown += `- **HTTP Method:** ${endpoint.method}\n`;
    markdown += `- **Controller:** ${endpoint.controllerClass}\n\n`;
  }

  // Controller Method
  if (controllerMethod) {
    markdown += `## Controller Method\n`;
    markdown += `**${controllerMethod.className}.${controllerMethod.methodName}**\n\n`;
    markdown += `- **File:** \`${controllerMethod.file}:${controllerMethod.line}\`\n`;
    markdown += `- **Annotations:** ${controllerMethod.annotations?.join(', ') || 'None'}\n`;
    markdown += `- **Parameters:** ${controllerMethod.parameters?.join(', ') || 'None'}\n`;
    markdown += `- **Return Type:** ${controllerMethod.returnType}\n\n`;

    if (controllerMethod.requestBody) {
      markdown += `- **Request Body:** ${controllerMethod.requestBody}\n\n`;
    }
  }

  // Service Layer Calls
  if (serviceCalls && serviceCalls.length > 0) {
    markdown += `## Service Layer\n\n`;

    serviceCalls.forEach((service: any, index: number) => {
      markdown += `### Service ${index + 1}: ${service.className}.${service.methodName}\n`;
      markdown += `- **File:** \`${service.file}:${service.line}\`\n`;
      markdown += `- **Type:** ${service.serviceType || 'Service'}\n`;

      if (service.transactional) {
        markdown += `- **Transactional:** Yes\n`;
      }

      if (service.callsTo && service.callsTo.length > 0) {
        markdown += `- **Calls To:** ${service.callsTo.join(', ')}\n`;
      }

      markdown += `\n`;
    });
  }

  // Repository Layer Calls
  if (repositoryCalls && repositoryCalls.length > 0) {
    markdown += `## Repository Layer\n\n`;

    repositoryCalls.forEach((repo: any, index: number) => {
      markdown += `### Repository ${index + 1}: ${repo.className}\n`;
      markdown += `- **File:** \`${repo.file}:${repo.line}\`\n`;
      markdown += `- **Method Called:** ${repo.methodName}\n`;
      markdown += `- **Repository Type:** ${repo.repoType || 'JpaRepository'}\n`;

      if (repo.entity) {
        markdown += `- **Entity:** ${repo.entity}\n`;
      }

      if (repo.queryMethod) {
        markdown += `- **Query Method:** ${repo.queryMethod}\n`;
      }

      markdown += `\n`;
    });
  }

  // Entities
  if (entities && entities.length > 0) {
    markdown += `## Entities\n\n`;

    entities.forEach((entity: any) => {
      markdown += `### ${entity.className}\n`;
      markdown += `- **File:** \`${entity.file}\`\n`;
      markdown += `- **Table:** ${entity.tableName || 'N/A'}\n`;

      if (entity.fields && entity.fields.length > 0) {
        markdown += `- **Key Fields:** ${entity.fields.join(', ')}\n`;
      }

      markdown += `\n`;
    });
  }

  // Flow Diagram
  if (flowDiagram) {
    markdown += `## Complete Flow Diagram\n\n`;
    markdown += '```\n';
    markdown += flowDiagram;
    markdown += '\n```\n\n';
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Hops:** ${totalHops || 0}\n`;

  if (layers && layers.length > 0) {
    markdown += `- **Layers:** ${layers.join(' → ')}\n`;
  }

  markdown += `\n`;

  // File References
  if (fileReferences && fileReferences.length > 0) {
    markdown += `## File References\n\n`;
    fileReferences.forEach((ref: string) => {
      markdown += `- \`${ref}\`\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n`;
  markdown += `Traced from endpoint to repository layer.\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Endpoint "${context.endpoint_path}" not found`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Endpoint doesn't exist\n`;
  markdown += `- Controller not found\n`;
  markdown += `- Path pattern mismatch\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Verify endpoint path is correct\n`;
  markdown += `- Check for path variables (e.g., /api/users/{id})\n`;
  markdown += `- Use \`find_controller_for_endpoint\` to locate controller\n\n`;

  markdown += `**Context:** Searched for endpoint ${context.endpoint_path}\n`;

  return markdown;
}
