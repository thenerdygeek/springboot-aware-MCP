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
import { buildMethodCallChain } from './tools/build-method-call-chain.js';
import { traceDataTransformation } from './tools/trace-data-transformation.js';
import { findAllUsages } from './tools/find-all-usages.js';
import { traceEndpointToRepository } from './tools/trace-endpoint-to-repository.js';
import { findEntityByTable } from './tools/find-entity-by-table.js';
import { findAdviceAdapters } from './tools/find-advice-adapters.js';
import { findFiltersAndOrder } from './tools/find-filters-and-order.js';

// Parse command line arguments
const args = process.argv.slice(2);
let workspaceRoot = args[0];

if (!workspaceRoot) {
  console.error('Usage: spring-macro-context <workspace-root>');
  console.error('Example: spring-macro-context /path/to/spring/project');
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

console.error('🚀 Starting Spring Boot Macro Context MCP Server');
console.error(`📁 Workspace: ${workspaceRoot}`);
console.error(`📦 Package filter: ${config.packageInclude || 'none'}`);

// Initialize logger
const logger = new MCPLogger('macro-context', workspaceRoot);
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
    name: 'build_method_call_chain',
    description:
      'Builds complete call chain from a method to all nested method calls, stopping at framework boundaries',
    inputSchema: {
      type: 'object',
      properties: {
        class_name: {
          type: 'string',
          description: 'Fully qualified class name containing the method',
        },
        method_name: {
          type: 'string',
          description: 'Name of the method to analyze',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum depth of call chain (default: 15)',
        },
      },
      required: ['class_name', 'method_name'],
    },
  },
  {
    name: 'trace_data_transformation',
    description:
      'Traces how data is transformed through method calls, following DTOs and entities',
    inputSchema: {
      type: 'object',
      properties: {
        start_class: {
          type: 'string',
          description: 'Starting class name',
        },
        start_method: {
          type: 'string',
          description: 'Starting method name',
        },
        data_object: {
          type: 'string',
          description: 'DTO or entity class to track',
        },
      },
      required: ['start_class', 'start_method', 'data_object'],
    },
  },
  {
    name: 'find_all_usages',
    description:
      'Finds all usages of a method, field, or class across the entire codebase',
    inputSchema: {
      type: 'object',
      properties: {
        target_name: {
          type: 'string',
          description: 'Name of method, field, or class to find usages of',
        },
        target_type: {
          type: 'string',
          enum: ['method', 'field', 'class'],
          description: 'Type of target to search for',
        },
        class_context: {
          type: 'string',
          description: 'Optional: class name for context (for methods/fields)',
        },
      },
      required: ['target_name', 'target_type'],
    },
  },
  {
    name: 'trace_endpoint_to_repository',
    description:
      'Traces complete flow from REST endpoint through service layer to repository',
    inputSchema: {
      type: 'object',
      properties: {
        endpoint_path: {
          type: 'string',
          description: 'REST endpoint path (e.g., /api/users)',
        },
        http_method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          description: 'HTTP method',
        },
      },
      required: ['endpoint_path'],
    },
  },
  {
    name: 'find_entity_by_table',
    description:
      'Finds JPA entity class mapped to a specific database table',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Database table name',
        },
        schema: {
          type: 'string',
          description: 'Optional: database schema name',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'find_advice_adapters',
    description:
      'Finds AOP advice and adapters that intercept specific methods or classes',
    inputSchema: {
      type: 'object',
      properties: {
        target_class: {
          type: 'string',
          description: 'Optional: target class to check for advice',
        },
        target_method: {
          type: 'string',
          description: 'Optional: target method to check for advice',
        },
      },
    },
  },
  {
    name: 'find_filters_and_order',
    description:
      'Finds servlet filters and interceptors, showing their execution order',
    inputSchema: {
      type: 'object',
      properties: {
        filter_type: {
          type: 'string',
          enum: ['servlet', 'interceptor', 'all'],
          description: 'Type of filters to find (default: all)',
        },
      },
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: 'spring-macro-context',
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
      case 'build_method_call_chain':
        result = await buildMethodCallChain(javaParserClient, args as any);
        break;

      case 'trace_data_transformation':
        result = await traceDataTransformation(javaParserClient, args as any);
        break;

      case 'find_all_usages':
        result = await findAllUsages(javaParserClient, {
          identifier: (args as any).target_name,
          identifier_type: (args as any).target_type,
          scope_class: (args as any).class_context,
          include_tests: true,
        });
        break;

      case 'trace_endpoint_to_repository':
        result = await traceEndpointToRepository(javaParserClient, {
          endpoint_path: (args as any).endpoint_path,
          http_method: (args as any).http_method,
        });
        break;

      case 'find_entity_by_table':
        result = await findEntityByTable(javaParserClient, {
          table_name: (args as any).table_name,
          schema: (args as any).schema,
        });
        break;

      case 'find_advice_adapters':
        result = await findAdviceAdapters(javaParserClient, {
          target_class: (args as any).target_class,
          target_method: (args as any).target_method,
        });
        break;

      case 'find_filters_and_order':
        result = await findFiltersAndOrder(javaParserClient, {
          filter_type: (args as any).filter_type,
        });
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
  console.error('✅ Macro Context MCP Server running');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
