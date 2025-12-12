import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';

export interface FindEntityByTableArgs {
  table_name: string;
  schema?: string;
}

/**
 * Finds JPA entity class mapped to a specific database table.
 * Searches for @Table annotations and matches table names.
 */
export async function findEntityByTable(
  client: JavaParserClient,
  args: FindEntityByTableArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_entity_by_table', {
      tableName: args.table_name,
      schema: args.schema,
    });

    return formatEntityMapping(result, args.table_name);
  } catch (error: any) {
    return formatError('Entity Lookup', error, args);
  }
}

function formatEntityMapping(result: any, tableName: string): string {
  const {
    entity,
    alternativeEntities,
    tableInfo,
    fields,
    relationships,
    indexes,
    constraints,
    fileReference,
  } = result;

  let markdown = `# Entity Mapping: ${tableName}\n\n`;

  if (!entity) {
    markdown += `## No Entity Found\n\n`;
    markdown += `No JPA entity found mapped to table \`${tableName}\`\n\n`;

    if (alternativeEntities && alternativeEntities.length > 0) {
      markdown += `### Similar Table Names Found:\n\n`;
      alternativeEntities.forEach((alt: any) => {
        markdown += `- **${alt.tableName}** → ${alt.entityClass}\n`;
      });
      markdown += `\n`;
    }

    return markdown;
  }

  // Entity Information
  markdown += `## Entity Class\n`;
  markdown += `**${entity.className}**\n\n`;
  markdown += `- **File:** \`${entity.file}\`\n`;
  markdown += `- **Package:** ${entity.package}\n`;

  if (entity.annotations && entity.annotations.length > 0) {
    markdown += `- **Annotations:** ${entity.annotations.join(', ')}\n`;
  }
  markdown += `\n`;

  // Table Information
  if (tableInfo) {
    markdown += `## Table Information\n`;
    markdown += `- **Table Name:** ${tableInfo.name}\n`;

    if (tableInfo.schema) {
      markdown += `- **Schema:** ${tableInfo.schema}\n`;
    }

    if (tableInfo.catalog) {
      markdown += `- **Catalog:** ${tableInfo.catalog}\n`;
    }
    markdown += `\n`;
  }

  // Fields/Columns
  if (fields && fields.length > 0) {
    markdown += `## Fields\n\n`;
    markdown += `| Field | Type | Column | Key | Nullable |\n`;
    markdown += `|-------|------|--------|-----|----------|\n`;

    fields.forEach((field: any) => {
      const key = field.isPrimaryKey ? '🔑 PK' : field.isForeignKey ? '🔗 FK' : '';
      const nullable = field.nullable ? 'Yes' : 'No';
      markdown += `| ${field.name} | ${field.type} | ${field.columnName || field.name} | ${key} | ${nullable} |\n`;
    });
    markdown += `\n`;
  }

  // Relationships
  if (relationships && relationships.length > 0) {
    markdown += `## Relationships\n\n`;

    relationships.forEach((rel: any) => {
      markdown += `### ${rel.type}: ${rel.fieldName}\n`;
      markdown += `- **Target Entity:** ${rel.targetEntity}\n`;
      markdown += `- **Mapped By:** ${rel.mappedBy || 'N/A'}\n`;

      if (rel.joinColumn) {
        markdown += `- **Join Column:** ${rel.joinColumn}\n`;
      }

      if (rel.cascade) {
        markdown += `- **Cascade:** ${rel.cascade.join(', ')}\n`;
      }

      if (rel.fetchType) {
        markdown += `- **Fetch Type:** ${rel.fetchType}\n`;
      }
      markdown += `\n`;
    });
  }

  // Indexes
  if (indexes && indexes.length > 0) {
    markdown += `## Indexes\n\n`;

    indexes.forEach((index: any) => {
      markdown += `- **${index.name}**: ${index.columns.join(', ')}`;
      if (index.unique) {
        markdown += ` (UNIQUE)`;
      }
      markdown += `\n`;
    });
    markdown += `\n`;
  }

  // Constraints
  if (constraints && constraints.length > 0) {
    markdown += `## Constraints\n\n`;

    constraints.forEach((constraint: any) => {
      markdown += `- **${constraint.type}**: ${constraint.name || 'unnamed'}\n`;
      if (constraint.columns) {
        markdown += `  - Columns: ${constraint.columns.join(', ')}\n`;
      }
    });
    markdown += `\n`;
  }

  // File Reference
  if (fileReference) {
    markdown += `## File Reference\n\n`;
    markdown += `\`${fileReference}\`\n\n`;
  }

  markdown += `---\n`;
  markdown += `Entity \`${entity.className}\` maps to table \`${tableName}\`\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Table "${context.table_name}" not found`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Table doesn't exist in the database\n`;
  markdown += `- No JPA entity mapped to this table\n`;
  markdown += `- Table name case mismatch\n`;
  markdown += `- Entity uses different naming strategy\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Check table name spelling and case\n`;
  markdown += `- Verify entity exists with @Entity annotation\n`;
  markdown += `- Check @Table annotation for custom table names\n`;
  markdown += `- Look for naming strategies in application.properties\n\n`;

  markdown += `**Context:** Searched for table "${context.table_name}"`;

  if (context.schema) {
    markdown += ` in schema "${context.schema}"`;
  }

  markdown += `\n`;

  return markdown;
}
