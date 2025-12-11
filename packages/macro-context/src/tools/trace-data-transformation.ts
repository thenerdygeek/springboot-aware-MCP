import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface TraceDataTransformationArgs {
  dto_class_name: string;
  endpoint?: string;
  direction?: 'request' | 'response' | 'both';
}

/**
 * Traces how a DTO transforms through architecture layers
 * (Request → Service → Entity → Database → Response).
 */
export async function traceDataTransformation(
  client: JavaParserClient,
  args: TraceDataTransformationArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('trace_data_transformation', {
      dtoClassName: args.dto_class_name,
      endpoint: args.endpoint,
      direction: args.direction ?? 'both',
    });

    return formatDataTransformation(result, args.dto_class_name);
  } catch (error: any) {
    return formatError('Data Transformation Trace', error, args);
  }
}

function formatDataTransformation(result: any, dtoClassName: string): string {
  const {
    startingPoint,
    transformationSteps,
    flowDiagram,
    fieldsLost,
    fieldsAdded,
    totalSteps,
    layers,
    fileReferences,
  } = result;

  let markdown = `# Data Transformation Flow: ${dtoClassName}\n\n`;

  // Starting Point
  if (startingPoint) {
    markdown += `## Starting Point\n`;
    markdown += `- **DTO:** ${startingPoint.dtoClass}\n`;
    markdown += `- **File:** \`${startingPoint.file}\`\n`;
    markdown += `- **Direction:** ${startingPoint.direction}\n\n`;
  }

  // Transformation Steps
  if (transformationSteps && transformationSteps.length > 0) {
    markdown += `## Transformation Steps\n\n`;

    transformationSteps.forEach((step: any, index: number) => {
      markdown += `### Step ${index + 1}: ${step.fromLayer} → ${step.toLayer}\n`;
      markdown += `**${step.fromType} → ${step.toType}**\n\n`;

      if (step.transformer) {
        markdown += `**Transformer:**\n`;
        markdown += `- **Class:** ${step.transformer.className}\n`;
        markdown += `- **Method:** ${step.transformer.methodName}\n`;
        markdown += `- **File:** \`${step.transformer.file}:${step.transformer.line}\`\n\n`;
      }

      if (step.transformationLogic) {
        markdown += `**Transformation Logic:**\n`;
        markdown += `${step.transformationLogic}\n\n`;
      }

      if (step.fieldsChanged) {
        markdown += `**Fields Changed:**\n`;
        if (step.fieldsChanged.preserved && step.fieldsChanged.preserved.length > 0) {
          markdown += `- ✓ Preserved: ${step.fieldsChanged.preserved.join(', ')}\n`;
        }
        if (step.fieldsChanged.added && step.fieldsChanged.added.length > 0) {
          markdown += `- ⊕ Added: ${step.fieldsChanged.added.map((f: any) =>
            `${f.name} (source: ${f.source})`).join(', ')}\n`;
        }
        if (step.fieldsChanged.removed && step.fieldsChanged.removed.length > 0) {
          markdown += `- ⊖ Removed: ${step.fieldsChanged.removed.map((f: any) =>
            `${f.name} (reason: ${f.reason})`).join(', ')}\n`;
        }
        if (step.fieldsChanged.modified && step.fieldsChanged.modified.length > 0) {
          markdown += `- ⚠ Modified: ${step.fieldsChanged.modified.map((f: any) =>
            `${f.name} (how: ${f.description})`).join(', ')}\n`;
        }
        markdown += `\n`;
      }
    });
  }

  // Complete Flow Diagram
  if (flowDiagram) {
    markdown += `## Complete Flow Diagram\n\n`;
    markdown += '```\n';
    markdown += flowDiagram;
    markdown += '\n```\n\n';
  }

  // Field Tracking
  if ((fieldsLost && fieldsLost.length > 0) || (fieldsAdded && fieldsAdded.length > 0)) {
    markdown += `## Field Tracking\n\n`;

    if (fieldsLost && fieldsLost.length > 0) {
      markdown += `### Fields Lost\n\n`;
      markdown += `| Field | Lost At | Reason |\n`;
      markdown += `|-------|---------|--------|\n`;
      fieldsLost.forEach((field: any) => {
        markdown += `| ${field.name} | Step ${field.step} | ${field.reason} |\n`;
      });
      markdown += `\n`;
    }

    if (fieldsAdded && fieldsAdded.length > 0) {
      markdown += `### Fields Added\n\n`;
      markdown += `| Field | Added At | Source |\n`;
      markdown += `|-------|----------|--------|\n`;
      fieldsAdded.forEach((field: any) => {
        markdown += `| ${field.name} | Step ${field.step} | ${field.source} |\n`;
      });
      markdown += `\n`;
    }
  }

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Steps:** ${totalSteps}\n`;
  if (layers && layers.length > 0) {
    markdown += `- **Layers:** ${layers.join(', ')}\n`;
  }
  markdown += `\n`;

  // File References
  if (fileReferences && fileReferences.length > 0) {
    markdown += `## File References\n\n`;
    fileReferences.forEach((ref: string) => {
      markdown += `- \`${ref}\`\n`;
    });
    markdown += `\n`;
  }

  markdown += `---\n`;
  markdown += `Traced through ${totalSteps} step(s).\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Cannot trace transformation for "${context.dto_class_name}"`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- DTO not used in any endpoint\n`;
  markdown += `- No mapper/transformer found\n`;
  markdown += `- DTO is standalone (not transformed)\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Verify DTO is used in controllers\n`;
  markdown += `- Check for mapper classes\n`;
  markdown += `- Use \`find_all_usages\` to see DTO usage\n\n`;

  markdown += `**Context:** Searched for transformations from ${context.dto_class_name}\n`;

  return markdown;
}
