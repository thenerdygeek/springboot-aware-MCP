# Quick Start Guide - MCP Server Testing

This guide will help you quickly run the MCP server tests against the Spring Boot test project.

---

## Prerequisites

Ensure you have the following installed:
- **Java 21+** (JDK)
- **Node.js 18+**
- **Maven 3.9+**

Check versions:
```bash
java -version
node --version
mvn --version
```

---

## Quick Start (30 seconds)

### 1. Navigate to Project Directory
```bash
cd /Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers
```

### 2. Run All Tests
```bash
./run-tests.sh test-spring-project
```

That's it! The script will:
- ✅ Check prerequisites
- ✅ Build all packages (Java Parser Service, Micro Context, Macro Context, Spring Component)
- ✅ Run 12 automated tests
- ✅ Generate detailed markdown report

**Expected Output:**
```
========================================
Test Execution Complete
========================================

Total:   12
Passed:  12 ✅
Failed:  0 ❌
Skipped: 0 ⚠️

Success Rate: 100.00%
```

### 3. View Test Report
```bash
# Latest report
cat test-reports/test-report-*.md | tail -500

# Or open in your editor
code test-reports/  # VS Code
```

---

## What Gets Tested?

### 12 Automated Test Cases

| Test ID | Tool | What It Tests |
|---------|------|---------------|
| TC-2.1.1 | resolve_symbol | Symbol resolution in controllers |
| TC-2.2.1 | get_function_definition | Method extraction with annotations |
| TC-2.3.1 | get_dto_structure | DTO field and validation analysis |
| TC-2.4.1 | find_mockable_dependencies | Service dependency detection |
| TC-2.5.1 | find_execution_branches | Code complexity analysis |
| TC-3.1.1 | build_method_call_chain | Method call tracing |
| TC-3.4.1 | trace_endpoint_to_repository | Endpoint → DB flow |
| TC-3.5.1 | find_entity_by_table | Table-to-entity mapping |
| TC-4.1.1 | analyze_controller_method | Spring MVC endpoint analysis |
| TC-4.2.1 | find_controller_for_endpoint | Endpoint resolution |
| TC-4.3.1 | find_implementations | Interface implementation detection |
| TC-4.4.1 | find_feature_flag_usage | Feature flag pattern search |

---

## Test Project Details

**Location:** `test-spring-project/`

**What's Inside:**
- ✅ Spring Boot 3.4.1 + Java 21
- ✅ Spring Security 6 (OAuth2 + JWT)
- ✅ 25 Java files, 1,466 lines of code
- ✅ 14 REST endpoints (CRUD operations)
- ✅ 4 JPA entities with relationships
- ✅ Comprehensive validation (@Valid, @NotBlank, @Email, etc.)
- ✅ Global exception handling (@ControllerAdvice)
- ✅ Feature flags

**Architecture:**
```
Controller → Service → Repository → Database
    ↓          ↓           ↓
  @Valid   @Transactional @Query
```

---

## Manual Testing (Individual Tools)

### Test a Single MCP Server

**Micro Context Server:**
```bash
cd packages/micro-context
npm run build
node dist/index.js ../../test-spring-project
```

Then send JSON-RPC requests via stdin:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"resolve_symbol","arguments":{"symbol_name":"userService","context_file":"test-spring-project/src/main/java/com/example/mcptest/controller/UserController.java"}}}
```

**Macro Context Server:**
```bash
cd packages/macro-context
npm run build
node dist/index.js ../../test-spring-project
```

**Spring Component Server:**
```bash
cd packages/spring-component
npm run build
node dist/index.js ../../test-spring-project
```

---

## Rebuilding from Scratch

If you need to rebuild everything:

```bash
# Clean all packages
cd packages/java-parser-service && mvn clean
cd ../micro-context && npm run clean
cd ../macro-context && npm run clean
cd ../spring-component && npm run clean

# Build all packages
cd ../../
./run-tests.sh test-spring-project
```

---

## Troubleshooting

### Issue: "Java version not found"
**Solution:** Install JDK 21+
```bash
# macOS
brew install openjdk@21

# Ubuntu/Debian
sudo apt install openjdk-21-jdk
```

### Issue: "Maven not found"
**Solution:** Install Maven
```bash
# macOS
brew install maven

# Ubuntu/Debian
sudo apt install maven
```

### Issue: "Tests timing out"
**Solution:** Ensure Java Parser Service is built
```bash
cd packages/java-parser-service
mvn clean package
```

### Issue: "Module not found" errors
**Solution:** Rebuild TypeScript packages
```bash
cd packages/micro-context && npm run build
cd ../macro-context && npm run build
cd ../spring-component && npm run build
```

### Issue: "Cannot find test project"
**Solution:** Verify test project path
```bash
ls test-spring-project/src/main/java/com/example/mcptest/
# Should show: controller, domain, dto, exception, repository, security, service
```

---

## Project Structure

```
CodyMcpServers/
├── packages/
│   ├── java-parser-service/      # JavaParser backend (JAR)
│   ├── micro-context/             # Micro context MCP server
│   ├── macro-context/             # Macro context MCP server
│   └── spring-component/          # Spring component MCP server
├── test-spring-project/           # Spring Boot 3.4.1 test app
│   ├── src/main/java/com/example/mcptest/
│   ├── ARCHITECTURE.md            # Complete architecture docs
│   ├── MCP_TEST_SPEC.md          # Test specifications
│   └── README.md                  # Project overview
├── test-reports/                  # Generated test reports
├── run-tests.sh                   # Main test script
├── test-runner.js                 # Node.js test executor
├── TEST_RESULTS_SUMMARY.md       # Comprehensive results
└── QUICKSTART.md                  # This file
```

---

## Next Steps

### Explore the Test Project
```bash
# Read architecture documentation
cat test-spring-project/ARCHITECTURE.md

# Read MCP test specifications
cat test-spring-project/MCP_TEST_SPEC.md

# Browse the code
cd test-spring-project/src/main/java/com/example/mcptest/
```

### View Comprehensive Results
```bash
cat TEST_RESULTS_SUMMARY.md
```

### Integrate with Your IDE

**VS Code:**
1. Install "Claude Code" extension (if available)
2. Configure MCP servers in `.vscode/settings.json`:
```json
{
  "mcp.servers": {
    "spring-micro": {
      "command": "node",
      "args": ["packages/micro-context/dist/index.js", "${workspaceFolder}"]
    },
    "spring-macro": {
      "command": "node",
      "args": ["packages/macro-context/dist/index.js", "${workspaceFolder}"]
    },
    "spring-component": {
      "command": "node",
      "args": ["packages/spring-component/dist/index.js", "${workspaceFolder}"]
    }
  }
}
```

---

## Support

For issues or questions:
1. Check `TEST_RESULTS_SUMMARY.md` for detailed information
2. Review test report in `test-reports/` directory
3. Check package-specific README files
4. Review MCP_TEST_SPEC.md for expected behavior

---

## Success Criteria

✅ All 12 tests passing
✅ 100% success rate
✅ Test report generated
✅ No timeout errors
✅ All tools responding correctly

**Current Status:** ✅ All criteria met (100% success rate)

---

**Last Updated:** 2025-12-12
**Version:** 1.0.0
**Status:** Production Ready
