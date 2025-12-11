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
    simpleName,
    packageName,
    filePath,
    classType,
    isInterface,
    isAbstract,
    classAnnotations,
    lombokAnnotations,
    fields,
    circular,
    maxDepthReached,
    isCustomClass,
  } = result;

  let markdown = `# DTO Structure: ${className}\n\n`;

  // Handle circular reference
  if (circular) {
    markdown += `⚠️ **Circular Reference Detected**\n\n`;
    markdown += `This class was already analyzed in a parent structure, preventing infinite recursion.\n`;
    return markdown;
  }

  // Handle max depth reached
  if (maxDepthReached) {
    markdown += `⚠️ **Maximum Depth Reached**\n\n`;
    markdown += `Analysis stopped at maximum configured depth.\n`;
    return markdown;
  }

  // Handle non-custom classes (framework/JDK classes)
  if (isCustomClass === false) {
    markdown += `## Framework/JDK Class\n`;
    markdown += `- **Package:** ${packageName}\n`;
    markdown += `- **Note:** This is not a custom class from your codebase.\n`;
    return markdown;
  }

  markdown += `## Class Information\n`;
  markdown += `- **Simple Name:** ${simpleName}\n`;
  markdown += `- **Package:** ${packageName}\n`;
  markdown += `- **Type:** ${classType}\n`;
  markdown += `- **File:** \`${filePath}\`\n`;

  if (isInterface) {
    markdown += `- **Is Interface:** Yes\n`;
  }
  if (isAbstract) {
    markdown += `- **Is Abstract:** Yes\n`;
  }
  markdown += '\n';

  // Class Annotations
  if (classAnnotations && classAnnotations.length > 0) {
    markdown += `## Class Annotations\n`;
    classAnnotations.forEach((ann: any) => {
      markdown += `- \`${ann.fullAnnotation}\`\n`;
    });
    markdown += '\n';
  }

  // Lombok Info
  if (lombokAnnotations) {
    const hasAnyLombok = lombokAnnotations.hasData || lombokAnnotations.hasGetter ||
                         lombokAnnotations.hasSetter || lombokAnnotations.hasBuilder ||
                         lombokAnnotations.hasAllArgsConstructor || lombokAnnotations.hasNoArgsConstructor;

    if (hasAnyLombok) {
      markdown += `## Lombok Features\n`;
      if (lombokAnnotations.hasData) markdown += `- ✅ **@Data** - Auto-generates getters, setters, toString, equals, hashCode\n`;
      if (lombokAnnotations.hasGetter) markdown += `- ✅ **@Getter** - Auto-generates getter methods\n`;
      if (lombokAnnotations.hasSetter) markdown += `- ✅ **@Setter** - Auto-generates setter methods\n`;
      if (lombokAnnotations.hasBuilder) markdown += `- ✅ **@Builder** - Enables builder pattern\n`;
      if (lombokAnnotations.hasAllArgsConstructor) markdown += `- ✅ **@AllArgsConstructor** - Generates constructor with all fields\n`;
      if (lombokAnnotations.hasNoArgsConstructor) markdown += `- ✅ **@NoArgsConstructor** - Generates no-args constructor\n`;
      markdown += '\n';
    }
  }

  // Fields
  if (fields && fields.length > 0) {
    markdown += `## Fields (${fields.length} total)\n\n`;

    fields.forEach((field: any) => {
      const typeInfo = field.typeInfo || {};

      markdown += `### ${field.name}\n`;
      markdown += `- **Type:** \`${field.type}\`\n`;
      markdown += `- **Visibility:** ${field.visibility}\n`;

      if (field.isFinal) {
        markdown += `- **Final:** Yes\n`;
      }

      // Type analysis
      if (typeInfo.isCollection) {
        markdown += `- **Collection:** Yes (${typeInfo.isList ? 'List' : typeInfo.isSet ? 'Set' : 'Collection'})\n`;
        if (typeInfo.elementType) {
          markdown += `- **Element Type:** \`${typeInfo.elementType}\`\n`;
        }
      } else if (typeInfo.isMap) {
        markdown += `- **Map:** Yes\n`;
        if (typeInfo.keyType && typeInfo.valueType) {
          markdown += `- **Key Type:** \`${typeInfo.keyType}\`\n`;
          markdown += `- **Value Type:** \`${typeInfo.valueType}\`\n`;
        }
      }

      if (typeInfo.isPrimitive) {
        markdown += `- **Primitive/Wrapper:** Yes\n`;
      }

      // Annotations
      if (field.annotations && field.annotations.length > 0) {
        const validationAnns = field.annotations.filter((a: any) => a.isValidation);
        const otherAnns = field.annotations.filter((a: any) => !a.isValidation);

        if (validationAnns.length > 0) {
          markdown += `- **Validation:** `;
          markdown += validationAnns.map((a: any) => `\`${a.fullAnnotation}\``).join(', ') + '\n';
        }

        if (otherAnns.length > 0) {
          markdown += `- **Annotations:** `;
          markdown += otherAnns.map((a: any) => `\`${a.fullAnnotation}\``).join(', ') + '\n';
        }
      }

      // Nested structure
      if (field.nestedStructure) {
        markdown += `\n**Nested Structure:**\n`;
        markdown += formatNestedStructure(field.nestedStructure, 4);
      }

      if (field.elementStructure && typeInfo.isCollection) {
        markdown += `\n**Element Type Structure:**\n`;
        markdown += formatNestedStructure(field.elementStructure, 4);
      }

      if (field.valueStructure && typeInfo.isMap) {
        markdown += `\n**Map Value Type Structure:**\n`;
        markdown += formatNestedStructure(field.valueStructure, 4);
      }

      markdown += `\n`;
    });
  } else {
    markdown += `## Fields\n\nNo fields found (or all fields are static).\n\n`;
  }

  return markdown;
}

function formatNestedStructure(nested: any, indent: number): string {
  const prefix = ' '.repeat(indent);

  // Handle circular reference
  if (nested.circular) {
    return `${prefix}_Circular reference to ${nested.className}_\n\n`;
  }

  // Handle max depth
  if (nested.maxDepthReached) {
    return `${prefix}_Max depth reached for ${nested.className}_\n\n`;
  }

  // Handle non-custom class
  if (nested.isCustomClass === false) {
    return `${prefix}_Framework class: ${nested.className}_\n\n`;
  }

  let markdown = `${prefix}**Class:** ${nested.simpleName || nested.className}\n`;
  markdown += `${prefix}**Type:** ${nested.classType}\n`;

  if (nested.filePath) {
    markdown += `${prefix}**File:** \`${nested.filePath}\`\n`;
  }

  if (nested.fields && nested.fields.length > 0) {
    markdown += `${prefix}**Fields:** ${nested.fields.length} total\n`;
    nested.fields.forEach((field: any) => {
      const typeInfo = field.typeInfo || {};
      const validationAnns = field.annotations?.filter((a: any) => a.isValidation) || [];
      const validationStr = validationAnns.length > 0 ? ` [Validated]` : '';

      if (typeInfo.isCollection) {
        markdown += `${prefix}- \`${field.name}\`: ${typeInfo.isList ? 'List' : 'Set'}<${typeInfo.elementType}>${validationStr}\n`;
      } else if (typeInfo.isMap) {
        markdown += `${prefix}- \`${field.name}\`: Map<${typeInfo.keyType}, ${typeInfo.valueType}>${validationStr}\n`;
      } else {
        markdown += `${prefix}- \`${field.name}\`: ${field.type}${validationStr}\n`;
      }
    });
  } else {
    markdown += `${prefix}**Fields:** None\n`;
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
