import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface AnalyzeControllerMethodArgs {
  controller_name: string;
  method_name: string;
}

/**
 * Analyzes a controller method including parameters, annotations, and return type.
 * Provides complete information about request/response handling.
 */
export async function analyzeControllerMethod(
  client: JavaParserClient,
  args: AnalyzeControllerMethodArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('analyze_controller_method', {
      controllerName: args.controller_name,
      methodName: args.method_name,
    });

    return formatControllerMethodAnalysis(result, args.controller_name, args.method_name);
  } catch (error: any) {
    return formatError('Controller Method Analysis', error, args);
  }
}

function formatControllerMethodAnalysis(
  result: any,
  controllerName: string,
  methodName: string
): string {
  const {
    method,
    endpointMapping,
    parameters,
    returnType,
    methodBody,
    relatedDTOs,
    fileReference,
  } = result;

  let markdown = `# Controller Method Analysis: ${controllerName}.${methodName}\n\n`;

  if (!method) {
    markdown += `## Method Not Found\n\n`;
    markdown += `Method \`${methodName}\` not found in controller \`${controllerName}\`\n\n`;
    return markdown;
  }

  // Method Signature
  markdown += `## Method Signature\n\`\`\`java\n${method.signature}\n\`\`\`\n\n`;

  // Endpoint Mapping
  if (endpointMapping) {
    markdown += `## Endpoint Mapping\n`;
    markdown += `- **Path:** \`${endpointMapping.path}\`\n`;
    markdown += `- **HTTP Method:** ${endpointMapping.httpMethod}\n`;

    if (endpointMapping.produces && endpointMapping.produces.length > 0) {
      markdown += `- **Produces:** ${endpointMapping.produces.join(', ')}\n`;
    }

    if (endpointMapping.consumes && endpointMapping.consumes.length > 0) {
      markdown += `- **Consumes:** ${endpointMapping.consumes.join(', ')}\n`;
    }

    markdown += `\n`;
  }

  // Request Parameters
  if (parameters && parameters.length > 0) {
    markdown += `## Request Parameters\n\n`;

    const requestBodies = parameters.filter((p: any) => p.annotationType === 'RequestBody');
    const requestParams = parameters.filter((p: any) => p.annotationType === 'RequestParam');
    const pathVariables = parameters.filter((p: any) => p.annotationType === 'PathVariable');
    const requestHeaders = parameters.filter((p: any) => p.annotationType === 'RequestHeader');
    const otherParams = parameters.filter(
      (p: any) =>
        !['RequestBody', 'RequestParam', 'PathVariable', 'RequestHeader'].includes(
          p.annotationType
        )
    );

    // Request Body
    requestBodies.forEach((param: any) => {
      markdown += `### @RequestBody: ${param.name}\n`;
      markdown += `- **Type:** \`${param.type}\`\n`;
      if (param.dtoFile) {
        markdown += `- **DTO File:** \`${param.dtoFile}\`\n`;
      }
      markdown += `- **Required:** ${param.required ? 'Yes' : 'No'}\n`;
      markdown += `- **Validated:** ${param.validated ? 'Yes' : 'No'}\n\n`;
    });

    // Request Params
    if (requestParams.length > 0) {
      requestParams.forEach((param: any) => {
        markdown += `### @RequestParam: ${param.name}\n`;
        markdown += `- **Type:** \`${param.type}\`\n`;
        markdown += `- **Required:** ${param.required ? 'Yes' : 'No'}\n`;
        if (param.defaultValue) {
          markdown += `- **Default:** ${param.defaultValue}\n`;
        }
        markdown += `\n`;
      });
    }

    // Path Variables
    if (pathVariables.length > 0) {
      pathVariables.forEach((param: any) => {
        markdown += `### @PathVariable: ${param.name}\n`;
        markdown += `- **Type:** \`${param.type}\`\n\n`;
      });
    }

    // Request Headers
    if (requestHeaders.length > 0) {
      requestHeaders.forEach((param: any) => {
        markdown += `### @RequestHeader: ${param.name}\n`;
        markdown += `- **Type:** \`${param.type}\`\n`;
        if (param.headerName) {
          markdown += `- **Header Name:** ${param.headerName}\n`;
        }
        markdown += `\n`;
      });
    }

    // Other Parameters
    if (otherParams.length > 0) {
      otherParams.forEach((param: any) => {
        markdown += `### Parameter: ${param.name}\n`;
        markdown += `- **Type:** \`${param.type}\`\n`;
        if (param.annotations && param.annotations.length > 0) {
          markdown += `- **Annotations:** ${param.annotations.join(', ')}\n`;
        }
        markdown += `\n`;
      });
    }
  }

  // Return Type
  if (returnType) {
    markdown += `## Return Type\n`;
    markdown += `- **Wrapped:** ${returnType.wrapper || 'Direct'}\n`;
    markdown += `- **Response Type:** \`${returnType.type}\`\n`;
    if (returnType.dtoFile) {
      markdown += `- **DTO File:** \`${returnType.dtoFile}\`\n`;
    }
    markdown += `\n`;
  }

  // Method Body Preview
  if (methodBody) {
    markdown += `## Method Body Preview\n\`\`\`java\n${methodBody}\n\`\`\`\n\n`;
  }

  // Related DTOs
  if (relatedDTOs && relatedDTOs.length > 0) {
    markdown += `## Related DTOs\n\n`;

    relatedDTOs.forEach((dto: any) => {
      markdown += `### ${dto.name}\n`;
      markdown += `- **Fields:** ${dto.fieldCount}\n`;
      markdown += `- **File:** \`${dto.file}\`\n\n`;
    });
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Parameters:** ${parameters ? parameters.length : 0}\n`;
  markdown += `- **Request Body:** ${parameters && parameters.some((p: any) => p.annotationType === 'RequestBody') ? 'Yes' : 'No'}\n`;
  markdown += `- **Validation:** ${parameters && parameters.some((p: any) => p.validated) ? 'Enabled' : 'Disabled'}\n\n`;

  // File Reference
  if (fileReference) {
    markdown += `## File References\n\n`;
    markdown += `- \`${fileReference}\`\n\n`;
  }

  markdown += `---\n`;
  markdown += `Analyzed successfully.\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Method "${context.method_name}" not found in ${context.controller_name}`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Method name typo\n`;
  markdown += `- Method in parent controller\n`;
  markdown += `- Method is private\n`;
  markdown += `- Controller class not found\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Check method spelling\n`;
  markdown += `- Use \`find_all_usages\` to locate method\n`;
  markdown += `- Verify controller name\n`;
  markdown += `- Check if method exists in parent class\n\n`;

  markdown += `**Context:** Searched for method "${context.method_name}" in controller "${context.controller_name}"\n`;

  return markdown;
}
