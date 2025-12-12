import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindImplementationsArgs {
  interface_or_abstract_class: string;
}

/**
 * Finds all classes implementing an interface or extending an abstract class.
 * Shows inheritance hierarchy, overridden methods, and usage patterns.
 */
export async function findImplementations(
  client: JavaParserClient,
  args: FindImplementationsArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_implementations', {
      interfaceOrAbstractClass: args.interface_or_abstract_class,
    });

    return formatImplementations(result, args.interface_or_abstract_class);
  } catch (error: any) {
    return formatError('Implementation Search', error, args);
  }
}

function formatImplementations(result: any, targetName: string): string {
  const {
    parentType,
    methods,
    implementations,
    hierarchy,
    summary,
    usagePatterns,
    fileReferences,
  } = result;

  let markdown = `# Implementations: ${targetName}\n\n`;

  if (!parentType) {
    markdown += `## Not Found\n\n`;
    markdown += `Interface or abstract class \`${targetName}\` not found in the workspace.\n\n`;
    return markdown;
  }

  // Parent Type Info
  markdown += `## Parent Type\n`;
  markdown += `- **Name:** ${parentType.name}\n`;
  markdown += `- **Type:** ${parentType.type}\n`;
  markdown += `- **File:** \`${parentType.file}\`\n`;
  markdown += `- **Package:** ${parentType.package}\n\n`;

  // Methods Defined
  if (methods && methods.length > 0) {
    markdown += `## Methods Defined\n\n`;
    methods.forEach((method: any) => {
      markdown += `- \`${method}\`\n`;
    });
    markdown += `\n`;
  }

  // Implementations
  if (implementations && implementations.length > 0) {
    markdown += `## Implementations: ${implementations.length}\n\n`;

    implementations.forEach((impl: any, index: number) => {
      markdown += `### Implementation ${index + 1}: ${impl.className}\n`;
      markdown += `- **File:** \`${impl.file}\`\n`;
      markdown += `- **Package:** ${impl.package}\n`;
      markdown += `- **Abstract:** ${impl.isAbstract ? 'Yes' : 'No'}\n\n`;

      // Overridden Methods
      if (impl.overriddenMethods && impl.overriddenMethods.length > 0) {
        markdown += `**Overridden Methods:**\n`;
        impl.overriddenMethods.forEach((method: string) => {
          markdown += `- ✓ ${method}\n`;
        });
        markdown += `\n`;
      }

      // Not Implemented Methods
      if (impl.notImplementedMethods && impl.notImplementedMethods.length > 0) {
        markdown += `**Not Implemented:**\n`;
        impl.notImplementedMethods.forEach((method: string) => {
          markdown += `- ✗ ${method} ← Not implemented\n`;
        });
        markdown += `\n`;
      }

      // Additional Methods
      if (impl.additionalMethods && impl.additionalMethods.length > 0) {
        markdown += `**Additional Methods:**\n`;
        impl.additionalMethods.forEach((method: string) => {
          markdown += `- ${method}\n`;
        });
        markdown += `\n`;
      }

      // Annotations
      if (impl.annotations && impl.annotations.length > 0) {
        markdown += `**Annotations:**\n`;
        impl.annotations.forEach((ann: string) => {
          markdown += `- ${ann}\n`;
        });
        markdown += `\n`;
      }

      // Usage Context
      if (impl.usageContext) {
        markdown += `**Usage Context:**\n${impl.usageContext}\n\n`;
      }
    });
  }

  // Inheritance Hierarchy
  if (hierarchy) {
    markdown += `## Inheritance Hierarchy\n\`\`\`\n${hierarchy}\n\`\`\`\n\n`;
  }

  // Summary
  if (summary) {
    markdown += `## Summary\n`;
    markdown += `- **Total Implementations:** ${summary.total}\n`;
    markdown += `- **Direct:** ${summary.direct}\n`;
    markdown += `- **Indirect:** ${summary.indirect}\n`;
    markdown += `- **Abstract:** ${summary.abstract}\n\n`;
  }

  // Usage Patterns
  if (usagePatterns) {
    markdown += `## Usage Patterns\n`;
    if (usagePatterns.strategyPattern !== undefined) {
      markdown += `- **Strategy Pattern:** ${usagePatterns.strategyPattern ? 'Yes' : 'No'}\n`;
    }
    if (usagePatterns.polymorphicUsage) {
      markdown += `- **Polymorphic Usage:** ${usagePatterns.polymorphicUsage}\n`;
    }
    markdown += `\n`;
  }

  // File References
  if (fileReferences && fileReferences.length > 0) {
    markdown += `## File References\n\n`;
    fileReferences.forEach((ref: string) => {
      markdown += `- \`${ref}\`\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n`;
  markdown += `Found ${implementations ? implementations.length : 0} implementation(s).\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Interface/Abstract class "${context.interface_or_abstract_class}" not found`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Class name typo\n`;
  markdown += `- Class not in workspace\n`;
  markdown += `- Class is a regular class (not interface/abstract)\n`;
  markdown += `- Package not scanned\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Verify class name spelling\n`;
  markdown += `- Check if class exists in project\n`;
  markdown += `- Confirm class is interface or abstract\n`;
  markdown += `- Use fully qualified name if needed\n\n`;

  markdown += `**Context:** Searched for "${context.interface_or_abstract_class}"\n`;

  return markdown;
}
