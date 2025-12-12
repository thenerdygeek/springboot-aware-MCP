# MCP Server Logging Guide

Complete guide for logging all tool calls and responses in your MCP servers.

---

## 📝 Overview

All three MCP servers now automatically log:
- **Tool Name** - Which tool was called
- **Arguments** - All input parameters
- **Response** - The full response/result
- **Execution Time** - How long it took (in milliseconds)
- **Success/Failure** - Whether the call succeeded or failed
- **Errors** - Full error messages if failed
- **Timestamp** - When the call occurred

---

## 📍 Log File Locations

Logs are stored in your **workspace root** directory:

```
your-spring-project/
└── .mcp-logs/                           # Log directory (auto-created)
    ├── micro-context-2025-12-12.log          # JSON format
    ├── micro-context-2025-12-12-readable.log # Human-readable format
    ├── macro-context-2025-12-12.log          # JSON format
    ├── macro-context-2025-12-12-readable.log # Human-readable format
    ├── spring-component-2025-12-12.log       # JSON format
    └── spring-component-2025-12-12-readable.log # Human-readable format
```

**Two formats for each server:**
1. **JSON format** (`.log`) - Machine-readable, easy to parse programmatically
2. **Readable format** (`-readable.log`) - Human-readable with formatting

---

## 🚀 Quick Start

### 1. Run Any MCP Server

```bash
cd /Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers

# Run micro-context server (logging enabled by default)
node packages/micro-context/dist/index.js test-spring-project
```

**Console output:**
```
🚀 Starting Spring Boot Micro Context MCP Server
📁 Workspace: /Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers/test-spring-project
📦 Package filter: none
📝 Logging to: /Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers/test-spring-project/.mcp-logs/micro-context-2025-12-12.log
✅ Spring Boot Micro Context MCP Server running
📡 Listening for MCP requests...
```

### 2. Make Tool Calls

The server will automatically log every tool call. Run the test suite:

```bash
./run-tests.sh test-spring-project
```

### 3. View Logs

```bash
# View readable format (recommended)
cat test-spring-project/.mcp-logs/micro-context-*-readable.log

# View JSON format (for parsing)
cat test-spring-project/.mcp-logs/micro-context-*.log | jq '.'

# Tail logs in real-time
tail -f test-spring-project/.mcp-logs/*-readable.log
```

---

## 📊 Log Formats

### JSON Format (`.log`)

Each line is a complete JSON object:

```json
{
  "timestamp": "2025-12-12T10:34:35.123Z",
  "toolName": "resolve_symbol",
  "arguments": {
    "symbol_name": "userService",
    "context_file": "/path/to/UserController.java"
  },
  "response": "# Symbol Resolution: userService\n\n## Resolved Type\n`com.example.mcptest.service.UserService`\n...",
  "executionTimeMs": 245,
  "success": true
}
```

**Fields:**
- `timestamp` - ISO 8601 format
- `toolName` - Name of the tool
- `arguments` - All input parameters
- `response` - Full response text (truncated in JSON, full in readable format)
- `error` - Error message (only if `success: false`)
- `executionTimeMs` - Execution time in milliseconds
- `success` - boolean (true/false)

### Readable Format (`-readable.log`)

Human-friendly format with clear sections:

```
================================================================================
[2025-12-12T10:34:35.123Z] ✅ SUCCESS - resolve_symbol
Execution Time: 245ms
================================================================================

📥 ARGUMENTS:
{
  "symbol_name": "userService",
  "context_file": "/path/to/UserController.java"
}

📤 RESPONSE:
# Symbol Resolution: userService

## Resolved Type
`com.example.mcptest.service.UserService`

## Declaration
- **Type:** Field
- **Location:** test-spring-project/src/main/java/com/example/mcptest/controller/UserController.java:23
- **Package:** com.example.mcptest.service
- **Custom Class:** Yes

## File Path
`/Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers/test-spring-project/src/main/java/com/example/mcptest/service/UserService.java`

---
Symbol successfully resolved to custom class.

================================================================================
```

---

## 🎛️ Configuration Options

### Environment Variables

Control logging behavior with environment variables:

```bash
# Disable logging completely
MCP_LOGGING=false node packages/micro-context/dist/index.js test-spring-project

# Enable debug mode (also logs to console)
MCP_DEBUG=true node packages/micro-context/dist/index.js test-spring-project

# Both can be combined
MCP_LOGGING=true MCP_DEBUG=true node packages/micro-context/dist/index.js test-spring-project
```

**Variables:**
- `MCP_LOGGING` - Enable/disable logging (default: `true`)
- `MCP_DEBUG` - Also log to console in real-time (default: `false`)

### Example with Debug Mode

```bash
MCP_DEBUG=true node packages/micro-context/dist/index.js test-spring-project
```

**Output:**
```
🚀 Starting Spring Boot Micro Context MCP Server
📝 Logging to: /path/.mcp-logs/micro-context-2025-12-12.log
✅ Spring Boot Micro Context MCP Server running

✅ [2025-12-12T10:34:35.123Z] resolve_symbol (245ms)
Arguments: {
  "symbol_name": "userService",
  "context_file": "/path/to/UserController.java"
}

❌ [2025-12-12T10:35:12.456Z] get_dto_structure (89ms)
Arguments: {
  "class_name": "NonExistentDTO"
}
Error: Class not found: NonExistentDTO
```

---

## 📈 Analyzing Logs

### Parse JSON Logs with jq

```bash
# Count total tool calls
cat test-spring-project/.mcp-logs/micro-context-*.log | wc -l

# Count successful calls
cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r 'select(.success == true)' | wc -l

# Count failed calls
cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r 'select(.success == false)' | wc -l

# Average execution time
cat test-spring-project/.mcp-logs/micro-context-*.log | jq '.executionTimeMs' | awk '{sum+=$1; count++} END {print sum/count "ms"}'

# Find slowest calls
cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r '[.toolName, .executionTimeMs] | @tsv' | sort -k2 -rn | head -10

# Extract all tool names used
cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r '.toolName' | sort | uniq -c

# Find all errors
cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r 'select(.success == false) | [.timestamp, .toolName, .error] | @tsv'
```

### Example Analysis Output

```bash
# Tool usage statistics
$ cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r '.toolName' | sort | uniq -c
   5 resolve_symbol
   3 get_function_definition
   2 get_dto_structure
   1 find_mockable_dependencies
   1 find_execution_branches

# Performance analysis
$ cat test-spring-project/.mcp-logs/micro-context-*.log | jq -r '[.toolName, .executionTimeMs] | @tsv' | sort -k2 -rn
get_dto_structure       1234
build_method_call_chain 856
resolve_symbol          245
find_mockable_dependencies 123
get_function_definition 89
```

---

## 🔍 Real-World Examples

### Example 1: Successful Tool Call

**JSON Log:**
```json
{
  "timestamp": "2025-12-12T15:23:45.678Z",
  "toolName": "analyze_controller_method",
  "arguments": {
    "controller_name": "UserController",
    "method_name": "createUser"
  },
  "response": "# Controller Method Analysis: UserController.createUser\n\n## Method Signature\n```java\npublic ResponseEntity<ApiResponse<UserDTO>> createUser(@Valid @RequestBody UserDTO userDTO)\n```\n\n## Summary\n- **Total Parameters:** 1\n- **Request Body Parameters:** 1\n- **Path Variables:** 0\n- **Request Parameters:** 0\n- **Validation:** Yes (@Valid)\n\n## HTTP Mapping\n- **Method:** POST\n- **Path:** /api/users\n- **Produces:** application/json\n\n## Security\n- **Authorization:** Required\n- **Method Security:** @PreAuthorize(\"hasRole('ADMIN')\")\n\n## Request Body\n\n### Parameter: userDTO\n- **Type:** UserDTO\n- **Annotations:** @Valid, @RequestBody\n- **Validation Rules:**\n  - username: @NotBlank, @Size(min=3, max=50)\n  - email: @NotBlank, @Email\n  - password: @NotBlank, @Size(min=8, max=100)\n\n## Response Type\nResponseEntity<ApiResponse<UserDTO>>\n\n**Status Code:** 201 CREATED\n",
  "executionTimeMs": 342,
  "success": true
}
```

### Example 2: Failed Tool Call

**JSON Log:**
```json
{
  "timestamp": "2025-12-12T15:25:12.345Z",
  "toolName": "get_dto_structure",
  "arguments": {
    "class_name": "NonExistentDTO"
  },
  "error": "Cannot invoke \"com.fasterxml.jackson.databind.JsonNode.asText()\" because the return value of \"com.fasterxml.jackson.databind.JsonNode.get(String)\" is null",
  "executionTimeMs": 89,
  "success": false
}
```

**Readable Log:**
```
================================================================================
[2025-12-12T15:25:12.345Z] ❌ ERROR - get_dto_structure
Execution Time: 89ms
================================================================================

📥 ARGUMENTS:
{
  "class_name": "NonExistentDTO"
}

❌ ERROR:
"Cannot invoke \"com.fasterxml.jackson.databind.JsonNode.asText()\" because the return value of \"com.fasterxml.jackson.databind.JsonNode.get(String)\" is null"

================================================================================
```

---

## 🛠️ Programmatic Log Access

### Node.js Example

```javascript
const fs = require('fs');
const path = require('path');

// Read log file
const logFile = 'test-spring-project/.mcp-logs/micro-context-2025-12-12.log';
const logs = fs.readFileSync(logFile, 'utf8')
  .trim()
  .split('\n')
  .map(line => JSON.parse(line));

// Calculate statistics
const totalCalls = logs.length;
const successfulCalls = logs.filter(l => l.success).length;
const failedCalls = logs.filter(l => l.success === false).length;
const avgExecutionTime = logs.reduce((sum, l) => sum + l.executionTimeMs, 0) / totalCalls;

console.log(`Total Calls: ${totalCalls}`);
console.log(`Successful: ${successfulCalls} (${(successfulCalls/totalCalls*100).toFixed(2)}%)`);
console.log(`Failed: ${failedCalls} (${(failedCalls/totalCalls*100).toFixed(2)}%)`);
console.log(`Average Execution Time: ${avgExecutionTime.toFixed(2)}ms`);

// Find slowest tool
const slowest = logs.reduce((max, l) => l.executionTimeMs > max.executionTimeMs ? l : max);
console.log(`Slowest Tool: ${slowest.toolName} (${slowest.executionTimeMs}ms)`);
```

### Python Example

```python
import json
from pathlib import Path
from statistics import mean

# Read log file
log_file = Path('test-spring-project/.mcp-logs/micro-context-2025-12-12.log')
logs = [json.loads(line) for line in log_file.read_text().strip().split('\n')]

# Calculate statistics
total_calls = len(logs)
successful_calls = len([l for l in logs if l['success']])
failed_calls = len([l for l in logs if not l['success']])
avg_execution_time = mean([l['executionTimeMs'] for l in logs])

print(f"Total Calls: {total_calls}")
print(f"Successful: {successful_calls} ({successful_calls/total_calls*100:.2f}%)")
print(f"Failed: {failed_calls} ({failed_calls/total_calls*100:.2f}%)")
print(f"Average Execution Time: {avg_execution_time:.2f}ms")

# Tool usage breakdown
from collections import Counter
tool_counts = Counter(l['toolName'] for l in logs)
print("\nTool Usage:")
for tool, count in tool_counts.most_common():
    print(f"  {tool}: {count}")
```

---

## 📋 Log Rotation

Logs are automatically rotated **daily** based on the date in the filename:
- `micro-context-2025-12-12.log`
- `micro-context-2025-12-13.log`
- etc.

### Manual Cleanup

```bash
# Delete logs older than 7 days
find test-spring-project/.mcp-logs -name "*.log" -mtime +7 -delete

# Archive old logs
tar -czf mcp-logs-$(date +%Y%m%d).tar.gz test-spring-project/.mcp-logs/*.log
```

---

## 🎯 Use Cases

### 1. Debugging Tool Issues

When a tool isn't working as expected, check the logs:

```bash
# Find all failed calls for a specific tool
cat test-spring-project/.mcp-logs/*.log | jq -r 'select(.toolName == "resolve_symbol" and .success == false)'
```

### 2. Performance Monitoring

Track which tools are slowest:

```bash
# Top 10 slowest tool calls
cat test-spring-project/.mcp-logs/*.log | jq -r '[.toolName, .executionTimeMs, .timestamp] | @tsv' | sort -k2 -rn | head -10
```

### 3. Usage Analytics

Understand which tools are used most:

```bash
# Tool usage pie chart data
cat test-spring-project/.mcp-logs/*.log | jq -r '.toolName' | sort | uniq -c | sort -rn
```

### 4. Error Rate Tracking

Monitor error rates over time:

```bash
# Error rate by hour
cat test-spring-project/.mcp-logs/*.log | jq -r '[(.timestamp | split("T")[1] | split(":")[0]), (if .success then "success" else "error" end)] | @tsv' | sort | uniq -c
```

---

## 🔐 Privacy & Security

**What's Logged:**
- Tool names
- Input parameters
- Response data
- Execution times
- Error messages

**NOT Logged:**
- Passwords or secrets (unless explicitly passed as parameters)
- User authentication tokens
- MCP protocol handshake messages

**Security Considerations:**
- Logs are stored locally in `.mcp-logs/` directory
- Add `.mcp-logs/` to `.gitignore` to avoid committing logs
- Logs may contain sensitive code/business logic
- Review logs before sharing

**.gitignore addition:**
```
# MCP Server Logs
.mcp-logs/
```

---

## 🚨 Troubleshooting

### Logs Not Being Created

**Check:**
1. Logging is enabled: `MCP_LOGGING` is not set to `false`
2. Workspace directory is writable
3. Server started successfully (check console output)

### Log Directory Permissions

```bash
# Fix permissions
chmod 755 test-spring-project/.mcp-logs
chmod 644 test-spring-project/.mcp-logs/*.log
```

### Viewing Logs from Test Suite

```bash
# The test suite runs servers in the background
# Logs are still written to .mcp-logs/ directory
ls -la test-spring-project/.mcp-logs/

# View logs after test run
cat test-spring-project/.mcp-logs/*-readable.log | tail -100
```

---

## 📚 Summary

**Key Benefits:**
✅ Automatic logging of all tool calls
✅ No code changes needed - works out of the box
✅ Two formats: JSON (machine-readable) and Readable (human-friendly)
✅ Performance metrics (execution time)
✅ Error tracking
✅ Easy to parse and analyze
✅ Daily log rotation
✅ Configurable via environment variables

**Log Locations:**
```
{workspace-root}/.mcp-logs/
├── micro-context-YYYY-MM-DD.log
├── micro-context-YYYY-MM-DD-readable.log
├── macro-context-YYYY-MM-DD.log
├── macro-context-YYYY-MM-DD-readable.log
├── spring-component-YYYY-MM-DD.log
└── spring-component-YYYY-MM-DD-readable.log
```

**Quick Commands:**
```bash
# View logs
cat {workspace}/.mcp-logs/*-readable.log

# Tail logs in real-time
tail -f {workspace}/.mcp-logs/*-readable.log

# Parse JSON logs
cat {workspace}/.mcp-logs/*.log | jq '.'

# Count tool calls
cat {workspace}/.mcp-logs/*.log | wc -l
```

---

**Version:** 1.0.0
**Last Updated:** 2025-12-12
**Status:** ✅ Production Ready
