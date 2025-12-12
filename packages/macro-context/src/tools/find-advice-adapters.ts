import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindAdviceAdaptersArgs {
  target_class?: string;
  target_method?: string;
}

/**
 * Finds AOP advice and adapters that intercept specific methods or classes.
 * Searches for @Aspect classes and analyzes pointcut expressions.
 */
export async function findAdviceAdapters(
  client: JavaParserClient,
  args: FindAdviceAdaptersArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_advice_adapters', {
      targetClass: args.target_class,
      targetMethod: args.target_method,
    });

    return formatAdviceAdapters(result, args.target_class, args.target_method);
  } catch (error: any) {
    return formatError('AOP Advice Search', error, args);
  }
}

function formatAdviceAdapters(result: any, targetClass?: string, targetMethod?: string): string {
  const {
    aspects,
    totalAspects,
    totalAdvice,
    adviceByType,
    matchingAdvice,
    executionOrder,
    fileReferences,
  } = result;

  let markdown = `# AOP Advice and Adapters\n\n`;

  if (targetClass || targetMethod) {
    markdown += `## Search Criteria\n`;
    if (targetClass) {
      markdown += `- **Target Class:** ${targetClass}\n`;
    }
    if (targetMethod) {
      markdown += `- **Target Method:** ${targetMethod}\n`;
    }
    markdown += `\n`;
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Aspects:** ${totalAspects}\n`;
  markdown += `- **Total Advice:** ${totalAdvice}\n\n`;

  // Advice by type
  if (adviceByType && Object.keys(adviceByType).length > 0) {
    markdown += `### Advice by Type\n\n`;
    markdown += `| Type | Count |\n`;
    markdown += `|------|-------|\n`;
    Object.entries(adviceByType).forEach(([type, count]) => {
      markdown += `| ${type} | ${count} |\n`;
    });
    markdown += `\n`;
  }

  // Matching Advice (if target specified)
  if (matchingAdvice && matchingAdvice.length > 0) {
    markdown += `## Matching Advice\n\n`;

    matchingAdvice.forEach((advice: any, index: number) => {
      markdown += `### Match ${index + 1}: ${advice.aspectClass}.${advice.adviceName}\n`;
      markdown += `- **Type:** ${advice.adviceType}\n`;
      markdown += `- **File:** \`${advice.file}:${advice.line}\`\n`;
      markdown += `- **Pointcut:** \`${advice.pointcut}\`\n`;

      if (advice.order !== undefined) {
        markdown += `- **Order:** ${advice.order}\n`;
      }

      if (advice.description) {
        markdown += `\n**Description:** ${advice.description}\n`;
      }

      markdown += `\n`;
    });
  }

  // All Aspects
  if (aspects && aspects.length > 0) {
    markdown += `## All Aspects\n\n`;

    aspects.forEach((aspect: any) => {
      markdown += `### ${aspect.className}\n`;
      markdown += `- **File:** \`${aspect.file}\`\n`;

      if (aspect.order !== undefined) {
        markdown += `- **Order:** ${aspect.order}\n`;
      }

      if (aspect.advice && aspect.advice.length > 0) {
        markdown += `\n**Advice Methods:**\n\n`;

        aspect.advice.forEach((adv: any) => {
          markdown += `#### ${adv.name} (${adv.type})\n`;
          markdown += `- **Pointcut:** \`${adv.pointcut}\`\n`;

          if (adv.returning) {
            markdown += `- **Returning:** ${adv.returning}\n`;
          }

          if (adv.throwing) {
            markdown += `- **Throwing:** ${adv.throwing}\n`;
          }

          markdown += `\n`;
        });
      }

      markdown += `\n`;
    });
  }

  // Execution Order
  if (executionOrder && executionOrder.length > 0) {
    markdown += `## Execution Order\n\n`;
    markdown += `Aspects will execute in this order:\n\n`;

    executionOrder.forEach((aspect: any, index: number) => {
      markdown += `${index + 1}. **${aspect.className}**`;

      if (aspect.order !== undefined) {
        markdown += ` (order: ${aspect.order})`;
      }

      markdown += `\n`;
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

  if (matchingAdvice && matchingAdvice.length > 0) {
    markdown += `Found ${matchingAdvice.length} matching advice interceptor(s).\n`;
  } else {
    markdown += `Found ${totalAspects} aspect(s) with ${totalAdvice} total advice method(s).\n`;
  }

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || 'No aspects found'}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- No @Aspect classes in the project\n`;
  markdown += `- AspectJ/Spring AOP not configured\n`;
  markdown += `- Target class/method not intercepted\n`;
  markdown += `- Pointcut expressions don't match target\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Check for @Aspect annotated classes\n`;
  markdown += `- Verify Spring AOP is enabled (@EnableAspectJAutoProxy)\n`;
  markdown += `- Review pointcut expressions\n`;
  markdown += `- Check package scanning includes aspects\n\n`;

  markdown += `**Context:** Searched for AOP advice`;

  if (context.target_class) {
    markdown += ` targeting class "${context.target_class}"`;
  }

  if (context.target_method) {
    markdown += ` and method "${context.target_method}"`;
  }

  markdown += `\n`;

  return markdown;
}
