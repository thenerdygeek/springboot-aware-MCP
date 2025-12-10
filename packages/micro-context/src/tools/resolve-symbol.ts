import { JavaParserClient } from '../java-parser-client.js';

export interface ResolveSymbolArgs {
  symbol_name: string;
  context_file: string;
  line_number?: number;
}

/**
 * Resolves a symbol (variable, field, parameter) to its type and declaration location.
 * Returns markdown-formatted output for Claude comprehension.
 */
export async function resolveSymbol(
  client: JavaParserClient,
  args: ResolveSymbolArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('resolve_symbol', {
      symbolName: args.symbol_name,
      contextFile: args.context_file,
      lineNumber: args.line_number,
    });

    return formatSymbolResolution(result, args.symbol_name);
  } catch (error: any) {
    return formatError('Symbol Resolution', error, args);
  }
}

function formatSymbolResolution(result: any, symbolName: string): string {
  const {
    resolvedType,
    declarationType,
    filePath,
    isCustomClass,
    packageName,
    declarationLocation,
    codeContext,
  } = result;

  let markdown = `# Symbol Resolution: ${symbolName}\n\n`;

  markdown += `## Resolved Type\n`;
  markdown += `\`${resolvedType}\`\n\n`;

  markdown += `## Declaration\n`;
  markdown += `- **Type:** ${declarationType}\n`;
  markdown += `- **Location:** ${declarationLocation.file}:${declarationLocation.line}\n`;
  markdown += `- **Package:** ${packageName}\n`;
  markdown += `- **Custom Class:** ${isCustomClass ? 'Yes' : 'No'}\n\n`;

  markdown += `## File Path\n`;
  markdown += `\`${filePath}\`\n\n`;

  if (codeContext) {
    markdown += `## Context\n`;
    markdown += '```java\n';
    markdown += codeContext;
    markdown += '\n```\n\n';
  }

  markdown += `---\n`;
  markdown += `Symbol successfully resolved to ${isCustomClass ? 'custom' : 'framework'} class.\n`;

  return markdown;
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
    markdown += `- Check spelling of symbol name\n`;
    markdown += `- Verify context file path is correct\n`;
    markdown += `- Ensure symbol is declared in the given context\n\n`;
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
