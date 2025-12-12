import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindFiltersAndOrderArgs {
  filter_type?: 'servlet' | 'interceptor' | 'all';
}

/**
 * Finds servlet filters and interceptors with their execution order.
 * Shows the complete filter chain and @Order annotations.
 */
export async function findFiltersAndOrder(
  client: JavaParserClient,
  args: FindFiltersAndOrderArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_filters_and_order', {
      filterType: args.filter_type || 'all',
    });

    return formatFiltersAndOrder(result, args.filter_type);
  } catch (error: any) {
    return formatError('Filter Chain Analysis', error, args);
  }
}

function formatFiltersAndOrder(result: any, filterType?: string): string {
  const {
    filters,
    interceptors,
    totalFilters,
    totalInterceptors,
    executionOrder,
    filterChain,
    fileReferences,
  } = result;

  let markdown = `# Filters and Interceptors\n\n`;

  if (filterType) {
    markdown += `**Filter Type:** ${filterType}\n\n`;
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Filters:** ${totalFilters}\n`;
  markdown += `- **Total Interceptors:** ${totalInterceptors}\n\n`;

  // Servlet Filters
  if (filters && filters.length > 0) {
    markdown += `## Servlet Filters\n\n`;

    filters.forEach((filter: any, index: number) => {
      markdown += `### ${index + 1}. ${filter.className}\n`;
      markdown += `- **File:** \`${filter.file}\`\n`;

      if (filter.order !== undefined) {
        markdown += `- **Order:** ${filter.order}\n`;
      } else {
        markdown += `- **Order:** Not specified (default: LOWEST_PRECEDENCE)\n`;
      }

      if (filter.urlPatterns && filter.urlPatterns.length > 0) {
        markdown += `- **URL Patterns:** ${filter.urlPatterns.join(', ')}\n`;
      }

      if (filter.filterName) {
        markdown += `- **Filter Name:** ${filter.filterName}\n`;
      }

      if (filter.annotations && filter.annotations.length > 0) {
        markdown += `- **Annotations:** ${filter.annotations.join(', ')}\n`;
      }

      markdown += `\n`;
    });
  }

  // Interceptors
  if (interceptors && interceptors.length > 0) {
    markdown += `## Interceptors\n\n`;

    interceptors.forEach((interceptor: any, index: number) => {
      markdown += `### ${index + 1}. ${interceptor.className}\n`;
      markdown += `- **File:** \`${interceptor.file}\`\n`;

      if (interceptor.order !== undefined) {
        markdown += `- **Order:** ${interceptor.order}\n`;
      } else {
        markdown += `- **Order:** Not specified\n`;
      }

      if (interceptor.pathPatterns && interceptor.pathPatterns.length > 0) {
        markdown += `- **Path Patterns:** ${interceptor.pathPatterns.join(', ')}\n`;
      }

      if (interceptor.excludePatterns && interceptor.excludePatterns.length > 0) {
        markdown += `- **Exclude Patterns:** ${interceptor.excludePatterns.join(', ')}\n`;
      }

      if (interceptor.annotations && interceptor.annotations.length > 0) {
        markdown += `- **Annotations:** ${interceptor.annotations.join(', ')}\n`;
      }

      markdown += `\n`;
    });
  }

  // Execution Order
  if (executionOrder && executionOrder.length > 0) {
    markdown += `## Execution Order\n\n`;
    markdown += `Filters and interceptors will execute in this order:\n\n`;

    executionOrder.forEach((item: any, index: number) => {
      markdown += `${index + 1}. **${item.className}** (${item.type})`;

      if (item.order !== undefined) {
        markdown += ` - order: ${item.order}`;
      }

      markdown += `\n`;
    });

    markdown += `\n`;
  }

  // Filter Chain Diagram
  if (filterChain) {
    markdown += `## Filter Chain Diagram\n\n`;
    markdown += '```\n';
    markdown += filterChain;
    markdown += '\n```\n\n';
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
  markdown += `Found ${totalFilters} filter(s) and ${totalInterceptors} interceptor(s).\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || 'No filters or interceptors found'}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- No filters or interceptors configured\n`;
  markdown += `- Spring Boot auto-configuration not enabled\n`;
  markdown += `- Filters not registered as Spring beans\n`;
  markdown += `- WebMvcConfigurer not implemented\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Check for @Component on Filter classes\n`;
  markdown += `- Verify WebMvcConfigurer implementations\n`;
  markdown += `- Look for FilterRegistrationBean configurations\n`;
  markdown += `- Check application.properties for filter settings\n\n`;

  markdown += `**Context:** Searched for ${context.filter_type || 'all'} filters/interceptors\n`;

  return markdown;
}
