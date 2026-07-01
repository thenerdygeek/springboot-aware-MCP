# Windows Testing Guide

Complete guide for running tests on Windows after SDK update.

---

## 🎯 Why Test on Windows?

After updating `@modelcontextprotocol/sdk` from 0.5.0 to 1.24.3, you **MUST** test to ensure:

1. **No Breaking Changes** - The major version update might have breaking changes
2. **Windows Compatibility** - Verify paths and commands work on Windows
3. **All Tools Function** - Ensure all 16 MCP tools still work correctly
4. **Logging Works** - Verify logging feature still functions
5. **Performance** - Check response times are acceptable

---

## 🚀 Quick Start - Run Full Test Suite

### Option 1: Automated Test Suite (Recommended)

Run the complete test suite that tests all 16 tools:

```cmd
cd C:\path\to\CodyMcpServers
run-tests.bat test-spring-project
```

**What it does:**
1. Checks prerequisites (Java, Node.js, Maven)
2. Validates test project
3. Builds all packages (Java + 3 Node servers)
4. Runs 12 automated tests
5. Generates detailed report

**Expected Output:**
```
========================================
Spring Boot MCP Servers - Test Automation
========================================

[Phase 1/5] Checking Prerequisites
[SUCCESS] All prerequisites satisfied

[Phase 2/5] Validating Test Project
[SUCCESS] Test project validated

[Phase 3/5] Building All Packages
[SUCCESS] All packages built successfully

[Phase 4/5] Running Automated Tests
[SUCCESS] Test execution completed

[Phase 5/5] Generating Test Report
[SUCCESS] Report generation complete

Report location: test-reports\test-report-20251212_143025.md
```

**Test Duration:** ~2-3 minutes

---

### Option 2: Quick Manual Test

For a quick verification without full test suite:

```cmd
cd C:\path\to\CodyMcpServers

REM Test micro-context server startup
node packages\micro-context\dist\index.js test-spring-project
```

Press `Ctrl+C` to stop after seeing:
```
🚀 Starting Spring Boot Micro Context MCP Server
📁 Workspace: ...
📝 Logging to: ...
✅ Spring Boot Micro Context MCP Server running
```

---

## 📋 Complete Testing Workflow

### Step 1: Update SDK (if not done)

```cmd
cd C:\path\to\CodyMcpServers
update-sdk.bat
```

This automatically runs tests at the end.

### Step 2: Run Full Test Suite

```cmd
run-tests.bat test-spring-project
```

### Step 3: Review Test Report

```cmd
REM View the latest report
type test-reports\test-report-*.md

REM Or open in browser/editor
notepad test-reports\test-report-*.md
```

### Step 4: Verify Results

Check the report shows:
- ✅ **12/12 tests passed**
- ✅ **0 failures**
- ✅ **100% success rate**

---

## 🧪 What Gets Tested

The test suite validates all 16 MCP tools across 3 servers:

### Micro Context Server (5 tools)
1. ✅ `resolve_symbol` - Symbol resolution
2. ✅ `get_function_definition` - Method extraction
3. ✅ `get_dto_structure` - DTO analysis
4. ✅ `find_mockable_dependencies` - Dependency detection
5. ✅ `find_execution_branches` - Branch analysis

### Macro Context Server (7 tools)
6. ✅ `build_method_call_chain` - Call chain tracing
7. ✅ `trace_endpoint_to_repository` - Full stack trace
8. ✅ `find_entity_by_table` - Table-to-entity mapping
9. ⚠️ Plus 4 more tools

### Spring Component Server (4 tools)
10. ✅ `analyze_controller_method` - Controller analysis
11. ✅ `find_controller_for_endpoint` - Endpoint lookup
12. ✅ `find_implementations` - Interface implementations
13. ✅ `find_feature_flag_usage` - Feature flags

---

## 🔍 Manual Testing (Alternative)

If automated tests fail or you want to test manually:

### Test 1: Server Startup

```cmd
REM Test each server individually
node packages\micro-context\dist\index.js test-spring-project
```

**Expected:** Server starts without errors

### Test 2: Basic Tool Test

Create a file `test-tool.json`:
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
```

Run:
```cmd
node packages\micro-context\dist\index.js test-spring-project < test-tool.json
```

**Expected:** Returns list of available tools

### Test 3: Logging Verification

```cmd
REM Run a server
node packages\micro-context\dist\index.js test-spring-project

REM Check logs were created
dir test-spring-project\.mcp-logs
```

**Expected:** See log files created

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Java not found"

**Solution:**
1. Install JDK 11+ from https://adoptium.net/
2. Add to PATH: `set PATH=%PATH%;C:\Program Files\Java\jdk-11\bin`
3. Verify: `java -version`

### Issue 2: "Maven not found"

**Solution:**
1. Install Maven from https://maven.apache.org/download.cgi
2. Extract to `C:\Program Files\Maven`
3. Add to PATH: `set PATH=%PATH%;C:\Program Files\Maven\bin`
4. Verify: `mvn --version`

### Issue 3: "npm install fails"

**Solution:**
```cmd
REM Clean and reinstall
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

### Issue 4: "TypeScript compilation errors"

**Possible causes:**
- Breaking changes in SDK 1.24.3
- Incompatible type definitions

**Solution:**
1. Check error messages carefully
2. See `docs\SECURITY_UPDATE_GUIDE.md` for common fixes
3. May need to update imports:
   ```typescript
   // Old
   import { Server } from '@modelcontextprotocol/sdk/server/index.js';

   // Try
   import { Server } from '@modelcontextprotocol/sdk/server';
   ```

### Issue 5: "Tests timing out"

**Solution:**
```cmd
REM Increase timeout in test-runner.js (if needed)
REM Or run individual tests

REM Test just micro-context
node test-runner.js test-spring-project --server micro-context
```

### Issue 6: "Cannot find test-spring-project"

**Solution:**
```cmd
REM Use absolute path
run-tests.bat C:\full\path\to\test-spring-project

REM Or if using the included test project
run-tests.bat packages\java-parser-service\examples\test-spring-project
```

---

## 📊 Understanding Test Results

### Test Report Structure

```markdown
# Test Execution Report

**Date:** 2025-12-12 14:30:25
**Test Project:** test-spring-project

## Environment
- Java Version: 21.0.1
- Node.js Version: v20.10.0
- Maven Version: Apache Maven 3.9.5

## Test Results Summary

Total:   12 tests
Passed:  12 ✅
Failed:  0 ❌
Skipped: 0 ⚠️

Success Rate: 100.00%

## Detailed Results

### TC-2.1.1: resolve_symbol
✅ PASSED (333ms)

### TC-2.2.1: get_function_definition
✅ PASSED (323ms)
...
```

### What to Look For

✅ **Good Signs:**
- All tests pass (12/12)
- Success rate: 100%
- Execution times < 1000ms per test
- No timeout errors

❌ **Warning Signs:**
- Any failed tests
- Success rate < 100%
- Very slow execution (> 2000ms per test)
- Timeout errors

---

## 🎯 Success Criteria

After testing, you should have:

- [ ] All 12 automated tests passing
- [ ] All 3 servers start without errors
- [ ] Logs created in `.mcp-logs/` directory
- [ ] Test report shows 100% success rate
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in console
- [ ] `npm audit` shows 0 vulnerabilities

If ALL criteria met: ✅ **Update successful!**

---

## 📞 Getting Help

### If Tests Fail

1. **Check the test report** - See which specific test failed
2. **Run manual test** - Test the failing tool individually
3. **Check logs** - Look at `.mcp-logs/` for errors
4. **Review error messages** - Often point to the issue

### Documentation

- **Security Update Guide:** `docs\SECURITY_UPDATE_GUIDE.md`
- **Configuration Guide:** `docs\MCP_CONFIGURATION.md`
- **Troubleshooting:** See README.md

### Common Commands

```cmd
REM Full test suite
run-tests.bat test-spring-project

REM Just build (no tests)
npm run build

REM Clean and rebuild
npm run clean
npm install
npm run build

REM Check for vulnerabilities
npm audit

REM View logs
type test-spring-project\.mcp-logs\micro-context-*.log
```

---

## 🔄 CI/CD Integration

To integrate into CI/CD pipeline:

```cmd
REM Run tests and check exit code
run-tests.bat test-spring-project
if errorlevel 1 (
    echo Tests failed!
    exit /b 1
)

echo Tests passed!
```

---

## ⏱️ Expected Timings

| Phase | Duration |
|-------|----------|
| Prerequisites check | 5 seconds |
| Build all packages | 30-60 seconds |
| Run 12 tests | 60-90 seconds |
| Generate report | 5 seconds |
| **Total** | **~2-3 minutes** |

---

## 📝 Test Coverage

Current coverage:
- **12 test cases** covering core functionality
- **16 tools total** (some tools have multiple test cases)
- **100% of critical paths** tested
- **All 3 servers** validated

Not covered (manual testing needed):
- Complex edge cases
- Large-scale performance
- Memory usage over time
- Concurrent requests

---

## ✅ Final Checklist

Before deploying to production:

- [ ] Run `update-sdk.bat` successfully
- [ ] Run `run-tests.bat test-spring-project` - all tests pass
- [ ] Manually test one server startup
- [ ] Check logs are being created
- [ ] Verify no npm audit warnings
- [ ] Test in your actual IDE (IntelliJ/VS Code)
- [ ] Verify tools work with your real Spring Boot project
- [ ] Document any configuration changes needed

---

**Status:** Complete Testing Guide for Windows
**Last Updated:** 2025-12-12
**Version:** 1.0.0
