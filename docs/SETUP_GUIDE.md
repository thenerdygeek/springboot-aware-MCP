# Spring Boot MCP Servers - Complete Setup Guide for IntelliJ Cody (Windows)

This guide explains how to set up and use the Spring Boot MCP servers with Cody in IntelliJ IDEA on Windows.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Installation & Build](#installation--build)
- [Cody Configuration](#cody-configuration)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js 18+ and npm**
   - Download from: https://nodejs.org/
   - Verify installation:
     ```cmd
     node --version
     npm --version
     ```

2. **Java 11+**
   - Download OpenJDK from: https://adoptium.net/
   - Verify installation:
     ```cmd
     java -version
     ```

3. **Maven 3.6+**
   - Download from: https://maven.apache.org/download.cgi
   - Add Maven's `bin` directory to your PATH
   - Verify installation:
     ```cmd
     mvn --version
     ```

4. **IntelliJ IDEA with Cody Plugin**
   - Install Cody plugin from: Settings → Plugins → Search "Cody"
   - Restart IntelliJ after installation

---

## Installation & Build

### Step 1: Clone or Download the Repository

Place the project in a directory like:
```
C:\Projects\CodyMcpServers
```

### Step 2: Install Node Dependencies

Open Command Prompt or PowerShell in the project root:

```cmd
cd C:\Projects\CodyMcpServers
npm install
```

This installs dependencies for all three MCP server packages (micro-context, macro-context, spring-component).

### Step 3: Build TypeScript Packages

```cmd
npm run build
```

This compiles all TypeScript packages to JavaScript.

### Step 4: Build Java Parser Service

```cmd
cd packages\java-parser-service
mvn clean package -DskipTests
```

This creates the executable JAR file at:
```
packages\java-parser-service\target\java-parser-service-1.0.0.jar
```

### Step 5: Verify Build

Check that these files exist:
```
✓ packages\micro-context\dist\index.js
✓ packages\macro-context\dist\index.js
✓ packages\java-parser-service\target\java-parser-service-1.0.0.jar
```

---

## Cody Configuration

### Step 1: Locate Cody Settings File

The Cody settings file location on Windows:

**For IntelliJ IDEA:**
```
%APPDATA%\JetBrains\<IDE_VERSION>\options\cody_settings.json
```

Example:
```
C:\Users\YourUsername\AppData\Roaming\JetBrains\IntelliJIdea2024.1\options\cody_settings.json
```

**Alternative location (if using Cody standalone):**
```
%APPDATA%\Code\User\cody_settings.json
```

### Step 2: Edit cody_settings.json

Create or edit the `cody_settings.json` file with the following content:

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
        "PACKAGE_EXCLUDE": ""
      }
    },
    "spring-macro-context": {
      "command": "node",
      "args": [
        "C:\\Projects\\CodyMcpServers\\packages\\macro-context\\dist\\index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "",
        "PACKAGE_EXCLUDE": "",
        "CALL_CHAIN_MAX_DEPTH": "15",
        "STOP_AT_PACKAGES": "java.*,javax.*,org.springframework.*,org.hibernate.*"
      }
    }
  }
}
```

**Important Notes:**
- Replace `C:\\Projects\\CodyMcpServers` with your actual installation path
- Use **double backslashes** (`\\`) in Windows paths
- The `${workspaceFolder}` variable will be replaced with your current project path automatically

### Step 3: Optional Configuration

You can customize the environment variables:

**PACKAGE_INCLUDE**: Only analyze classes from specific packages (comma-separated)
```json
"PACKAGE_INCLUDE": "com.yourcompany.*,org.yourproject.*"
```

**PACKAGE_EXCLUDE**: Exclude specific packages
```json
"PACKAGE_EXCLUDE": "com.example.test.*,*.generated.*"
```

**CALL_CHAIN_MAX_DEPTH**: Maximum depth for method call chain analysis (default: 15)
```json
"CALL_CHAIN_MAX_DEPTH": "20"
```

**STOP_AT_PACKAGES**: Stop tracing at these framework boundaries
```json
"STOP_AT_PACKAGES": "java.*,javax.*,org.springframework.*,org.hibernate.*,org.apache.*"
```

### Step 4: Restart IntelliJ IDEA

After editing `cody_settings.json`, restart IntelliJ IDEA for the changes to take effect.

---

## Available Tools

### Micro Context Server (9 Tools Total - 5 Implemented)

**Implemented Tools:**

1. **resolve_symbol** - Resolve symbol to type and declaration location
2. **get_function_definition** - Get complete function/method implementation
3. **get_dto_structure** - Analyze DTO/Entity structure with fields
4. **find_execution_branches** - Find conditional branches and control flow
5. **find_mockable_dependencies** - Identify external dependencies for testing

### Macro Context Server (7 Tools Total - 4 Implemented)

**Implemented Tools:**

1. **build_method_call_chain** - Build complete call chain from method to nested calls
   - Stops at framework boundaries
   - Prevents circular references
   - Generates ASCII call graph

2. **trace_data_transformation** - Trace DTO transformations through layers
   - Finds Mapper/Converter classes
   - Shows Request → Service → Entity → Database flow

3. **find_all_usages** - Find all usages of methods/fields/classes
   - Impact assessment with risk levels (LOW/MEDIUM/HIGH/CRITICAL)
   - Effort estimation
   - Production vs test code separation

4. **trace_endpoint_to_repository** - Trace endpoint to repository flow
   - Finds controller by endpoint path and HTTP method
   - Traces through service layer
   - Identifies repository and entity
   - Shows complete Controller → Service → Repository → Entity → Database flow

**Not Yet Implemented:**
- find_entity_by_table
- find_advice_adapters
- find_filters_and_order

---

## Usage Examples

### In IntelliJ Cody Chat

Once configured, you can use the MCP tools directly in Cody chat:

#### Example 1: Build Method Call Chain

```
@cody Can you analyze the call chain for the UserService.createUser method?
```

Cody will use the `build_method_call_chain` tool to:
- Trace all method calls within `createUser`
- Show the call graph
- Identify framework boundaries

#### Example 2: Find All Usages

```
@cody Find all usages of the getUserById method and assess the impact of changing it
```

Cody will use the `find_all_usages` tool to:
- Find all references to `getUserById` across the codebase
- Provide risk assessment (LOW/MEDIUM/HIGH/CRITICAL)
- Estimate refactoring effort
- List affected files

#### Example 3: Trace Endpoint Flow

```
@cody Trace the complete flow for the GET /api/users endpoint
```

Cody will use the `trace_endpoint_to_repository` tool to:
- Find the controller method handling `/api/users`
- Trace through service layer
- Identify repository calls
- Find the entity and database table
- Show the complete flow diagram

#### Example 4: Trace Data Transformation

```
@cody How is the UserDTO transformed through the application layers?
```

Cody will use the `trace_data_transformation` tool to:
- Find the UserDTO class
- Locate mapper/converter classes
- Show transformation steps
- Display fields added/removed at each step

#### Example 5: Get DTO Structure

```
@cody Show me the structure of the UserDTO class
```

Cody will use the `get_dto_structure` tool to:
- List all fields with their types
- Show JPA annotations (@Column, @Id, etc.)
- Display validation annotations
- Show relationships (@OneToMany, @ManyToOne, etc.)

---

## Verifying the Setup

### Step 1: Check Cody Settings

In IntelliJ IDEA:
1. Open Settings (Ctrl+Alt+S)
2. Navigate to: Tools → Cody
3. Check if MCP servers are loaded
4. Look for "spring-micro-context" and "spring-macro-context" in the list

### Step 2: Test in Cody Chat

Open Cody chat and type:
```
@cody List available MCP tools
```

You should see the available tools from both servers.

### Step 3: Test a Simple Query

Try a simple analysis:
```
@cody Find the definition of the User class in my project
```

If Cody responds with the class definition, the setup is working!

---

## Troubleshooting

### Issue 1: "MCP server not found" or "MCP server failed to start"

**Solution:**
- Verify all paths in `cody_settings.json` are correct and use double backslashes
- Check that Node.js is in your PATH: `node --version`
- Verify the JAR file exists: `packages\java-parser-service\target\java-parser-service-1.0.0.jar`
- Check IntelliJ logs: Help → Show Log in Explorer → look for MCP-related errors

### Issue 2: "Java Parser Service failed to start"

**Solution:**
- Verify Java is installed: `java -version` (needs Java 11+)
- Rebuild the JAR:
  ```cmd
  cd packages\java-parser-service
  mvn clean package -DskipTests
  ```
- Check if JAVA_HOME environment variable is set correctly

### Issue 3: Tools not appearing in Cody

**Solution:**
- Restart IntelliJ IDEA completely
- Check if `cody_settings.json` is in the correct location
- Validate JSON syntax (use https://jsonlint.com/)
- Check Cody plugin version (needs recent version with MCP support)

### Issue 4: "Cannot find module" errors

**Solution:**
- Reinstall dependencies:
  ```cmd
  cd C:\Projects\CodyMcpServers
  npm install
  npm run build
  ```

### Issue 5: Workspace folder not detected

**Solution:**
- Ensure you have a Spring Boot project open in IntelliJ
- The project should have a `src/main/java` directory
- Check that `${workspaceFolder}` is resolving correctly

### Issue 6: Permission denied errors on Windows

**Solution:**
- Run Command Prompt or PowerShell as Administrator when building
- Check file permissions on the installation directory
- Disable antivirus temporarily to see if it's blocking execution

---

## Advanced Configuration

### Running Multiple Projects

If you work on multiple Spring Boot projects, the `${workspaceFolder}` variable will automatically use the currently open project in IntelliJ.

### Custom Package Filtering

To analyze only your project's packages:

```json
"env": {
  "PACKAGE_INCLUDE": "com.mycompany.*",
  "PACKAGE_EXCLUDE": "com.mycompany.test.*,com.mycompany.generated.*"
}
```

### Increasing Call Chain Depth

For deep analysis of complex call chains:

```json
"env": {
  "CALL_CHAIN_MAX_DEPTH": "25"
}
```

**Warning:** Higher values may slow down analysis.

### Debugging MCP Servers

To see debug output, run the servers manually:

```cmd
node C:\Projects\CodyMcpServers\packages\macro-context\dist\index.js C:\path\to\your\spring-project
```

This will show startup logs and any errors.

---

## Performance Tips

1. **Package Filtering**: Use `PACKAGE_INCLUDE` to analyze only relevant packages
2. **Exclude Test Code**: Add `*.test.*,*.tests.*` to `PACKAGE_EXCLUDE` if not needed
3. **Reasonable Depth**: Keep `CALL_CHAIN_MAX_DEPTH` between 10-20 for best performance
4. **Close Unused Servers**: Comment out servers in `cody_settings.json` if not needed

---

## Example cody_settings.json for Production

Here's a complete example with all options:

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
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "PACKAGE_EXCLUDE": "*.test.*,*.generated.*"
      }
    },
    "spring-macro-context": {
      "command": "node",
      "args": [
        "C:\\Projects\\CodyMcpServers\\packages\\macro-context\\dist\\index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "PACKAGE_EXCLUDE": "*.test.*,*.generated.*",
        "CALL_CHAIN_MAX_DEPTH": "15",
        "STOP_AT_PACKAGES": "java.*,javax.*,org.springframework.*,org.hibernate.*,org.apache.*,com.fasterxml.*"
      }
    }
  }
}
```

---

## Getting Help

If you encounter issues:

1. Check the logs in IntelliJ: Help → Show Log in Explorer
2. Run the MCP server manually to see error messages
3. Verify all prerequisites are installed and in PATH
4. Check that paths in `cody_settings.json` use double backslashes
5. Ensure the project has `src/main/java` directory structure

---

## Next Steps

After successful setup:

1. Try each tool with simple queries
2. Experiment with different Spring Boot projects
3. Customize package filtering for your organization
4. Share the setup with your team

---

## Tools Status

| Tool Category | Total Tools | Implemented | Status |
|--------------|-------------|-------------|---------|
| Micro Context | 5 | 5 | ✅ 100% Complete |
| Macro Context | 7 | 4 | 🟡 57% Complete |
| Spring Component | 4 | 0 | ⏳ Not Started |
| **TOTAL** | **16** | **9** | **56% Complete** |

---

## License

This project is provided as-is for use with Cody and IntelliJ IDEA.
