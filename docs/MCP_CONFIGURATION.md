# MCP Server Configuration Guide

Complete guide for configuring Spring Boot MCP servers with various MCP clients.

---

## 🎯 Overview

This project provides **3 MCP servers** that can be integrated with any MCP-compatible client:
- **micro-context** - Code-level analysis (5 tools)
- **macro-context** - Architecture analysis (7 tools)
- **spring-component** - Spring patterns (4 tools)

---

## 📋 Configuration Format

All MCP servers use the standard MCP configuration format:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": [
        "/absolute/path/to/server/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

**Key Points:**
- `command`: Always `node` (requires Node.js 18+)
- `args[0]`: Absolute path to compiled server (`dist/index.js`)
- `args[1]`: `${workspaceFolder}` is automatically replaced by the client with your project path
- `env`: Environment variables for configuration

---

## ⚙️ Environment Variables

### Core Configuration

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PACKAGE_INCLUDE` | Base package pattern to analyze | None | `com.yourcompany.*` |
| `PACKAGE_EXCLUDE` | Packages to exclude | None | `com.yourcompany.generated.*` |
| `DTO_PACKAGES` | Where DTOs are located | Auto-detect | `com.company.dto,com.company.model` |
| `ENTITY_PACKAGES` | Where JPA entities are | Auto-detect | `com.company.entity` |
| `MAX_DTO_DEPTH` | Max nesting for DTO analysis | `10` | `15` |
| `CALL_CHAIN_MAX_DEPTH` | Max depth for call chains | `10` | `20` |
| `STOP_AT_PACKAGES` | Packages to stop tracing at | Framework defaults | `java.*,javax.*` |

### Logging Configuration

| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `MCP_LOGGING` | Enable/disable logging | `true` | `true`, `false` |
| `MCP_DEBUG` | Enable console debug output | `false` | `true`, `false` |

**Logging Details:**
- Logs stored in: `${workspaceFolder}/.mcp-logs/`
- Two formats: JSON (`.log`) and readable (`-readable.log`)
- Logs capture: tool name, arguments, response, execution time, success/failure
- Daily rotation based on date in filename
- See [LOGGING_GUIDE.md](./LOGGING_GUIDE.md) for details

---

## 🔧 Client-Specific Configuration

### IntelliJ IDEA with Cody Plugin

**Location:** `%APPDATA%\JetBrains\<IDE_VERSION>\options\cody_settings.json` (Windows)
**Location:** `~/Library/Application Support/JetBrains/<IDE_VERSION>/options/cody_settings.json` (Mac)

**Configuration:**
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
        "PACKAGE_INCLUDE": "com.yourcompany.*",
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
        "PACKAGE_INCLUDE": "com.yourcompany.*",
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
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    }
  }
}
```

**After configuration:** Restart IntelliJ IDEA or reload Cody plugin

---

### Claude Desktop

**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac)
**Location:** `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

**Configuration:**
```json
{
  "mcpServers": {
    "spring-micro": {
      "command": "node",
      "args": [
        "/Users/yourname/path/to/CodyMcpServers/packages/micro-context/dist/index.js",
        "/Users/yourname/path/to/your-spring-project"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true"
      }
    }
  }
}
```

**Note:** Claude Desktop doesn't support `${workspaceFolder}`, so use absolute paths to your project.

**After configuration:** Restart Claude Desktop

---

### VS Code (with MCP extension)

**Location:** `.vscode/settings.json` in your project

**Configuration:**
```json
{
  "mcp.servers": {
    "spring-micro": {
      "command": "node",
      "args": [
        "${workspaceFolder}/../CodyMcpServers/packages/micro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-macro": {
      "command": "node",
      "args": [
        "${workspaceFolder}/../CodyMcpServers/packages/macro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "CALL_CHAIN_MAX_DEPTH": "15",
        "MCP_LOGGING": "true"
      }
    },
    "spring-component": {
      "command": "node",
      "args": [
        "${workspaceFolder}/../CodyMcpServers/packages/spring-component/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true"
      }
    }
  }
}
```

**After configuration:** Reload VS Code window

---

### Custom MCP Client

For custom integrations, use the MCP protocol:

```typescript
import { spawn } from 'child_process';

const server = spawn('node', [
  '/path/to/CodyMcpServers/packages/micro-context/dist/index.js',
  '/path/to/your/spring/project'
], {
  env: {
    ...process.env,
    PACKAGE_INCLUDE: 'com.yourcompany.*',
    MCP_LOGGING: 'true',
    MCP_DEBUG: 'false'
  }
});

// Communicate via JSON-RPC 2.0 over stdin/stdout
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'my-client', version: '1.0.0' }
  }
}) + '\n');

server.stdout.on('data', (data) => {
  const response = JSON.parse(data.toString());
  console.log('Server response:', response);
});
```

---

## 🚀 Quick Start Templates

### Minimal Configuration

```json
{
  "mcpServers": {
    "spring-micro": {
      "command": "node",
      "args": [
        "/path/to/micro-context/dist/index.js",
        "${workspaceFolder}"
      ]
    }
  }
}
```

This works out of the box with default settings and logging enabled.

---

### Production Configuration

```json
{
  "mcpServers": {
    "spring-micro-context": {
      "command": "node",
      "args": [
        "/path/to/micro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "PACKAGE_EXCLUDE": "com.yourcompany.generated.*,com.yourcompany.test.*",
        "DTO_PACKAGES": "com.yourcompany.dto,com.yourcompany.api.model",
        "ENTITY_PACKAGES": "com.yourcompany.entity,com.yourcompany.domain",
        "MAX_DTO_DEPTH": "15",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-macro-context": {
      "command": "node",
      "args": [
        "/path/to/macro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "PACKAGE_EXCLUDE": "com.yourcompany.generated.*",
        "CALL_CHAIN_MAX_DEPTH": "20",
        "STOP_AT_PACKAGES": "java.*,javax.*,org.springframework.*,org.hibernate.*,lombok.*",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    },
    "spring-component": {
      "command": "node",
      "args": [
        "/path/to/spring-component/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "false"
      }
    }
  }
}
```

---

### Debug Configuration

For troubleshooting, enable debug output:

```json
{
  "mcpServers": {
    "spring-micro": {
      "command": "node",
      "args": [
        "/path/to/micro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "MCP_LOGGING": "true",
        "MCP_DEBUG": "true"
      }
    }
  }
}
```

This will log all tool calls to both:
- File: `${workspaceFolder}/.mcp-logs/micro-context-YYYY-MM-DD.log`
- Console: stderr output (visible in client logs)

---

## 📝 Verifying Configuration

### 1. Test Server Startup

```bash
# Test micro-context server
node packages/micro-context/dist/index.js /path/to/your/spring/project

# Expected output:
# 🚀 Starting Spring Boot Micro Context MCP Server
# 📁 Workspace: /path/to/your/spring/project
# 📦 Package filter: com.yourcompany.*
# 📝 Logging to: /path/to/your/spring/project/.mcp-logs/micro-context-2025-12-12.log
# ✅ Spring Boot Micro Context MCP Server running
```

Press `Ctrl+C` to exit.

### 2. Check Logs

After using a tool, check the logs:

```bash
# View readable logs
cat /path/to/your/spring/project/.mcp-logs/micro-context-*-readable.log

# View JSON logs
cat /path/to/your/spring/project/.mcp-logs/micro-context-*.log | jq '.'
```

### 3. Verify Tools Available

Ask your AI assistant: "What tools do you have available?"

You should see tools like:
- `resolve_symbol`
- `get_function_definition`
- `get_dto_structure`
- `find_execution_branches`
- `find_mockable_dependencies`
- And more...

---

## 🐛 Troubleshooting

### Server Not Starting

**Problem:** Server fails to start

**Solutions:**
1. Check Node.js version: `node --version` (must be >= 18)
2. Verify path to `index.js` is absolute
3. Check Java is installed: `java --version` (must be >= 11)
4. Ensure server is built: `npm run build --prefix packages/micro-context`

### Tools Not Showing

**Problem:** AI assistant doesn't see the tools

**Solutions:**
1. Verify configuration file location is correct
2. Check paths are absolute (not relative)
3. Restart the client application
4. Check client logs for errors

### Logs Not Created

**Problem:** No `.mcp-logs/` directory created

**Solutions:**
1. Check `MCP_LOGGING` is not set to `false`
2. Verify workspace path is correct
3. Check write permissions on workspace directory
4. Look for errors in server startup output

### Slow Performance

**Problem:** Tools taking too long

**Solutions:**
1. Reduce `MAX_DTO_DEPTH` (default: 10)
2. Reduce `CALL_CHAIN_MAX_DEPTH` (default: 10)
3. Add more packages to `PACKAGE_EXCLUDE`
4. Add more packages to `STOP_AT_PACKAGES`

---

## 📚 Additional Resources

- **[README.md](../README.md)** - Main documentation
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[LOGGING_GUIDE.md](./LOGGING_GUIDE.md)** - Complete logging documentation
- **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)** - Architecture and workflow
- **[EXAMPLE_WORKFLOW.md](./EXAMPLE_WORKFLOW.md)** - Step-by-step example

---

## 🎯 Best Practices

1. **Use absolute paths** - Always use absolute paths for server location
2. **Configure package filters** - Set `PACKAGE_INCLUDE` to your base package for better performance
3. **Enable logging** - Keep `MCP_LOGGING=true` for debugging and analytics
4. **Start with defaults** - Use default values first, then optimize if needed
5. **Add to .gitignore** - Add `.mcp-logs/` to your project's `.gitignore`
6. **Monitor logs** - Check logs regularly to ensure tools are working correctly

---

## ✅ Ready-to-Use Templates

Copy and paste these templates, replacing paths with your actual locations:

### Windows (IntelliJ Cody)
```json
{
  "mcpServers": {
    "spring-micro-context": {
      "command": "node",
      "args": [
        "C:\\Users\\YourName\\Projects\\CodyMcpServers\\packages\\micro-context\\dist\\index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true"
      }
    }
  }
}
```

### Mac/Linux (IntelliJ Cody)
```json
{
  "mcpServers": {
    "spring-micro-context": {
      "command": "node",
      "args": [
        "/Users/yourname/Projects/CodyMcpServers/packages/micro-context/dist/index.js",
        "${workspaceFolder}"
      ],
      "env": {
        "PACKAGE_INCLUDE": "com.yourcompany.*",
        "MCP_LOGGING": "true"
      }
    }
  }
}
```

---

**Version:** 1.0.0
**Last Updated:** 2025-12-12
**Status:** Production Ready
