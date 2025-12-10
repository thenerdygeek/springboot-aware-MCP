import { JavaParserClient } from '../java-parser-client.js';

export interface GetDtoStructureArgs {
  class_name: string;
  max_depth?: number;
  include_annotations?: boolean;
  include_inheritance?: boolean;
}

/**
 * Recursively extracts complete DTO structure including all nested objects,
 * validation annotations, and Lombok annotations.
 * Handles circular references.
 */
export async function getDtoStructure(
  client: JavaParserClient,
  args: GetDtoStructureArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('get_dto_structure', {
      className: args.class_name,
      maxDepth: args.max_depth ?? 10,
      includeAnnotations: args.include_annotations ?? true,
      includeInheritance: args.include_inheritance ?? true,
    });

    return formatDtoStructure(result, args.class_name);
  } catch (error: any) {
    return formatError('DTO Structure', error, args);
  }
}

function formatDtoStructure(result: any, className: string): string {
  const {
    packageName,
    filePath,
    annotations,
    parentClass,
    interfaces,
    fields,
    maxDepthReached,
    circularReferences,
    nestedDtos,
    totalFields,
    fileReferences,
  } = result;

  let markdown = `# DTO Structure: ${className}\n\n`;

  markdown += `## Class Information\n`;
  markdown += `- **Package:** ${packageName}\n`;
  markdown += `- **File:** \`${filePath}\`\n`;

  if (annotations && annotations.length > 0) {
    markdown += `- **Annotations:** ${annotations.join(', ')}\n`;
  }

  if (parentClass) {
    markdown += `- **Parent Class:** ${parentClass}\n`;
  }

  if (interfaces && interfaces.length > 0) {
    markdown += `- **Interfaces:** ${interfaces.join(', ')}\n`;
  }
  markdown += '\n';

  // Fields
  if (fields && fields.length > 0) {
    markdown += `## Fields\n\n`;

    fields.forEach((field: any) => {
      markdown += `### ${field.name} (${field.type})\n`;
      markdown += `- **Type:** ${field.fullType}\n`;
      markdown += `- **Collection:** ${field.isCollection ? `Yes (${field.collectionType})` : 'No'}\n`;
      markdown += `- **Custom Class:** ${field.isCustomClass ? 'Yes' : 'No'}\n`;
      markdown += `- **Required:** ${field.isRequired ? 'Yes' : 'No'}\n`;

      if (field.validationAnnotations && field.validationAnnotations.length > 0) {
        markdown += `- **Validation:** ${field.validationAnnotations.join(', ')}\n`;
      }

      markdown += `- **Line:** ${field.lineNumber}\n`;

      // If this field is a custom class, show its structure
      if (field.nestedStructure) {
        markdown += `\n`;
        markdown += formatNestedStructure(field.nestedStructure, 4);
      }

      markdown += `\n`;
    });
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Fields:** ${totalFields}\n`;

  if (nestedDtos && nestedDtos.length > 0) {
    markdown += `- **Nested DTOs:** ${nestedDtos.length} (${nestedDtos.join(', ')})\n`;
  }

  markdown += `- **Max Depth Reached:** ${maxDepthReached}\n`;

  if (circularReferences && circularReferences.length > 0) {
    markdown += `- **Circular References:** Yes (${circularReferences.join(', ')})\n`;
  } else {
    markdown += `- **Circular References:** No\n`;
  }

  // File References
  if (fileReferences && fileReferences.length > 0) {
    markdown += `\n## File References\n`;
    fileReferences.forEach((ref: string) => {
      markdown += `- \`${ref}\`\n`;
    });
  }

  markdown += `\n---\n`;
  markdown += `Structure extracted with ${maxDepthReached} levels of nesting.\n`;

  return markdown;
}

function formatNestedStructure(nested: any, indent: number): string {
  const prefix = ' '.repeat(indent);
  let markdown = `${prefix}#### ${nested.className} Structure\n`;
  markdown += `${prefix}**File:** \`${nested.filePath}\`\n\n`;
  markdown += `${prefix}**Fields:**\n`;

  if (nested.fields && nested.fields.length > 0) {
    nested.fields.forEach((field: any) => {
      const required = field.isRequired ? 'Required' : 'Optional';
      markdown += `${prefix}- \`${field.name}\` (${field.type}) - ${required}, Line ${field.lineNumber}\n`;
    });
  } else {
    markdown += `${prefix}- (No fields or max depth reached)\n`;
  }

  markdown += `\n`;
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
    markdown += `- Verify class name spelling\n`;
    markdown += `- Check if class is in configured DTO packages\n`;
    markdown += `- Use \`resolve_symbol\` to find correct class name\n\n`;
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
