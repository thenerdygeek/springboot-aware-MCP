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

## 📊 Current Status (56% Complete - 9 of 16 tools)

### ✅ Phase 1: Foundation (100% COMPLETE)
- ✅ Project structure with npm workspaces
- ✅ TypeScript configuration for all 3 MCP servers
- ✅ Java Parser Service with Maven
- ✅ JavaParserClient bridge (Node.js ↔ Java communication)
- ✅ Base MCP server template
- ✅ stdin/stdout JSON communication protocol

### ✅ Phase 2: Micro Context Server (100% COMPLETE - 5/5 tools)

1. ✅ **resolve_symbol** - Resolve symbol to type and declaration location
2. ✅ **get_function_definition** - Get complete method implementation
3. ✅ **get_dto_structure** - Analyze DTO/Entity structure with fields
4. ✅ **find_execution_branches** - Find conditional branches and control flow
5. ✅ **find_mockable_dependencies** - Identify external dependencies for testing

### 🟡 Phase 3: Macro Context Server (57% COMPLETE - 4/7 tools)

**Implemented:**
1. ✅ **build_method_call_chain** - Build complete call chain with graph visualization
2. ✅ **trace_data_transformation** - Trace DTO transformations through layers
3. ✅ **find_all_usages** - Find all usages with impact assessment (LOW/MEDIUM/HIGH/CRITICAL)
4. ✅ **trace_endpoint_to_repository** - Trace endpoint → controller → service → repository → entity

**Remaining:**
5. ⏳ **find_entity_by_table** - Map database tables to JPA entities
6. ⏳ **find_advice_adapters** - Find AOP advice implementations
7. ⏳ **find_filters_and_order** - Find servlet filters with execution order

### ⏳ Phase 4: Spring Component Server (0% COMPLETE - 0/4 tools)
- ⏳ `analyze_controller_method` - Extract controller details
- ⏳ `find_controller_for_endpoint` - Find endpoint handlers
- ⏳ `find_implementations` - Find interface implementations
- ⏳ `find_feature_flag_usage` - Detect feature flags

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **Java JDK** >= 11 ([Download](https://adoptium.net/))
- **Maven** >= 3.8.0 ([Download](https://maven.apache.org/))
- **IntelliJ IDEA** with Cody plugin installed

### Installation

**Windows:**
```cmd
REM Run the automated build script
build.bat
```

**Linux/Mac:**
```bash
# 1. Install Node.js dependencies
npm install

# 2. Build TypeScript servers
npm run build

# 3. Build Java Parser Service
cd packages/java-parser-service
mvn clean package -DskipTests
cd ../..
```

**Verify builds:**
```cmd
REM Windows
dir packages\micro-context\dist\index.js
dir packages\macro-context\dist\index.js
dir packages\java-parser-service\target\java-parser-service-1.0.0.jar
```

```bash
# Linux/Mac
ls -lh packages/micro-context/dist/index.js
ls -lh packages/macro-context/dist/index.js
ls -lh packages/java-parser-service/target/java-parser-service-1.0.0.jar
```

---

## ⚙️ Configuration for IntelliJ Cody

> 📘 **For detailed configuration instructions, see [MCP_CONFIGURATION.md](./docs/MCP_CONFIGURATION.md)**
> 📘 **For Windows setup instructions, see [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)**

### 1. Locate Cody Settings File

**Windows:**
```
%APPDATA%\JetBrains\<IDE_VERSION>\options\cody_settings.json
```
Example: `C:\Users\YourName\AppData\Roaming\JetBrains\IntelliJIdea2024.1\options\cody_settings.json`

**Mac:**
```
~/Library/Application Support/JetBrains/<IDE_VERSION>/options/cody_settings.json
```

**Linux:**
```
~/.config/JetBrains/<IDE_VERSION>/options/cody_settings.json
```

### 2. Configure MCP Servers

Copy `cody_settings.example.json` to the location above, or add this to your existing file:

**Windows:**
```json
{
  "mcpServers": {
    "spring-micro-context": {
      "command": "node",
      "args": [
        "C:\\Projects\\CodyMcpServers\\packages\\micro-context\\dist\\index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "",
        "PACKAGE_EXCLUDE": "",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-macro-context": {
      "command": "node",
      "args": [
        "C:\\Projects\\CodyMcpServers\\packages\\macro-context\\dist\\index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "CALL_CHAIN_MAX_DEPTH": "15",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-component": {
      "command": "node",
      "args": [
        "C:\\Projects\\CodyMcpServers\\packages\\spring-component\\dist\\index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "",
        "PACKAGE_EXCLUDE": "",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    }
  }
}
```

**Mac/Linux:**
```json
{
  "mcpServers": {
    "spring-micro-context": {
      "command": "node",
      "args": [
        "/absolute/path/to/CodyMcpServers/packages/micro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "",
        "PACKAGE_EXCLUDE": "",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-macro-context": {
      "command": "node",
      "args": [
        "/absolute/path/to/CodyMcpServers/packages/macro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "CALL_CHAIN_MAX_DEPTH": "15",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-component": {
      "command": "node",
      "args": [
        "/absolute/path/to/CodyMcpServers/packages/spring-component/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "",
        "PACKAGE_EXCLUDE": "",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    }
  }
}
```

**Important:**
- Replace paths with your actual installation directory
- Windows: Use double backslashes (`C:\\Projects\\...`)
- Mac/Linux: Use forward slashes (`/home/user/...`)

### 3. Configure for Your Project

Update environment variables to match your Spring Boot project:

#### Core Configuration

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| **PACKAGE_INCLUDE** | Your base package pattern | `com.yourcompany.*` | None |
| **PACKAGE_EXCLUDE** | Packages to exclude | `com.yourcompany.generated.*` | None |
| **DTO_PACKAGES** | Where DTOs are located | `com.yourcompany.dto,com.yourcompany.model` | Auto-detect |
| **ENTITY_PACKAGES** | Where JPA entities are | `com.yourcompany.entity` | Auto-detect |
| **MAX_DTO_DEPTH** | Max nesting for DTOs | `10` | `10` |
| **CALL_CHAIN_MAX_DEPTH** | Max depth for call chains | `15` | `10` |

#### Logging Configuration

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| **MCP_LOGGING** | Enable/disable tool call logging | `true` or `false` | `true` |
| **MCP_DEBUG** | Enable console debug output | `true` or `false` | `false` |

**Logging Details:**
- When enabled, logs are stored in `${workspaceFolder}/.mcp-logs/`
- Two formats: JSON (machine-readable) and readable (human-friendly)
- Logs include: tool name, arguments, response, execution time, success/failure
- See [LOGGING_GUIDE.md](./docs/LOGGING_GUIDE.md) for complete documentation

**How to find your packages:**
1. Open any Java file in your Spring Boot project in IntelliJ
2. Look at the `package` declaration at the top
3. Note the base package (e.g., `com.yourcompany.projectname`)
4. Find DTO and entity packages by navigating the project structure in IntelliJ

### 4. Restart Cody

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
📝 Logging to: /path/to/your/spring/project/.mcp-logs/micro-context-2025-12-12.log
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

- **[requirement_doc.md](docs/requirement_doc.md)** - Complete implementation specification (120 pages)
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

---

## 📚 Additional Resources

- **[MCP_CONFIGURATION.md](./docs/MCP_CONFIGURATION.md)** - Complete MCP server configuration guide (all clients)
- **[LOGGING_GUIDE.md](./docs/LOGGING_GUIDE.md)** - Comprehensive logging documentation
- **[HOW_IT_WORKS.md](./docs/HOW_IT_WORKS.md)** - Architecture and workflow explanation
- **[EXAMPLE_WORKFLOW.md](./docs/EXAMPLE_WORKFLOW.md)** - Step-by-step concrete example
- **[SETUP_GUIDE.md](./docs/SETUP_GUIDE.md)** - Complete Windows setup guide with troubleshooting
- **[QUICKSTART.md](./docs/QUICKSTART.md)** - Quick start guide
- **[IMPROVEMENTS.md](./docs/IMPROVEMENTS.md)** - Potential improvements and enhancement ideas
- **[cody_settings.example.json](./cody_settings.example.json)** - Ready-to-use configuration template
- **[build.bat](./build.bat)** - Automated Windows build script
- **[requirement_doc.md](./docs/requirement_doc.md)** - Complete specification (120 pages)

---

**Built for IntelliJ IDEA with Cody** | **Powered by JavaParser & MCP** | **56% Complete (9/16 tools)** 🚀
