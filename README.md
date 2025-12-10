# Spring Boot MCP Servers

**Model Context Protocol (MCP) servers for deep Spring Boot project analysis** in IntelliJ IDEA with Cody plugin.

## 🎯 Overview

This project provides **3 specialized MCP servers** with **16 tools** that give Cody (Claude AI) deep understanding of Spring Boot Java projects:

- **Micro Context Server** (5 tools) - Code-level analysis
- **Macro Context Server** (7 tools) - Architecture-level analysis
- **Spring Component Server** (4 tools) - Spring-specific patterns

### Problem Solved

Current AI coding assistants lack understanding of:
- Spring Boot request flow (Filters → Interceptors → Controllers → Services → Repositories)
- Nested method calls and data transformations
- Custom DTO structures with circular references
- Feature flag conditional logic
- Impact analysis for code changes

This results in:
- ❌ Inaccurate test generation (assumes DTO structures)
- ❌ Wrong bug fix suggestions (doesn't understand actual flow)
- ❌ Missing context for implementation tasks

### Solution

Build specialized MCP servers that provide:
- ✅ **Micro Context**: Deep analysis of selected code for test generation
- ✅ **Macro Context**: Architecture-wide flow and impact analysis
- ✅ **Spring Component Context**: Spring-specific patterns and configurations

---

## 📋 Phase 1 Status (✅ COMPLETE)

### ✅ Implemented

**Foundation:**
- ✅ Project structure with npm workspaces
- ✅ TypeScript configuration for all 3 MCP servers
- ✅ Java Parser Service with Maven
- ✅ JavaParserClient bridge (Node.js ↔ Java communication)
- ✅ Base MCP server template
- ✅ stdin/stdout JSON communication protocol

**Proof of Concept:**
- ✅ `resolve_symbol` tool (fully implemented)
  - Resolves symbols to their types and declaration locations
  - Uses JavaParser with SymbolSolver
  - Markdown-formatted output
  - Full error handling

### 🚧 Coming in Phase 2-4

**Phase 2 (Micro Context):**
- `get_function_definition` - Extract complete method definitions
- `get_dto_structure` - Recursive DTO structure analysis
- `find_execution_branches` - Test coverage branch analysis
- `find_mockable_dependencies` - Identify dependencies for mocking

**Phase 3 (Macro Context):**
- `build_method_call_chain` - Trace method calls to framework boundaries
- `trace_data_transformation` - DTO → Entity → DTO flow
- `find_all_usages` - Impact analysis
- `trace_endpoint_to_repository` - Complete HTTP → DB flow
- `find_entity_by_table` - Map tables to JPA entities
- `find_advice_adapters` - List advice implementations
- `find_filters_and_order` - List filters with execution order

**Phase 4 (Spring Component):**
- `analyze_controller_method` - Extract controller details
- `find_controller_for_endpoint` - Find endpoint handlers
- `find_implementations` - Find interface implementations
- `find_feature_flag_usage` - Detect feature flags

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Java JDK** >= 11 (recommended: 17 or 21)
- **Maven** >= 3.8.0
- **IntelliJ IDEA** with Cody plugin installed

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd CodyMcpServers

# 2. Install Node.js dependencies
npm install

# 3. Build TypeScript servers
npm run build --workspace=packages/micro-context

# 4. Build Java Parser Service
cd packages/java-parser-service
./build.sh
cd ../..

# Verify builds
ls -lh packages/micro-context/dist/index.js
ls -lh packages/java-parser-service/target/java-parser-service-1.0.0.jar
```

---

## ⚙️ Configuration for IntelliJ Cody

### 1. Configure MCP Server in Cody

Open **IntelliJ IDEA → Settings → Tools → Cody → MCP Servers**

Add the following configuration:

```json
{
  "spring-micro-context": {
    "command": "node",
    "args": [
      "/absolute/path/to/CodyMcpServers/packages/micro-context/dist/index.js",
      "${workspaceFolder}"
    ],
    "env": {
      "PACKAGE_INCLUDE": "com.yourcompany.*",
      "PACKAGE_EXCLUDE": "com.yourcompany.generated.*",
      "DTO_PACKAGES": "com.yourcompany.dto,com.yourcompany.model",
      "ENTITY_PACKAGES": "com.yourcompany.entity",
      "MAX_DTO_DEPTH": "10"
    }
  }
}
```

**Important:** Replace `/absolute/path/to/` with your actual installation path.

### 2. Configure for Your Project

Update environment variables to match your Spring Boot project:

| Variable | Description | Example |
|----------|-------------|---------|
| **PACKAGE_INCLUDE** | Your base package pattern | `com.yourcompany.*` |
| **PACKAGE_EXCLUDE** | Packages to exclude | `com.yourcompany.generated.*` |
| **DTO_PACKAGES** | Where DTOs are located | `com.yourcompany.dto,com.yourcompany.model` |
| **ENTITY_PACKAGES** | Where JPA entities are | `com.yourcompany.entity` |
| **MAX_DTO_DEPTH** | Max nesting for DTOs | `10` |

**How to find your packages:**
1. Open any Java file in your Spring Boot project in IntelliJ
2. Look at the `package` declaration at the top
3. Note the base package (e.g., `com.yourcompany.projectname`)
4. Find DTO and entity packages by navigating the project structure in IntelliJ

### 3. Restart Cody

After configuration, restart the Cody plugin or restart IntelliJ IDEA.

---

## 🧪 Testing the Setup

### Test 1: Verify MCP Server Starts

```bash
# Test the server manually
node packages/micro-context/dist/index.js /path/to/your/spring/project
```

You should see:
```
🚀 Starting Spring Boot Micro Context MCP Server
📁 Workspace: /path/to/your/spring/project
📦 Package filter: com.yourcompany.*
[Java Parser Service] Java Parser Service started for workspace: /path/to/your/spring/project
✅ Spring Boot Micro Context MCP Server running
📡 Listening for MCP requests...
```

Press `Ctrl+C` to exit.

### Test 2: Use in IntelliJ with Cody

1. Open a Spring Boot project in IntelliJ
2. Open Cody chat
3. Ask: "What tools do you have available?"
4. You should see `resolve_symbol` and other tools listed

### Test 3: Resolve a Symbol

1. Open a Java controller file in IntelliJ
2. Find a line with a service field (e.g., `userService`)
3. Ask Cody: "What is the type of userService?"
4. Cody should use the `resolve_symbol` tool and show detailed type information

---

## 📁 Project Structure

```
CodyMcpServers/
├── packages/
│   ├── micro-context/              # Server 1 (5 tools)
│   │   ├── src/
│   │   │   ├── index.ts           # MCP server entry point
│   │   │   ├── java-parser-client.ts  # Bridge to Java
│   │   │   └── tools/
│   │   │       └── resolve-symbol.ts  # ✅ Implemented
│   │   ├── dist/                  # Compiled output
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── macro-context/              # Server 2 (7 tools) - Phase 3
│   │   └── (similar structure)
│   │
│   ├── spring-component/           # Server 3 (4 tools) - Phase 4
│   │   └── (similar structure)
│   │
│   └── java-parser-service/        # Java parsing engine
│       ├── src/main/java/com/mcp/javaparser/
│       │   ├── Main.java          # ✅ Entry point
│       │   └── Parser.java        # ✅ Core logic
│       ├── target/
│       │   └── java-parser-service-1.0.0.jar  # ✅ Built
│       ├── pom.xml
│       └── build.sh
│
├── docs/                           # Documentation
├── examples/                       # Example projects
├── requirement_doc.md              # Complete specification
├── package.json                    # Root workspace
└── README.md                       # This file
```

---

## 🔧 Development

### Building Individual Packages

```bash
# Build micro-context server
npm run build --workspace=packages/micro-context

# Build macro-context server (Phase 3)
npm run build --workspace=packages/macro-context

# Build spring-component server (Phase 4)
npm run build --workspace=packages/spring-component

# Build Java service
cd packages/java-parser-service && ./build.sh
```

### Rebuilding Everything

```bash
# Clean and rebuild
npm run clean
npm run build
npm run build:java
```

### Development Mode

```bash
# Run MCP server in dev mode with auto-reload
npm run dev --workspace=packages/micro-context
```

---

## 🛠️ Architecture

### Communication Flow

```
IntelliJ IDEA with Cody
    ↓ (MCP Protocol via stdio)
Node.js MCP Server (TypeScript)
    ↓ (JSON over stdin/stdout)
Java Parser Service (JavaParser library)
    ↓ (File System Access)
Spring Boot Project Source Code
```

### Technology Stack

- **MCP Servers**: Node.js + TypeScript + @modelcontextprotocol/sdk
- **Java Analysis**: JavaParser 3.25.8 with SymbolSolver
- **Communication**: Child process with JSON over stdin/stdout
- **Output Format**: Markdown (optimized for Claude comprehension)

---

## 📖 Usage Examples

### Example 1: Resolve Symbol

**In IntelliJ:**
```java
@RestController
public class UserController {
    private UserService userService;  // ← Select this line

    public User getUser() {
        return userService.findUser();
    }
}
```

**Ask Cody:** "What is the type of userService?"

**Cody Response (using resolve_symbol):**
```markdown
# Symbol Resolution: userService

## Resolved Type
`com.example.service.UserService`

## Declaration
- **Type:** Field
- **Location:** UserController.java:12
- **Package:** com.example.service
- **Custom Class:** Yes

## File Path
`/path/to/project/src/main/java/com/example/service/UserService.java`

## Context
```java
  11: @RestController
  12: private UserService userService;
  13:
```

---
Symbol successfully resolved to custom class.
```

---

## 🐛 Troubleshooting

### MCP Server Not Starting

**Problem:** Server fails to start

**Solutions:**
1. Check Node.js version: `node --version` (should be >= 18)
2. Check Java version: `java --version` (should be >= 11)
3. Verify JAR exists: `ls packages/java-parser-service/target/*.jar`
4. Check for compilation errors in console

### Tool Not Found

**Problem:** Cody doesn't show MCP tools

**Solutions:**
1. Verify MCP configuration in IntelliJ Cody settings
2. Check paths are absolute (not relative)
3. Restart Cody plugin: **Settings → Plugins → Cody → Disable/Enable**
4. Check IntelliJ logs: **Help → Show Log in Finder/Explorer**

### Symbol Resolution Fails

**Problem:** `resolve_symbol` returns error

**Solutions:**
1. Verify `PACKAGE_INCLUDE` matches your project
2. Check file path is absolute
3. Ensure project compiles successfully in IntelliJ
4. Check Java service logs (stderr output)

### Java Service Crashes

**Problem:** Java Parser Service terminates unexpectedly

**Solutions:**
1. Check available memory: Java service needs ~512MB
2. Verify JavaParser version compatibility
3. Test JAR manually: `java -jar packages/java-parser-service/target/java-parser-service-1.0.0.jar /path/to/project`
4. Check for source code parsing errors in stderr

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Project structure and build system
- [x] Java Parser Service with JavaParser
- [x] MCP server templates
- [x] Node.js ↔ Java communication bridge
- [x] `resolve_symbol` tool (proof of concept)

### 🚧 Phase 2: Micro Context Server (Next)
- [ ] `get_function_definition` - Complete method extraction
- [ ] `get_dto_structure` - Recursive DTO analysis
- [ ] `find_execution_branches` - Branch coverage analysis
- [ ] `find_mockable_dependencies` - Dependency analysis
- [ ] Testing with real Spring Boot projects

### 🔜 Phase 3: Macro Context Server
- [ ] All 7 macro-level tools
- [ ] Call chain tracing
- [ ] Data flow analysis
- [ ] Impact analysis

### 🔜 Phase 4: Spring Component Server
- [ ] All 4 Spring-specific tools
- [ ] Controller analysis
- [ ] Feature flag detection

### 🔜 Phase 5: Polish & Distribution
- [ ] Performance optimization
- [ ] Comprehensive testing
- [ ] NPM package publication
- [ ] Documentation and tutorials

---

## 📚 Documentation

- **[requirement_doc.md](requirement_doc.md)** - Complete implementation specification (120 pages)
- **[Architecture Details](#architecture)** - System design and communication
- **[Configuration Guide](#configuration-for-intellij-cody)** - Setup instructions

---

## 🤝 Contributing

Contributions are welcome! This is Phase 1 implementation.

**Areas for contribution:**
- Phase 2: Implement remaining micro-context tools
- Phase 3: Implement macro-context tools
- Phase 4: Implement Spring component tools
- Testing with various Spring Boot projects
- Documentation improvements
- Performance optimizations

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

- **MCP Protocol** by Anthropic
- **JavaParser** library for Java code analysis
- **Cody** plugin for IntelliJ IDEA
- **Spring Boot** framework

---

## 💡 Tips for Best Results

1. **Configure package filters accurately** - This ensures the tools only analyze your custom code
2. **Use absolute paths** - Cody will replace `${workspaceFolder}` automatically
3. **Start simple** - Test with small files before complex projects
4. **Check logs** - stderr output from Java service provides valuable debugging info
5. **Keep dependencies updated** - Regularly update JavaParser and MCP SDK

---

**Built for IntelliJ IDEA with Cody** | **Powered by JavaParser & MCP** | **Phase 1 Complete** ✅
