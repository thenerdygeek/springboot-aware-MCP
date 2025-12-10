import { JavaParserClient } from '../java-parser-client.js';

export interface GetFunctionDefinitionArgs {
  function_name: string;
  class_name: string;
  file_path?: string;
  include_body?: boolean;
}

/**
 * Returns complete method definition including signature, annotations, parameters, and body.
 * Handles overloaded methods by returning all signatures.
 */
export async function getFunctionDefinition(
  client: JavaParserClient,
  args: GetFunctionDefinitionArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('get_function_definition', {
      functionName: args.function_name,
      className: args.class_name,
      filePath: args.file_path,
      includeBody: args.include_body ?? true,
    });

    return formatFunctionDefinition(result, args.function_name, args.class_name);
  } catch (error: any) {
    return formatError('Method Definition', error, args);
  }
}

function formatFunctionDefinition(
  result: any,
  functionName: string,
  className: string
): string {
  const {
    methods,
    filePath,
    classAnnotations,
  } = result;

  let markdown = `# Method Definition: ${className}.${functionName}\n\n`;

  if (methods.length === 0) {
    markdown += `**No methods found with name "${functionName}" in class ${className}**\n\n`;
    return markdown;
  }

  // Handle multiple overloaded methods
  methods.forEach((method: any, index: number) => {
    if (methods.length > 1) {
      markdown += `## Overload ${index + 1} of ${methods.length}\n\n`;
    }

    markdown += `## Signature\n`;
    markdown += '```java\n';
    markdown += formatSignature(method);
    markdown += '\n```\n\n';

    markdown += `## Details\n`;
    markdown += `- **Visibility:** ${method.visibility}\n`;
    markdown += `- **Static:** ${method.isStatic ? 'Yes' : 'No'}\n`;
    markdown += `- **Return Type:** \`${method.returnType}\`\n`;

    if (method.throwsExceptions && method.throwsExceptions.length > 0) {
      markdown += `- **Throws:** ${method.throwsExceptions.join(', ')}\n`;
    }

    if (method.annotations && method.annotations.length > 0) {
      markdown += `- **Annotations:** ${method.annotations.join(', ')}\n`;
    }
    markdown += '\n';

    if (method.parameters && method.parameters.length > 0) {
      markdown += `## Parameters\n`;
      markdown += `| Name | Type | Annotations |\n`;
      markdown += `|------|------|-------------|\n`;
      method.parameters.forEach((param: any) => {
        const annotations = param.annotations?.length > 0 ? param.annotations.join(', ') : 'None';
        markdown += `| ${param.name} | \`${param.type}\` | ${annotations} |\n`;
      });
      markdown += '\n';
    }

    if (method.body) {
      markdown += `## Method Body\n`;
      markdown += '```java\n';
      markdown += method.body;
      markdown += '\n```\n\n';
    }

    if (method.javadoc) {
      markdown += `## Javadoc\n`;
      markdown += method.javadoc + '\n\n';
    }

    markdown += `## Location\n`;
    markdown += `- **File:** \`${filePath}\`\n`;
    markdown += `- **Lines:** ${method.startLine}-${method.endLine}\n\n`;

    if (methods.length > 1 && index < methods.length - 1) {
      markdown += `---\n\n`;
    }
  });

  markdown += `---\n`;
  markdown += `Found ${methods.length} method definition(s).\n`;

  return markdown;
}

function formatSignature(method: any): string {
  let sig = '';

  // Annotations
  if (method.annotations && method.annotations.length > 0) {
    sig += method.annotations.join(' ') + '\n';
  }

  // Visibility and modifiers
  sig += method.visibility;
  if (method.isStatic) sig += ' static';
  if (method.isFinal) sig += ' final';
  if (method.isAbstract) sig += ' abstract';
  if (method.isSynchronized) sig += ' synchronized';

  // Return type and name
  sig += ` ${method.returnType} ${method.name}(`;

  // Parameters
  if (method.parameters && method.parameters.length > 0) {
    const params = method.parameters.map((p: any) => {
      let paramStr = '';
      if (p.annotations && p.annotations.length > 0) {
        paramStr += p.annotations.join(' ') + ' ';
      }
      paramStr += `${p.type} ${p.name}`;
      return paramStr;
    });
    sig += params.join(', ');
  }

  sig += ')';

  // Throws clause
  if (method.throwsExceptions && method.throwsExceptions.length > 0) {
    sig += ' throws ' + method.throwsExceptions.join(', ');
  }

  return sig;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || 'Unknown error occurred'}\n\n`;

  if (error.suggestions && error.suggestions.length > 0) {
    markdown += `**Suggestions:**\n`;
    error.suggestions.forEach((suggestion: string) => {
      markdown += `- ${suggestion}\n`;
    });
    markdown += '\n';
  } else {
    markdown += `**Suggestions:**\n`;
    markdown += `- Check method name spelling\n`;
    markdown += `- Verify class name is correct\n`;
    markdown += `- Specify parameter types if method is overloaded\n`;
    markdown += `- Use \`find_all_usages\` to locate the method\n\n`;
  }

  if (error.context || Object.keys(context).length > 0) {
    markdown += `**Context:**\n`;
    const errorContext = error.context || context;
    for (const [key, value] of Object.entries(errorContext)) {
      markdown += `- ${key}: ${value}\n`;
    }
  }

  return markdown;
}
