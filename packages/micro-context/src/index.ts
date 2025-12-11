#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { JavaParserClient } from './java-parser-client.js';
import { resolveSymbol } from './tools/resolve-symbol.js';
import { getFunctionDefinition } from './tools/get-function-definition.js';
import { getDtoStructure } from './tools/get-dto-structure.js';
import { findExecutionBranches } from './tools/find-execution-branches.js';
import { findMockableDependencies } from './tools/find-mockable-dependencies.js';

// Parse command line arguments
const args = process.argv.slice(2);
let workspaceRoot = args[0];

if (!workspaceRoot) {
  console.error('Usage: spring-micro-context <workspace-root>');
  console.error('Example: spring-micro-context /path/to/spring/project');
  process.exit(1);
}

// Resolve relative paths
if (!workspaceRoot.startsWith('/')) {
  workspaceRoot = process.cwd() + '/' + workspaceRoot;
}

// Configuration from environment variables
const config = {
  packageInclude: process.env.PACKAGE_INCLUDE || '',
  packageExclude: process.env.PACKAGE_EXCLUDE || '',
  dtoPackages: process.env.DTO_PACKAGES?.split(',').map((p) => p.trim()) || [],
  entityPackages: process.env.ENTITY_PACKAGES?.split(',').map((p) => p.trim()) || [],
  maxDtoDepth: parseInt(process.env.MAX_DTO_DEPTH || '10', 10),
  callChainMaxDepth: parseInt(process.env.CALL_CHAIN_MAX_DEPTH || '15', 10),
  stopAtPackages: process.env.STOP_AT_PACKAGES?.split(',').map((p) => p.trim()) || undefined,
  featureFlagPatterns: process.env.FEATURE_FLAG_PATTERNS?.split(',').map((p) => p.trim()) || undefined,
};

console.error('🚀 Starting Spring Boot Micro Context MCP Server');
console.error(`📁 Workspace: ${workspaceRoot}`);
console.error(`📦 Package filter: ${config.packageInclude || 'none'}`);

// Initialize JavaParser client
let javaParserClient: JavaParserClient;

try {
  javaParserClient = new JavaParserClient(workspaceRoot, config);
} catch (error) {
  console.error('❌ Failed to initialize Java Parser Client:', error);
  process.exit(1);
}

// Create MCP server
const server = new Server(
  {
    name: 'spring-boot-micro-context',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'resolve_symbol',
    description: 'Resolves a symbol (variable, field, parameter) to its type and declaration location. Use this to understand what a variable refers to in the code.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol_name: {
          type: 'string',
          description: "Symbol to resolve (e.g., 'userService', 'requestDTO')",
        },
        context_file: {
          type: 'string',
          description: 'Absolute path to the file where the symbol appears',
        },
        line_number: {
          type: 'number',
          description: 'Optional: Line number for disambiguation when multiple symbols have the same name',
        },
      },
      required: ['symbol_name', 'context_file'],
    },
  },
  // Additional tools will be added in Phase 2
  {
    name: 'get_function_definition',
    description: 'Returns complete method definition including signature, annotations, parameters, and body',
    inputSchema: {
      type: 'object',
      properties: {
        function_name: {
          type: 'string',
          description: 'Name of the method to retrieve',
        },
        class_name: {
          type: 'string',
          description: 'Fully qualified or simple class name containing the method',
        },
        file_path: {
          type: 'string',
          description: 'Optional: File path hint for faster lookup',
        },
        include_body: {
          type: 'boolean',
          description: 'Include method body in output (default: true)',
        },
      },
      required: ['function_name', 'class_name'],
    },
  },
  {
    name: 'get_dto_structure',
    description: 'Recursively extracts complete DTO structure including all nested objects, validation annotations, and Lombok annotations',
    inputSchema: {
      type: 'object',
      properties: {
        class_name: {
          type: 'string',
          description: 'Name of the DTO class to analyze',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum recursion depth (default: 10)',
        },
        include_annotations: {
          type: 'boolean',
          description: 'Include validation and Lombok annotations (default: true)',
        },
        include_inheritance: {
          type: 'boolean',
          description: 'Include inherited fields (default: true)',
        },
      },
      required: ['class_name'],
    },
  },
];

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'resolve_symbol':
        result = await resolveSymbol(javaParserClient, args as any);
        break;

      case 'get_function_definition':
        result = await getFunctionDefinition(javaParserClient, args as any);
        break;

      case 'get_dto_structure':
        result = await getDtoStructure(javaParserClient, args as any);
        break;

      case 'find_execution_branches':
        result = await findExecutionBranches(javaParserClient, args as any);
        break;

      case 'find_mockable_dependencies':
        result = await findMockableDependencies(javaParserClient, args as any);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error: any) {
    const errorMessage = error.message || String(error);

    return {
      content: [
        {
          type: 'text',
          text: `# Error: ${name}\n\n**Problem:** ${errorMessage}\n\n**Suggestions:**\n- Verify input parameters\n- Check file paths are absolute\n- Ensure Java files are valid\n- Check that Java Parser Service is running`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ Spring Boot Micro Context MCP Server running');
  console.error('📡 Listening for MCP requests...');
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.error('\n⏹️  Shutting down...');
  javaParserClient.dispose();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n⏹️  Shutting down...');
  javaParserClient.dispose();
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Server error:', error);
  javaParserClient?.dispose();
  process.exit(1);
});
