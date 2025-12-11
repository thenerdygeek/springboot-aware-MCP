import { JavaParserClient } from '../java-parser-client.js';

export interface FindMockableDependenciesArgs {
  class_name: string;
  file_path?: string;
  include_method_params?: boolean;
}

/**
 * Identifies all dependencies (fields, constructor parameters) that should be mocked
 * in unit tests. Generates ready-to-use mock setup code.
 */
export async function findMockableDependencies(
  client: JavaParserClient,
  args: FindMockableDependenciesArgs
): Promise<string> {
  try {
    const result = await client.sendRequest('find_mockable_dependencies', {
      className: args.class_name,
      filePath: args.file_path,
      includeMethodParams: args.include_method_params ?? false,
    });

    return formatMockableDependencies(result, args.class_name);
  } catch (error: any) {
    return formatError('Dependency Analysis', error, args);
  }
}

function formatMockableDependencies(result: any, className: string): string {
  const {
    simpleName,
    filePath,
    classType,
    autowiredDependencies,
    constructorDependencies,
    totalDependencies,
    dependenciesToMock,
    fileReferences,
  } = result;

  let markdown = `# Mockable Dependencies: ${className}\n\n`;

  // Class Under Test
  markdown += `## Class Under Test\n`;
  markdown += `- **Name:** ${simpleName}\n`;
  markdown += `- **File:** \`${filePath}\`\n`;
  markdown += `- **Type:** ${classType}\n\n`;

  // @Autowired Dependencies
  if (autowiredDependencies && autowiredDependencies.length > 0) {
    markdown += `## @Autowired Dependencies\n\n`;

    autowiredDependencies.forEach((dep: any) => {
      markdown += `### ${dep.name} (${dep.type})\n`;
      if (dep.filePath) {
        markdown += `- **File:** \`${dep.filePath}\`\n`;
      }
      markdown += `- **Type:** ${dep.dependencyType}\n`;
      markdown += `- **Custom Class:** ${dep.isCustomClass ? 'Yes' : 'No'}\n`;
      markdown += `- **Mock Strategy:** ${dep.mockStrategy}\n`;
      markdown += `- **Reason:** ${dep.reason}\n\n`;
    });
  }

  // Constructor Injection
  if (constructorDependencies && constructorDependencies.length > 0) {
    markdown += `## Constructor Injection\n\n`;

    constructorDependencies.forEach((dep: any) => {
      markdown += `### ${dep.name} (${dep.type})\n`;
      if (dep.filePath) {
        markdown += `- **File:** \`${dep.filePath}\`\n`;
      }
      markdown += `- **Mock Strategy:** ${dep.mockStrategy}\n`;
      markdown += `- **Reason:** ${dep.reason}\n\n`;
    });
  }

  // Test Setup Code
  markdown += `## Test Setup Code\n\n`;

  markdown += `### Mockito Annotations\n`;
  markdown += '```java\n';

  // Generate @Mock annotations
  const allDeps = [...(autowiredDependencies || []), ...(constructorDependencies || [])];
  allDeps.forEach((dep: any) => {
    if (dep.mockStrategy === 'Mock') {
      markdown += `@Mock\n`;
      markdown += `private ${dep.type} ${dep.name};\n\n`;
    } else if (dep.mockStrategy === 'Spy') {
      markdown += `@Spy\n`;
      markdown += `private ${dep.type} ${dep.name};\n\n`;
    }
  });

  // Generate @InjectMocks
  const classNameCamelCase = simpleName.charAt(0).toLowerCase() + simpleName.slice(1);
  markdown += `@InjectMocks\n`;
  markdown += `private ${simpleName} ${classNameCamelCase};\n`;
  markdown += '```\n\n';

  markdown += `### Setup Method\n`;
  markdown += '```java\n';
  markdown += `@BeforeEach\n`;
  markdown += `void setUp() {\n`;
  markdown += `    MockitoAnnotations.openMocks(this);\n`;
  markdown += `}\n`;
  markdown += '```\n\n';

  // Summary
  markdown += `## Summary\n`;
  markdown += `- **Total Dependencies:** ${totalDependencies}\n`;
  markdown += `- **To Mock:** ${dependenciesToMock}\n\n`;

  // File References
  if (fileReferences && fileReferences.length > 0) {
    markdown += `## File References\n`;
    fileReferences.forEach((ref: string, index: number) => {
      if (index === 0) {
        markdown += `- Main: \`${ref}\`\n`;
      } else {
        markdown += `- Dependency ${index}: \`${ref}\`\n`;
      }
    });
    markdown += '\n';
  }

  markdown += `---\n`;
  markdown += `Found ${totalDependencies} dependencies.\n`;

  return markdown;
}

function formatError(
  toolName: string,
  error: any,
  context: Record<string, any>
): string {
  let markdown = `# Error: ${toolName}\n\n`;

  markdown += `**Problem:** ${error.message || `Class "${context.class_name}" not found`}\n\n`;

  markdown += `**Possible Causes:**\n`;
  markdown += `- Class name typo\n`;
  markdown += `- File not in workspace\n`;
  markdown += `- Class not yet created\n\n`;

  markdown += `**Suggestions:**\n`;
  markdown += `- Verify class name\n`;
  markdown += `- Check workspace path\n`;
  markdown += `- Create class first\n\n`;

  if (error.context || Object.keys(context).length > 0) {
    markdown += `**Context:**\n`;
    const errorContext = error.context || context;
    for (const [key, value] of Object.entries(errorContext)) {
      markdown += `- ${key}: ${value}\n`;
    }
  }

  return markdown;
}
