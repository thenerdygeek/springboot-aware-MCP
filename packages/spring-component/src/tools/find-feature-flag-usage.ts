import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindFeatureFlagUsageArgs {
  flag_identifier?: string;
  search_pattern?: string;
}

/**
 * Finds all places where feature flags control conditional logic.
 * Detects patterns like isFeatureEnabled(), config checks, and flag conditionals.
 */
export async function findFeatureFlagUsage(
  client: JavaParserClient,
  args: FindFeatureFlagUsageArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_feature_flag_usage', {
      flagIdentifier: args.flag_identifier,
      searchPattern: args.search_pattern,
    });

    return formatFeatureFlagUsage(result, args.flag_identifier, args.search_pattern);
  } catch (error: any) {
    return formatError('Feature Flag Analysis', error, args);
  }
}

function formatFeatureFlagUsage(
  result: any,
  flagIdentifier?: string,
  searchPattern?: string
): string {
  const {
    flags,
    totalFlags,
    totalUsages,
    flagImpact,
    configSources,
    summary,
    recommendations,
    fileReferences,
  } = result;

  let markdown = `# Feature Flag Usage Analysis\n\n`;

  if (flagIdentifier) {
    markdown += `## Searching for: ${flagIdentifier}\n\n`;
  }

  if (searchPattern) {
    markdown += `## Pattern: ${searchPattern}\n\n`;
  }

  if (!flags || flags.length === 0) {
    markdown += `## No Feature Flags Found\n\n`;
    markdown += `**No feature flag patterns detected in this project.**\n\n`;
    markdown += `**Common feature flag patterns:**\n`;
    markdown += `- \`if (isFeatureEnabled("feature_name"))\`\n`;
    markdown += `- \`if (config.getFeatureFlag("feature_name"))\`\n`;
    markdown += `- \`if (featureFlags.get("feature_name"))\`\n`;
    markdown += `- \`@ConditionalOnProperty("feature.enabled")\`\n\n`;
    return markdown;
  }

  markdown += `## Flags Detected: ${totalFlags}\n\n`;

  // Each flag
  flags.forEach((flag: any, index: number) => {
    markdown += `### Flag ${index + 1}: ${flag.name}\n\n`;

    // Flag definition
    if (flag.definition) {
      markdown += `#### Flag Definition\n`;
      markdown += `- **Type:** ${flag.definition.type}\n`;
      markdown += `- **Location:** ${flag.definition.location}\n`;
      if (flag.definition.defaultValue !== undefined) {
        markdown += `- **Default:** ${flag.definition.defaultValue}\n`;
      }
      markdown += `\n`;
    }

    // Usage locations
    if (flag.usages && flag.usages.length > 0) {
      markdown += `#### Usage Locations: ${flag.usages.length}\n\n`;

      flag.usages.forEach((usage: any, usageIndex: number) => {
        markdown += `##### Usage ${usageIndex + 1}: ${usage.className}.${usage.methodName}\n`;
        markdown += `**Location:** \`${usage.file}:${usage.line}\`\n\n`;

        if (usage.code) {
          markdown += `**Conditional Logic:**\n\`\`\`java\n${usage.code}\n\`\`\`\n\n`;
        }

        if (usage.conditionType) {
          markdown += `**Condition Type:** ${usage.conditionType}\n\n`;
        }

        if (usage.branches) {
          markdown += `**Branches:**\n`;
          if (usage.branches.enabled) {
            markdown += `- ✓ Flag Enabled: ${usage.branches.enabled}\n`;
          }
          if (usage.branches.disabled) {
            markdown += `- ✗ Flag Disabled: ${usage.branches.disabled}\n`;
          }
          markdown += `\n`;
        }

        if (usage.impact) {
          markdown += `**Impact:** ${usage.impact}\n\n`;
        }
      });
    }
  });

  // Flag Impact Analysis
  if (flagImpact && flagImpact.length > 0) {
    markdown += `## Flag Impact Analysis\n\n`;

    flagImpact.forEach((impact: any) => {
      markdown += `### ${impact.flagName}\n`;
      markdown += `**Affects:** ${impact.componentCount} component(s)\n\n`;

      if (impact.components && impact.components.length > 0) {
        markdown += `| Component | Impact | File |\n`;
        markdown += `|-----------|--------|------|\n`;
        impact.components.forEach((comp: any) => {
          markdown += `| ${comp.name} | ${comp.impact} | ${comp.file} |\n`;
        });
        markdown += `\n`;
      }

      if (impact.dependencies && impact.dependencies.length > 0) {
        markdown += `**Dependencies:**\n`;
        impact.dependencies.forEach((dep: string) => {
          markdown += `- Depends on: ${dep}\n`;
        });
        markdown += `\n`;
      }
    });
  }

  // Configuration Sources
  if (configSources) {
    markdown += `## Flag Configuration Sources\n\n`;

    if (configSources.database && configSources.database.length > 0) {
      markdown += `### Database Flags\n`;
      configSources.database.forEach((flag: any) => {
        markdown += `- ${flag.name}: ${flag.source}\n`;
      });
      markdown += `\n`;
    }

    if (configSources.config && configSources.config.length > 0) {
      markdown += `### Config Flags\n`;
      configSources.config.forEach((flag: any) => {
        markdown += `- ${flag.name}: ${flag.key}\n`;
      });
      markdown += `\n`;
    }

    if (configSources.request && configSources.request.length > 0) {
      markdown += `### Request Flags\n`;
      configSources.request.forEach((flag: any) => {
        markdown += `- ${flag.name}: ${flag.source}\n`;
      });
      markdown += `\n`;
    }
  }

  // Summary
  if (summary) {
    markdown += `## Summary\n`;
    markdown += `- **Total Flags:** ${summary.totalFlags}\n`;
    markdown += `- **Total Usages:** ${summary.totalUsages}\n`;
    markdown += `- **Files Affected:** ${summary.filesAffected}\n\n`;
  }

  // Recommendations
  if (recommendations && recommendations.length > 0) {
    markdown += `## Recommendations\n`;
    recommendations.forEach((rec: string) => {
      markdown += `- ${rec}\n`;
    });
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
  markdown += `Found ${totalFlags} flag(s) with ${totalUsages} usage(s).\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || 'No feature flags found'}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- No feature flags in the project\n`;
  markdown += `- Pattern not matching flag implementation\n`;
  markdown += `- Flags implemented differently than expected\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Search for common patterns: isEnabled, isFeatureEnabled, hasFlag\n`;
  markdown += `- Check configuration classes for flag definitions\n`;
  markdown += `- Look for @ConditionalOnProperty annotations\n`;
  markdown += `- Search for if statements with boolean flags\n\n`;

  if (context.flag_identifier) {
    markdown += `**Context:** Searched for flag "${context.flag_identifier}"\n`;
  } else if (context.search_pattern) {
    markdown += `**Context:** Searched with pattern "${context.search_pattern}"\n`;
  } else {
    markdown += `**Context:** Searched for all feature flags\n`;
  }

  return markdown;
}
