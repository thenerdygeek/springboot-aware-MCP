# How MCP Tools Work - Complete Guide

A comprehensive explanation of how MCP tools are used and how they locate your project.

---

## 🎯 Quick Answer

**Q: How do tools know the project location?**
**A:** You tell them when starting the server by passing the workspace path as a command-line argument.

**Q: How are tools used?**
**A:** A client (like Claude Desktop, VS Code, or custom app) sends JSON-RPC requests to the server, which processes them using JavaParser.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Starting the MCP Server](#starting-the-mcp-server)
3. [How Project Location Works](#how-project-location-works)
4. [Tool Usage Workflow](#tool-usage-workflow)
5. [MCP Protocol Communication](#mcp-protocol-communication)
6. [Integration Examples](#integration-examples)
7. [Real-World Usage](#real-world-usage)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client                                │
│  (Claude Desktop, VS Code Extension, Custom App, etc.)       │
│                                                              │
│  - Sends tool call requests via JSON-RPC                    │
│  - Receives and displays results                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ JSON-RPC 2.0 Protocol
                       │ (stdin/stdout)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  MCP Server                                  │
│           (Node.js TypeScript Server)                        │
│                                                              │
│  1. Started with: node dist/index.js /path/to/project      │
│  2. Stores workspace root: /path/to/project                │
│  3. Listens for JSON-RPC requests                          │
│  4. Routes tool calls to appropriate handlers              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Spawns and communicates with
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            Java Parser Service                               │
│                  (JAR file)                                  │
│                                                              │
│  - Initialized with workspace root                          │
│  - Uses JavaParser + SymbolSolver                          │
│  - Analyzes Java source code                               │
│  - Returns structured results                              │
└──────────────────────────────────────────────────────────────┘
                       │
                       │ Reads files from
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Your Spring Boot Project                        │
│         (Located at /path/to/project)                       │
│                                                              │
│  src/main/java/                                             │
│  ├── com/example/demo/                                      │
│  │   ├── controller/                                        │
│  │   ├── service/                                           │
│  │   ├── repository/                                        │
│  │   └── domain/                                            │
│  pom.xml                                                    │
│  application.properties                                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🚀 Starting the MCP Server

### Step 1: Server Requires Workspace Path

When you start an MCP server, you **must** provide the project location:

```bash
# Syntax
node packages/{server-name}/dist/index.js /path/to/your/spring/project

# Examples
node packages/micro-context/dist/index.js /Users/john/my-spring-app
node packages/macro-context/dist/index.js ./my-project
node packages/spring-component/dist/index.js /absolute/path/to/project
```

### Step 2: Server Initialization

**What happens when you start the server:**

```typescript
// 1. Parse command line arguments
const args = process.argv.slice(2);
let workspaceRoot = args[0];  // This is YOUR project path!

if (!workspaceRoot) {
  console.error('Usage: spring-micro-context <workspace-root>');
  process.exit(1);
}

// 2. Resolve relative paths to absolute
if (!workspaceRoot.startsWith('/')) {
  workspaceRoot = process.cwd() + '/' + workspaceRoot;
}

// 3. Initialize JavaParser with this workspace
javaParserClient = new JavaParserClient(workspaceRoot, config);

// 4. Server is now ready and knows where your project is!
console.error(`📁 Workspace: ${workspaceRoot}`);
```

**Console Output:**
```
🚀 Starting Spring Boot Micro Context MCP Server
📁 Workspace: /Users/john/my-spring-app
📦 Package filter: none
📝 Logging to: /Users/john/my-spring-app/.mcp-logs/micro-context-2025-12-12.log
✅ Spring Boot Micro Context MCP Server running
📡 Listening for MCP requests...
```

---

## 📍 How Project Location Works

### The Workspace Root Concept

The **workspace root** is the base directory of your Spring Boot project:

```
/Users/john/my-spring-app/              ← This is the workspace root
├── src/
│   └── main/
│       └── java/
│           └── com/example/demo/
│               ├── controller/
│               ├── service/
│               └── repository/
├── pom.xml
└── application.properties
```

### How It's Used Throughout

**1. Server Stores It:**
```typescript
// Stored in server initialization
const workspaceRoot = "/Users/john/my-spring-app";
```

**2. JavaParser Uses It:**
```java
// In Java Parser Service
public Parser(String workspaceRoot) {
    this.workspaceRoot = workspaceRoot;

    // All file operations are relative to this
    Path srcPath = Paths.get(workspaceRoot, "src", "main", "java");

    // JavaParser configuration
    symbolResolver = new JavaSymbolSolver(
        new CombinedTypeSolver(
            new ReflectionTypeSolver(),
            new JavaParserTypeSolver(srcPath.toFile())
        )
    );
}
```

**3. Tool Calls Reference It:**
```javascript
// When a tool is called, paths can be:

// A) Relative to workspace root
{
  "symbol_name": "userService",
  "context_file": "src/main/java/com/example/demo/controller/UserController.java"
  //               ↑ Relative to workspace root
}

// B) Absolute paths (still validated against workspace)
{
  "symbol_name": "userService",
  "context_file": "/Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java"
  //               ↑ Absolute path
}
```

**4. Logging Uses It:**
```typescript
// Logs are created in workspace
const logDir = path.join(workspaceRoot, '.mcp-logs');
// Creates: /Users/john/my-spring-app/.mcp-logs/
```

---

## 🔄 Tool Usage Workflow

### Complete Flow: From Client Request to Response

```
┌────────────────────────────────────────────────────────────┐
│ Step 1: Client Wants to Use a Tool                         │
│                                                             │
│ User asks: "What does the userService field do in          │
│             UserController?"                                │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 2: Client Sends JSON-RPC Request                      │
│                                                             │
│ {                                                           │
│   "jsonrpc": "2.0",                                        │
│   "id": 42,                                                │
│   "method": "tools/call",                                  │
│   "params": {                                              │
│     "name": "resolve_symbol",                              │
│     "arguments": {                                         │
│       "symbol_name": "userService",                        │
│       "context_file": "src/.../UserController.java"        │
│     }                                                       │
│   }                                                        │
│ }                                                          │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 3: MCP Server Receives Request                        │
│                                                             │
│ server.setRequestHandler(CallToolRequestSchema,            │
│   async (request) => {                                     │
│     const { name, arguments: args } = request.params;      │
│     // name = "resolve_symbol"                             │
│     // args = { symbol_name: "userService", ... }          │
│   }                                                        │
│ )                                                          │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 4: Route to Tool Handler                              │
│                                                             │
│ switch (name) {                                            │
│   case 'resolve_symbol':                                   │
│     result = await resolveSymbol(                          │
│       javaParserClient,                                    │
│       args                                                 │
│     );                                                     │
│     break;                                                 │
│ }                                                          │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 5: Tool Handler Calls Java Parser Service             │
│                                                             │
│ const result = await client.sendRequest(                   │
│   'resolve_symbol',                                        │
│   {                                                        │
│     symbolName: args.symbol_name,                          │
│     contextFile: args.context_file,                        │
│     workspaceRoot: "/Users/john/my-spring-app"  ← HERE!   │
│   }                                                        │
│ );                                                         │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 6: Java Parser Analyzes Code                          │
│                                                             │
│ 1. Load file from workspace:                               │
│    /Users/john/my-spring-app/src/.../UserController.java  │
│                                                             │
│ 2. Parse with JavaParser                                   │
│                                                             │
│ 3. Use SymbolSolver to resolve "userService"              │
│                                                             │
│ 4. Find declaration: UserService field at line 25         │
│                                                             │
│ 5. Return structured result (JSON)                         │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 7: Format Response                                    │
│                                                             │
│ return formatSymbolResolution(result, symbolName);         │
│                                                             │
│ // Creates markdown:                                       │
│ "# Symbol Resolution: userService                          │
│  ## Resolved Type                                          │
│  `com.example.demo.service.UserService`                    │
│  ..."                                                      │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 8: MCP Server Sends Response                          │
│                                                             │
│ {                                                           │
│   "jsonrpc": "2.0",                                        │
│   "id": 42,                                                │
│   "result": {                                              │
│     "content": [{                                          │
│       "type": "text",                                      │
│       "text": "# Symbol Resolution: userService..."        │
│     }]                                                     │
│   }                                                        │
│ }                                                          │
└──────────────────────┬─────────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────────┐
│ Step 9: Client Receives and Displays Result                │
│                                                             │
│ User sees:                                                 │
│ "The userService field in UserController is of type        │
│  UserService, located in the service package..."           │
└────────────────────────────────────────────────────────────┘
```

---

## 🔌 MCP Protocol Communication

### JSON-RPC 2.0 Message Format

**1. Initialization (when client connects):**
```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "Claude Desktop",
      "version": "1.0.0"
    }
  }
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "spring-boot-micro-context",
      "version": "1.0.0"
    }
  }
}
```

**2. List Available Tools:**
```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}

// Server → Client
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "resolve_symbol",
        "description": "Resolves a symbol to its type...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "symbol_name": { "type": "string" },
            "context_file": { "type": "string" }
          },
          "required": ["symbol_name", "context_file"]
        }
      }
    ]
  }
}
```

**3. Call a Tool:**
```json
// Client → Server
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "resolve_symbol",
    "arguments": {
      "symbol_name": "userService",
      "context_file": "src/main/java/com/example/demo/controller/UserController.java"
    }
  }
}

// Server → Client (success)
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# Symbol Resolution: userService\n\n## Resolved Type\n`com.example.demo.service.UserService`\n..."
      }
    ]
  }
}

// Server → Client (error)
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# Error: resolve_symbol\n\n**Problem:** Symbol not found..."
      }
    ],
    "isError": true
  }
}
```

---

## 💻 Integration Examples

### Example 1: Claude Desktop Integration

**Claude Desktop Configuration (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "spring-micro-context": {
      "command": "node",
      "args": [
        "/path/to/CodyMcpServers/packages/micro-context/dist/index.js",
        "/Users/john/my-spring-app"
      ]
    },
    "spring-macro-context": {
      "command": "node",
      "args": [
        "/path/to/CodyMcpServers/packages/macro-context/dist/index.js",
        "/Users/john/my-spring-app"
      ]
    },
    "spring-component": {
      "command": "node",
      "args": [
        "/path/to/CodyMcpServers/packages/spring-component/dist/index.js",
        "/Users/john/my-spring-app"
      ]
    }
  }
}
```

**How it works:**
1. Claude Desktop reads this config
2. Starts each server with the specified workspace path
3. User asks questions about their Spring Boot code
4. Claude uses the tools to analyze the code
5. Results are formatted and shown to the user

**User interaction:**
```
User: "What does the createUser method in UserController do?"

Claude: Let me analyze that for you...
[Uses analyze_controller_method tool]

The createUser method in UserController:
- HTTP Method: POST
- Path: /api/users
- Parameters: @Valid @RequestBody UserDTO
- Security: @PreAuthorize("hasRole('ADMIN')")
- Returns: ResponseEntity<ApiResponse<UserDTO>>
- Validates the user DTO and creates a new user in the database
```

### Example 2: VS Code Extension

**Extension activates:**
```typescript
// In your VS Code extension
export async function activate(context: vscode.ExtensionContext) {
  // Get current workspace
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return;

  const projectPath = workspaceFolders[0].uri.fsPath;

  // Start MCP server
  const serverProcess = spawn('node', [
    '/path/to/micro-context/dist/index.js',
    projectPath  // ← Your project location
  ]);

  // Communicate via stdin/stdout
  serverProcess.stdout.on('data', (data) => {
    const response = JSON.parse(data.toString());
    // Handle response
  });

  // Call a tool
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'resolve_symbol',
      arguments: {
        symbol_name: 'userService',
        context_file: 'src/main/java/.../UserController.java'
      }
    }
  };

  serverProcess.stdin.write(JSON.stringify(request) + '\n');
}
```

### Example 3: Custom CLI Tool

```javascript
#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

// Start MCP server with project path
const projectPath = process.argv[2] || process.cwd();
const server = spawn('node', [
  'packages/micro-context/dist/index.js',
  projectPath
]);

let messageId = 1;

// Helper to send requests
function callTool(toolName, args) {
  return new Promise((resolve) => {
    const request = {
      jsonrpc: '2.0',
      id: messageId++,
      method: 'tools/call',
      params: { name: toolName, arguments: args }
    };

    server.stdin.write(JSON.stringify(request) + '\n');

    // Wait for response
    const handler = (data) => {
      const response = JSON.parse(data.toString());
      if (response.id === request.id) {
        server.stdout.off('data', handler);
        resolve(response.result);
      }
    };

    server.stdout.on('data', handler);
  });
}

// Initialize
async function main() {
  // Send initialize
  await callTool('initialize', {});

  // Use tools
  const result = await callTool('resolve_symbol', {
    symbol_name: 'userService',
    context_file: 'src/main/java/.../UserController.java'
  });

  console.log(result.content[0].text);
}

main();
```

---

## 🌍 Real-World Usage

### Scenario 1: Code Review Assistant

**Setup:**
```bash
# Start server for your project
node packages/micro-context/dist/index.js /path/to/my-project
```

**Usage:**
```javascript
// Analyze a PR
const files = getChangedFiles(); // ['UserController.java', 'UserService.java']

for (const file of files) {
  // Get all methods in changed file
  const methods = await callTool('list_methods', { file_path: file });

  // For each method, find its dependencies
  for (const method of methods) {
    const deps = await callTool('find_mockable_dependencies', {
      class_name: method.className,
      method_name: method.name
    });

    console.log(`${method.name} depends on:`, deps);
  }
}
```

### Scenario 2: Documentation Generator

**Setup:**
```bash
# Start all servers
node packages/micro-context/dist/index.js /path/to/project &
node packages/macro-context/dist/index.js /path/to/project &
node packages/spring-component/dist/index.js /path/to/project &
```

**Usage:**
```javascript
// Generate API documentation
const controllers = await findAllControllers();

for (const controller of controllers) {
  const doc = await callTool('analyze_controller_method', {
    controller_name: controller.name
  });

  // Generate markdown
  fs.writeFileSync(`docs/${controller.name}.md`, doc.content[0].text);
}
```

### Scenario 3: Migration Helper

```javascript
// Find all usages of deprecated class
const usages = await callTool('find_all_usages', {
  target_name: 'OldUserService',
  target_type: 'class'
});

console.log(`Found ${usages.length} usages to migrate`);

// For each usage, understand the context
for (const usage of usages) {
  const context = await callTool('resolve_symbol', {
    symbol_name: 'oldUserService',
    context_file: usage.file
  });

  // Suggest migration
  console.log(`In ${usage.file}: Replace with NewUserService`);
}
```

---

## 📊 Summary

### How Project Location Works

```
┌──────────────────────────────────────────────────────┐
│ 1. You start server with workspace path:             │
│    node dist/index.js /path/to/project              │
│                                                       │
│ 2. Server stores this path                           │
│                                                       │
│ 3. JavaParser is initialized with this path          │
│                                                       │
│ 4. All file operations use this as base directory    │
│                                                       │
│ 5. Tool arguments can be relative to this path       │
│                                                       │
│ 6. Logs are created in {workspace}/.mcp-logs/       │
└──────────────────────────────────────────────────────┘
```

### How Tools Are Used

```
┌──────────────────────────────────────────────────────┐
│ 1. Client (Claude, VS Code, etc.) connects to        │
│    MCP server via stdin/stdout                       │
│                                                       │
│ 2. Client sends JSON-RPC requests                    │
│                                                       │
│ 3. Server routes to appropriate tool handler         │
│                                                       │
│ 4. Tool handler calls Java Parser Service            │
│                                                       │
│ 5. JavaParser analyzes code in workspace             │
│                                                       │
│ 6. Results formatted and returned to client          │
│                                                       │
│ 7. Client displays results to user                   │
└──────────────────────────────────────────────────────┘
```

### Key Points

✅ **Workspace path is provided when starting the server**
✅ **Server stores this path for all operations**
✅ **JavaParser uses this path to find source files**
✅ **Tool arguments can be relative or absolute paths**
✅ **Communication happens via JSON-RPC 2.0 protocol**
✅ **Clients can be Claude Desktop, VS Code, custom apps, etc.**
✅ **Each tool call is logged (if logging enabled)**

---

**For more information:**
- **QUICKSTART.md** - How to run servers
- **LOGGING_GUIDE.md** - Log details
- **TEST_RESULTS_SUMMARY.md** - Test examples

**Version:** 1.0.0
**Last Updated:** 2025-12-12
