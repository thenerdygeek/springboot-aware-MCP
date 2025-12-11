import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindAllUsagesArgs {
  identifier: string;
  identifier_type: 'method' | 'class' | 'field';
  scope_class?: string;
  include_tests?: boolean;
}

/**
 * Finds every usage of a method, class, or field in the codebase.
 * Critical for impact analysis when changing signatures or implementations.
 */
export async function findAllUsages(
  client: JavaParserClient,
  args: FindAllUsagesArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_all_usages', {
      identifier: args.identifier,
      identifierType: args.identifier_type,
      scopeClass: args.scope_class,
      includeTests: args.include_tests ?? true,
    });

    return formatUsages(result, args.identifier, args.identifier_type);
  } catch (error: any) {
    return formatError('Usage Search', error, args);
  }
}

function formatUsages(result: any, identifier: string, identifierType: string): string {
  const {
    totalUsages,
    usages,
    groupedByModule,
    impactAssessment,
    recommendations,
    fileReferences,
  } = result;

  let markdown = `# Usage Analysis: ${identifier}\n\n`;

  // Identifier Info
  markdown += `## Identifier Info\n`;
  markdown += `- **Name:** ${identifier}\n`;
  markdown += `- **Type:** ${identifierType.charAt(0).toUpperCase() + identifierType.slice(1)}\n`;
  markdown += `- **Total Usages:** ${totalUsages}\n\n`;

  // Usages
  if (usages && usages.length > 0) {
    markdown += `## Usages\n\n`;

    usages.forEach((usage: any, index: number) => {
      markdown += `### Usage ${index + 1}: ${usage.className}.${usage.methodName}\n`;
      markdown += `**Location:** \`${usage.file}:${usage.line}\`\n\n`;

      if (usage.context) {
        markdown += `**Context:**\n`;
        markdown += '```java\n';
        markdown += usage.context;
        markdown += '\n```\n\n';
      }

      markdown += `**Usage Type:** ${usage.usageType}\n\n`;
    });
  }

  // Grouped by Module
  if (groupedByModule && Object.keys(groupedByModule).length > 0) {
    markdown += `## Grouped by Module\n\n`;
    markdown += `| Module | Count |\n`;
    markdown += `|--------|-------|\n`;
    Object.entries(groupedByModule).forEach(([module, count]) => {
      markdown += `| ${module} | ${count} |\n`;
    });
    markdown += `\n`;
  }

  // Impact Assessment
  if (impactAssessment) {
    markdown += `## Impact Assessment\n\n`;

    if (impactAssessment.productionCode) {
      markdown += `### Production Code\n`;
      markdown += `- **Critical Usages:** ${impactAssessment.productionCode.criticalUsages}\n`;
      if (impactAssessment.productionCode.willBreak && impactAssessment.productionCode.willBreak.length > 0) {
        markdown += `- **Will Break:**\n`;
        impactAssessment.productionCode.willBreak.forEach((file: string) => {
          markdown += `  - \`${file}\`\n`;
        });
      }
      markdown += `\n`;
    }

    if (impactAssessment.testCode) {
      markdown += `### Test Code\n`;
      markdown += `- **Tests to Update:** ${impactAssessment.testCode.testsToUpdate}\n\n`;
    }

    if (impactAssessment.riskLevel) {
      markdown += `### Risk Level\n`;
      markdown += `**${impactAssessment.riskLevel}**\n\n`;
    }
  }

  // Recommendations
  if (recommendations) {
    markdown += `## Recommendations\n`;
    if (recommendations.productionFiles !== undefined) {
      markdown += `- Update ${recommendations.productionFiles} production file(s)\n`;
    }
    if (recommendations.testFiles !== undefined) {
      markdown += `- Update ${recommendations.testFiles} test file(s)\n`;
    }
    if (recommendations.estimatedEffort) {
      markdown += `- Estimated effort: ${recommendations.estimatedEffort}\n`;
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
  markdown += `Found ${totalUsages} usage(s) across ${fileReferences?.length || 0} file(s).\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Identifier "${context.identifier}" not found`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Identifier doesn't exist\n`;
  markdown += `- Typo in name\n`;
  markdown += `- Identifier is private/internal\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Check spelling\n`;
  markdown += `- Verify identifier exists\n`;
  markdown += `- Try different identifier_type\n\n`;

  markdown += `**Context:** Searched for ${context.identifier_type} "${context.identifier}"\n`;

  return markdown;
}
