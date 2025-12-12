# MCP Tool Usage - Concrete Example

A step-by-step walkthrough showing exactly how workspace paths and tool calls work.

---

## 🎬 Real Example: Analyzing UserController

Let's walk through a **complete example** from start to finish.

---

### 📁 Your Project Structure

You have a Spring Boot project at:
```
/Users/john/my-spring-app/
├── src/
│   └── main/
│       └── java/
│           └── com/example/demo/
│               ├── controller/
│               │   └── UserController.java
│               ├── service/
│               │   └── UserService.java
│               └── repository/
│                   └── UserRepository.java
├── pom.xml
└── application.properties
```

---

## Step 1: Start the MCP Server

```bash
cd /path/to/CodyMcpServers

# Start micro-context server with YOUR project path
node packages/micro-context/dist/index.js /Users/john/my-spring-app
#                                          ↑
#                                          This is the workspace root!
```

**Console Output:**
```
🚀 Starting Spring Boot Micro Context MCP Server
📁 Workspace: /Users/john/my-spring-app  ← Server now knows this path
📦 Package filter: none
📝 Logging to: /Users/john/my-spring-app/.mcp-logs/micro-context-2025-12-12.log
✅ Spring Boot Micro Context MCP Server running
📡 Listening for MCP requests...
```

**What happened:**
- ✅ Server stored workspace path: `/Users/john/my-spring-app`
- ✅ JavaParser initialized to scan: `/Users/john/my-spring-app/src/main/java`
- ✅ Log directory created at: `/Users/john/my-spring-app/.mcp-logs/`
- ✅ Server listening on stdin/stdout for JSON-RPC requests

---

## Step 2: Client Sends Initialize Request

**Your client** (Claude Desktop, VS Code extension, etc.) sends:

```json
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
```

**Server responds:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": { "tools": {} },
    "serverInfo": {
      "name": "spring-boot-micro-context",
      "version": "1.0.0"
    }
  }
}
```

---

## Step 3: User Asks a Question

**User (in Claude Desktop):**
> "What is the userService field in UserController?"

**Claude thinks:**
> I need to use the `resolve_symbol` tool to find out what userService is.

---

## Step 4: Claude Calls the Tool

**Claude sends to MCP server:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "resolve_symbol",
    "arguments": {
      "symbol_name": "userService",
      "context_file": "src/main/java/com/example/demo/controller/UserController.java"
      //               ↑ Relative to workspace root!
    }
  }
}
```

**Note:** The file path is **relative** to the workspace root we provided at startup.

---

## Step 5: Server Processes Request

**Inside the MCP server (`packages/micro-context/src/index.ts`):**

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  // name = "resolve_symbol"
  // args = { symbol_name: "userService", context_file: "src/..." }

  const startTime = Date.now();

  try {
    let result: string;

    switch (name) {
      case 'resolve_symbol':
        // Call the tool handler
        result = await resolveSymbol(javaParserClient, args);
        break;
    }

    const executionTimeMs = Date.now() - startTime;

    // Log the tool call
    logger.logToolCall(name, args, {
      response: result,
      executionTimeMs
    });

    return {
      content: [{ type: 'text', text: result }]
    };
  } catch (error) {
    // Handle errors...
  }
});
```

---

## Step 6: Tool Handler Sends Request to Java Parser

**Inside `resolveSymbol` function:**

```typescript
export async function resolveSymbol(
  client: JavaParserClient,
  args: ResolveSymbolArgs
): Promise<string> {
  const result = await client.sendRequest('resolve_symbol', {
    symbolName: args.symbol_name,              // "userService"
    contextFile: args.context_file,             // "src/.../UserController.java"
    lineNumber: args.line_number,
    workspaceRoot: client.workspaceRoot         // "/Users/john/my-spring-app"
    //             ↑ The workspace path flows here!
  });

  return formatSymbolResolution(result, args.symbol_name);
}
```

**Java Parser Client builds full path:**
```typescript
class JavaParserClient {
  private workspaceRoot: string;  // = "/Users/john/my-spring-app"

  async sendRequest(operation: string, params: any) {
    // Send to Java Parser Service
    const fullPath = path.join(
      this.workspaceRoot,           // "/Users/john/my-spring-app"
      params.contextFile            // "src/.../UserController.java"
    );
    // Result: "/Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java"

    // Send to Java process
    const request = {
      operation,
      ...params,
      contextFile: fullPath  // Now absolute path
    };

    this.process.stdin.write(JSON.stringify(request) + '\n');
  }
}
```

---

## Step 7: Java Parser Service Analyzes Code

**Inside Java Parser Service (`Parser.java`):**

```java
public ObjectNode resolveSymbol(JsonNode params) throws Exception {
    String symbolName = params.get("symbolName").asText();  // "userService"
    String contextFile = params.get("contextFile").asText();
    // contextFile = "/Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java"

    System.err.println("Resolving symbol: " + symbolName + " in " + contextFile);

    // Parse the file using JavaParser
    CompilationUnit cu = StaticJavaParser.parse(new File(contextFile));
    //                                           ↑ Reads from disk!

    // Find the symbol
    Optional<FieldDeclaration> field = cu.findAll(FieldDeclaration.class).stream()
        .filter(f -> f.getVariables().stream()
            .anyMatch(v -> v.getNameAsString().equals(symbolName)))
        .findFirst();

    if (field.isPresent()) {
        // Resolve the type using SymbolSolver
        FieldDeclaration fieldDecl = field.get();
        ResolvedType resolvedType = fieldDecl.resolve().getType();

        // resolvedType = "com.example.demo.service.UserService"

        // Build result
        ObjectNode result = objectMapper.createObjectNode();
        result.put("symbolName", symbolName);
        result.put("resolvedType", resolvedType.describe());
        result.put("declarationType", "Field");
        result.put("filePath", contextFile);
        // ... more details

        return result;
    }

    throw new Exception("Symbol not found: " + symbolName);
}
```

**File Read:**
```java
// JavaParser reads the actual file:
// /Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;  ← Found it!
    //            ↑
    //            This is the symbol we're resolving

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}
```

**SymbolSolver Resolution:**
```java
// SymbolSolver looks in:
// /Users/john/my-spring-app/src/main/java/com/example/demo/service/

// Finds:
// /Users/john/my-spring-app/src/main/java/com/example/demo/service/UserService.java

@Service
@RequiredArgsConstructor
public class UserService {  ← Resolved!
    // ...
}
```

**Result returned:**
```json
{
  "symbolName": "userService",
  "resolvedType": "com.example.demo.service.UserService",
  "declarationType": "Field",
  "declarationFile": "/Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java",
  "declarationLine": 12,
  "packageName": "com.example.demo.service",
  "isCustomClass": true,
  "filePath": "/Users/john/my-spring-app/src/main/java/com/example/demo/service/UserService.java"
}
```

---

## Step 8: Format Response

**Back in TypeScript (`resolve-symbol.ts`):**

```typescript
function formatSymbolResolution(result: any, symbolName: string): string {
  const {
    resolvedType,
    declarationType,
    declarationFile,
    declarationLine,
    packageName,
    isCustomClass,
    filePath
  } = result;

  let markdown = `# Symbol Resolution: ${symbolName}\n\n`;

  markdown += `## Resolved Type\n`;
  markdown += `\`${resolvedType}\`\n\n`;

  markdown += `## Declaration\n`;
  markdown += `- **Type:** ${declarationType}\n`;
  markdown += `- **Location:** ${declarationFile}:${declarationLine}\n`;
  markdown += `- **Package:** ${packageName}\n`;
  markdown += `- **Custom Class:** ${isCustomClass ? 'Yes' : 'No'}\n\n`;

  markdown += `## File Path\n`;
  markdown += `\`${filePath}\`\n\n`;

  markdown += `---\n`;
  markdown += `Symbol successfully resolved to ${isCustomClass ? 'custom' : 'framework'} class.\n`;

  return markdown;
}
```

**Result:**
```markdown
# Symbol Resolution: userService

## Resolved Type
`com.example.demo.service.UserService`

## Declaration
- **Type:** Field
- **Location:** /Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java:12
- **Package:** com.example.demo.service
- **Custom Class:** Yes

## File Path
`/Users/john/my-spring-app/src/main/java/com/example/demo/service/UserService.java`

---
Symbol successfully resolved to custom class.
```

---

## Step 9: Log the Call

**Logger writes to disk:**

**JSON Log (`/Users/john/my-spring-app/.mcp-logs/micro-context-2025-12-12.log`):**
```json
{"timestamp":"2025-12-12T15:30:45.123Z","toolName":"resolve_symbol","arguments":{"symbol_name":"userService","context_file":"src/main/java/com/example/demo/controller/UserController.java"},"response":"# Symbol Resolution: userService...","executionTimeMs":245,"success":true}
```

**Readable Log (`/Users/john/my-spring-app/.mcp-logs/micro-context-2025-12-12-readable.log`):**
```
================================================================================
[2025-12-12T15:30:45.123Z] ✅ SUCCESS - resolve_symbol
Execution Time: 245ms
================================================================================

📥 ARGUMENTS:
{
  "symbol_name": "userService",
  "context_file": "src/main/java/com/example/demo/controller/UserController.java"
}

📤 RESPONSE:
# Symbol Resolution: userService

## Resolved Type
`com.example.demo.service.UserService`
...
```

---

## Step 10: Return to Client

**MCP Server sends to Claude:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "# Symbol Resolution: userService\n\n## Resolved Type\n`com.example.demo.service.UserService`\n..."
      }
    ]
  }
}
```

---

## Step 11: Claude Shows Result to User

**Claude responds:**
> The `userService` field in `UserController` is of type `UserService` from the `com.example.demo.service` package. This is a custom service class in your project located at:
>
> `/Users/john/my-spring-app/src/main/java/com/example/demo/service/UserService.java`
>
> It's declared as a private final field at line 12 of `UserController.java`, likely injected via constructor injection (indicated by `@RequiredArgsConstructor`).

---

## 📊 Complete Flow Diagram

```
User asks question
       ↓
Claude Desktop (client)
       ↓ JSON-RPC request (stdin)
MCP Server (Node.js)
  - Workspace: /Users/john/my-spring-app
       ↓ Spawns subprocess
Java Parser Service (JAR)
  - Initialized with workspace
       ↓ Reads file
/Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java
       ↓ Parses code
JavaParser + SymbolSolver
       ↓ Finds definition
/Users/john/my-spring-app/src/main/java/com/example/demo/service/UserService.java
       ↓ Returns JSON result
Java Parser Service
       ↓ Formats markdown
MCP Server
       ↓ Writes log
/Users/john/my-spring-app/.mcp-logs/micro-context-2025-12-12.log
       ↓ JSON-RPC response (stdout)
Claude Desktop
       ↓ Shows formatted answer
User sees result
```

---

## 🎯 Key Takeaways

### How Workspace Path is Used

```
1. Start Server:
   node dist/index.js /Users/john/my-spring-app
                       ↑ This is THE workspace path

2. Server Stores It:
   workspaceRoot = "/Users/john/my-spring-app"

3. JavaParser Initialized:
   new JavaSymbolSolver(
     new JavaParserTypeSolver(
       new File("/Users/john/my-spring-app/src/main/java")
     )
   )

4. Tool Arguments Are Relative:
   "context_file": "src/main/java/com/example/demo/controller/UserController.java"
   ↓ Combined with workspace
   "/Users/john/my-spring-app/src/main/java/com/example/demo/controller/UserController.java"

5. Logs Created In Workspace:
   "/Users/john/my-spring-app/.mcp-logs/"

6. All File Operations Use Workspace as Base
```

### Communication Flow

```
Client ←→ MCP Server ←→ Java Parser ←→ Your Project Files
         (JSON-RPC)    (stdin/out)     (File System)

All paths resolved relative to workspace root!
```

---

## 📝 Summary

**Question:** How do tools know the project location?
**Answer:** You tell them when starting the server!

```bash
node dist/index.js /path/to/your/project
#                  ↑ This is how tools know where your project is
```

**Question:** How are tools used?
**Answer:** Via JSON-RPC protocol:

1. Client connects to server
2. Client sends tool call request
3. Server processes using JavaParser
4. JavaParser reads files from workspace
5. Results returned to client
6. All logged to `.mcp-logs/`

**Everything flows from that initial workspace path!**

---

**For complete details, see:**
- **HOW_IT_WORKS.md** - Full architecture guide
- **QUICKSTART.md** - Quick start guide
- **LOGGING_GUIDE.md** - Log details

**Version:** 1.0.0
