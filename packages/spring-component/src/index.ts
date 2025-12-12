#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { JavaParserClient } from '@spring-boot-mcp/micro-context/dist/java-parser-client.js';
import { MCPLogger } from './logger.js';
import { analyzeControllerMethod } from './tools/analyze-controller-method.js';
import { findControllerForEndpoint } from './tools/find-controller-for-endpoint.js';
import { findImplementations } from './tools/find-implementations.js';
import { findFeatureFlagUsage } from './tools/find-feature-flag-usage.js';

// Parse command line arguments
const args = process.argv.slice(2);
let workspaceRoot = args[0];

if (!workspaceRoot) {
  console.error('Usage: spring-component-context <workspace-root>');
  console.error('Example: spring-component-context /path/to/spring/project');
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
  callChainMaxDepth: parseInt(process.env.CALL_CHAIN_MAX_DEPTH || '15', 10),
  stopAtPackages: process.env.STOP_AT_PACKAGES?.split(',').map((p) => p.trim()) || [
    'java.*',
    'javax.*',
    'org.springframework.*',
    'org.hibernate.*',
  ],
};

console.error('🚀 Starting Spring Component Context MCP Server');
console.error(`📁 Workspace: ${workspaceRoot}`);
console.error(`📦 Package filter: ${config.packageInclude || 'none'}`);

// Initialize logger
const logger = new MCPLogger('spring-component', workspaceRoot);
console.error(`📝 Logging to: ${logger.getLogFilePath()}`);

// Initialize JavaParser client
let javaParserClient: JavaParserClient;

try {
  javaParserClient = new JavaParserClient(workspaceRoot, config);
} catch (error) {
  console.error('❌ Failed to initialize Java Parser:', error);
  process.exit(1);
}

// Define available tools
const tools: Tool[] = [
  {
    name: 'analyze_controller_method',
    description:
      'Analyzes controller method parameters, annotations, and return type',
    inputSchema: {
      type: 'object',
      properties: {
        controller_name: {
          type: 'string',
          description: 'Controller class name',
        },
        method_name: {
          type: 'string',
          description: 'Method name to analyze',
        },
      },
      required: ['controller_name', 'method_name'],
    },
  },
  {
    name: 'find_controller_for_endpoint',
    description:
      'Finds which controller and method handles a specific API endpoint',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint: {
          type: 'string',
          description: 'Endpoint path (e.g., /api/users)',
        },
        http_method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method (optional)',
        },
      },
      required: ['endpoint'],
    },
  },
  {
    name: 'find_implementations',
    description:
      'Finds all classes implementing an interface or extending an abstract class',
    inputSchema: {
      type: 'object',
      properties: {
        interface_or_abstract_class: {
          type: 'string',
          description: 'Interface or abstract class name',
        },
      },
      required: ['interface_or_abstract_class'],
    },
  },
  {
    name: 'find_feature_flag_usage',
    description:
      'Finds all places where feature flags control conditional logic',
    inputSchema: {
      type: 'object',
      properties: {
        flag_identifier: {
          type: 'string',
          description: 'Optional: Specific flag name to search for',
        },
        search_pattern: {
          type: 'string',
          description: 'Optional: Method pattern (e.g., isFeatureEnabled)',
        },
      },
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'spring-component-context',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();

  try {
    let result: string;

    switch (name) {
      case 'analyze_controller_method':
        result = await analyzeControllerMethod(javaParserClient, args as any);
        break;

      case 'find_controller_for_endpoint':
        result = await findControllerForEndpoint(javaParserClient, args as any);
        break;

      case 'find_implementations':
        result = await findImplementations(javaParserClient, args as any);
        break;

      case 'find_feature_flag_usage':
        result = await findFeatureFlagUsage(javaParserClient, args as any);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const executionTimeMs = Date.now() - startTime;

    // Log successful tool call
    logger.logToolCall(name, args, {
      response: result,
      executionTimeMs,
    });

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error.message || String(error);

    // Log failed tool call
    logger.logToolCall(name, args, {
      error: errorMessage,
      executionTimeMs,
    });

    return {
      content: [
        {
          type: 'text',
          text: `# Error\n\n${errorMessage}`,
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
  console.error('✅ Component Context MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
