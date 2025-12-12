# MCP Server Logging - Quick Summary

## ✅ Logging Feature Added Successfully!

All three MCP servers now automatically log every tool call with complete details.

---

## 📍 Where Logs Are Stored

Logs will be created in your **workspace root** under `.mcp-logs/` directory:

```
your-spring-project/
└── .mcp-logs/                                    # Created automatically
    ├── micro-context-2025-12-12.log              # JSON format (machine-readable)
    ├── micro-context-2025-12-12-readable.log     # Human-readable format
    ├── macro-context-2025-12-12.log
    ├── macro-context-2025-12-12-readable.log
    ├── spring-component-2025-12-12.log
    └── spring-component-2025-12-12-readable.log
```

**Example for test-spring-project:**
```
/Users/subhankarhalder/Desktop/Programs/scripts/CodyMcpServers/test-spring-project/.mcp-logs/
```

---

## 🎯 What Gets Logged

Every tool call logs:
- ✅ **Tool Name** (e.g., `resolve_symbol`)
- ✅ **Input Arguments** (all parameters)
- ✅ **Response** (full tool response)
- ✅ **Execution Time** (in milliseconds)
- ✅ **Success/Failure Status**
- ✅ **Error Messages** (if failed)
- ✅ **Timestamp** (ISO 8601 format)

---

## 🚀 How to Use

### Option 1: Run Normally (Logging Enabled by Default)

```bash
# Just run any MCP server - logging happens automatically
node packages/micro-context/dist/index.js test-spring-project
```

Console will show:
```
📝 Logging to: /path/to/test-spring-project/.mcp-logs/micro-context-2025-12-12.log
```

### Option 2: Enable Debug Mode (Also Log to Console)

```bash
# See logs in real-time on console
MCP_DEBUG=true node packages/micro-context/dist/index.js test-spring-project
```

### Option 3: Disable Logging

```bash
# Turn off logging completely
MCP_LOGGING=false node packages/micro-context/dist/index.js test-spring-project
```

---

## 📖 Viewing Logs

### View Readable Format (Recommended)

```bash
# View human-readable logs
cat test-spring-project/.mcp-logs/micro-context-*-readable.log

# Tail logs in real-time
tail -f test-spring-project/.mcp-logs/*-readable.log
```

**Example Output:**
```
================================================================================
[2025-12-12T10:34:35.678Z] ✅ SUCCESS - resolve_symbol
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
- **Location:** UserController.java:23
- **Package:** com.example.mcptest.service
- **Custom Class:** Yes

================================================================================
```

### Parse JSON Logs

```bash
# View JSON logs with jq
cat test-spring-project/.mcp-logs/micro-context-*.log | jq '.'

# Count total tool calls
cat test-spring-project/.mcp-logs/*.log | wc -l

# Find all errors
cat test-spring-project/.mcp-logs/*.log | jq -r 'select(.success == false)'

# Average execution time
cat test-spring-project/.mcp-logs/*.log | jq '.executionTimeMs' | awk '{sum+=$1; count++} END {print sum/count "ms"}'
```

---

## 🔍 Example Log Entries

### JSON Format (`.log`)

```json
{
  "timestamp": "2025-12-12T10:34:35.678Z",
  "toolName": "analyze_controller_method",
  "arguments": {
    "controller_name": "UserController",
    "method_name": "createUser"
  },
  "response": "# Controller Method Analysis: UserController.createUser...",
  "executionTimeMs": 342,
  "success": true
}
```

### Failed Call Example

```json
{
  "timestamp": "2025-12-12T10:35:12.345Z",
  "toolName": "get_dto_structure",
  "arguments": {
    "class_name": "NonExistentDTO"
  },
  "error": "Class not found: NonExistentDTO",
  "executionTimeMs": 89,
  "success": false
}
```

---

## 📊 Quick Analytics

```bash
# Tool usage statistics
cat test-spring-project/.mcp-logs/*.log | jq -r '.toolName' | sort | uniq -c

# Find slowest tool calls
cat test-spring-project/.mcp-logs/*.log | jq -r '[.toolName, .executionTimeMs] | @tsv' | sort -k2 -rn | head -10

# Success rate
TOTAL=$(cat test-spring-project/.mcp-logs/*.log | wc -l)
SUCCESS=$(cat test-spring-project/.mcp-logs/*.log | jq -r 'select(.success == true)' | wc -l)
echo "Success Rate: $(echo "scale=2; $SUCCESS * 100 / $TOTAL" | bc)%"
```

---

## 🛠️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_LOGGING` | `true` | Enable/disable logging |
| `MCP_DEBUG` | `false` | Also log to console in real-time |

### Examples

```bash
# Disable logging
MCP_LOGGING=false node packages/micro-context/dist/index.js test-spring-project

# Enable debug mode (console + file logging)
MCP_DEBUG=true node packages/micro-context/dist/index.js test-spring-project

# Both combined
MCP_LOGGING=true MCP_DEBUG=true node packages/micro-context/dist/index.js test-spring-project
```

---

## 📝 Files Created

The following files were added to enable logging:

### New Files
- `packages/micro-context/src/logger.ts` - Logging utility
- `packages/macro-context/src/logger.ts` - Same logger for macro-context
- `packages/spring-component/src/logger.ts` - Same logger for spring-component

### Modified Files
All three server `index.ts` files were updated to:
1. Import the logger
2. Initialize it with server name and workspace root
3. Log every tool call with timing and results

**Code changes:**
- Added `import { MCPLogger } from './logger.js';`
- Added `const logger = new MCPLogger('server-name', workspaceRoot);`
- Added logging in tool call handler (success + error cases)

---

## 🎯 Use in Your Plugin

When you add MCP servers to a plugin (like VS Code extension, CLI tool, etc.):

### 1. No Changes Needed
Logging works automatically! Just run the server normally.

### 2. Logs Location
Logs will be in: `{workspace-root}/.mcp-logs/`

### 3. Add to .gitignore
```bash
# Add to your .gitignore
echo ".mcp-logs/" >> .gitignore
```

### 4. Access Logs Programmatically
Read the JSON log files from your plugin:

```javascript
const fs = require('fs');
const logDir = `${workspaceRoot}/.mcp-logs`;
const todayLog = `${logDir}/micro-context-${new Date().toISOString().split('T')[0]}.log`;

// Read logs
const logs = fs.readFileSync(todayLog, 'utf8')
  .trim()
  .split('\n')
  .map(line => JSON.parse(line));

// Get statistics
const stats = {
  total: logs.length,
  successful: logs.filter(l => l.success).length,
  failed: logs.filter(l => !l.success).length,
  avgTime: logs.reduce((sum, l) => sum + l.executionTimeMs, 0) / logs.length
};

console.log(`MCP Stats: ${stats.successful}/${stats.total} successful (${stats.avgTime.toFixed(0)}ms avg)`);
```

---

## 📚 Documentation

For complete details, see:
- **LOGGING_GUIDE.md** - Comprehensive logging documentation
- **QUICKSTART.md** - Quick start guide
- **TEST_RESULTS_SUMMARY.md** - Test results and examples

---

## ✅ Summary

**What You Get:**
- ✅ Automatic logging of all MCP tool calls
- ✅ Two formats: JSON (parseable) + Readable (human-friendly)
- ✅ Performance metrics (execution time)
- ✅ Error tracking with full error messages
- ✅ Daily log rotation
- ✅ Zero configuration required (works out of the box)
- ✅ Configurable via environment variables
- ✅ Compatible with all MCP plugins

**Log Files:**
- Location: `{workspace}/.mcp-logs/`
- Format: JSON + Readable
- Rotation: Daily (auto)
- Size: Grows with usage (manually clean as needed)

**Quick Commands:**
```bash
# View logs
cat test-spring-project/.mcp-logs/*-readable.log

# View JSON
cat test-spring-project/.mcp-logs/*.log | jq '.'

# Tail in real-time
tail -f test-spring-project/.mcp-logs/*-readable.log

# Count calls
cat test-spring-project/.mcp-logs/*.log | wc -l
```

---

**Status:** ✅ Logging Enabled in All Servers
**Version:** 1.0.0
**Date:** 2025-12-12
