# MCP Tools - Improvement Opportunities

This document identifies potential improvements, gaps, and enhancements for the Spring Boot MCP servers.

---

## 🎯 High Priority Improvements

### 1. **Health Check / Ping Tool** ⚠️ MISSING

**Problem:** No way to verify Java Parser Service is alive and responsive

**Impact:**
- Users can't diagnose if server is healthy
- Clients can't verify connection before making requests
- No way to detect if Java service crashed

**Solution:** Add a `ping` or `health_check` tool

```typescript
{
  name: 'health_check',
  description: 'Verify MCP server and Java Parser Service are running correctly',
  inputSchema: {
    type: 'object',
    properties: {}
  }
}
```

**Implementation:**
```typescript
case 'health_check':
  const health = {
    server: 'healthy',
    javaService: await javaParserClient.ping(),
    workspace: workspaceRoot,
    uptime: process.uptime()
  };
  result = JSON.stringify(health, null, 2);
  break;
```

---

### 2. **Request Timeouts Not Configurable** ⚠️ LIMITATION

**Problem:** Hardcoded 30-second timeout may be too short for large codebases

**Current Code:**
```typescript
// Timeout after 30 seconds
setTimeout(() => {
  reject(new Error('Request timeout after 30 seconds'));
}, 30000);
```

**Impact:**
- Large projects with complex call chains may timeout
- No way to adjust for different performance needs

**Solution:** Make timeout configurable

```typescript
const REQUEST_TIMEOUT = parseInt(process.env.MCP_REQUEST_TIMEOUT || '30000', 10);

setTimeout(() => {
  reject(new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`));
}, REQUEST_TIMEOUT);
```

**Configuration:**
```json
"env": {
  "MCP_REQUEST_TIMEOUT": "60000"  // 60 seconds for large projects
}
```

---

### 3. **No Caching / Performance Optimization** ⚠️ MISSING

**Problem:** Every request re-parses files from scratch

**Impact:**
- Slow response times for repeated queries
- High CPU usage
- Poor user experience

**Example:**
- User asks about `UserService.createUser()` - parses file
- User asks about `UserService.updateUser()` - parses same file again!

**Solution 1: Simple In-Memory Cache**
```typescript
class JavaParserCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 60000; // 1 minute

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.TTL) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}
```

**Solution 2: File-based Caching**
- Cache parsed ASTs to disk
- Invalidate on file modification time change

**Configuration:**
```json
"env": {
  "MCP_CACHE_ENABLED": "true",
  "MCP_CACHE_TTL": "300000",  // 5 minutes
  "MCP_CACHE_MAX_SIZE": "100" // Max cached items
}
```

---

### 4. **No Auto-Recovery for Java Process Crashes** ⚠️ GAP

**Problem:** If Java Parser Service crashes, server is permanently broken

**Current Code:**
```typescript
this.javaProcess.on('close', (code) => {
  console.error(`Java process exited with code ${code}`);
  // All future requests will fail!
  this.isReady = false;
});
```

**Impact:**
- Server becomes unusable until manually restarted
- All pending requests fail
- Poor reliability

**Solution:** Auto-restart with backoff

```typescript
private restartAttempts = 0;
private maxRestarts = 3;

this.javaProcess.on('close', (code) => {
  console.error(`Java process exited with code ${code}`);

  if (this.restartAttempts < this.maxRestarts) {
    this.restartAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.restartAttempts), 10000);
    console.error(`Restarting Java service in ${delay}ms (attempt ${this.restartAttempts}/${this.maxRestarts})`);

    setTimeout(() => {
      this.startJavaProcess().catch(console.error);
    }, delay);
  } else {
    console.error('Max restart attempts reached. Server requires manual restart.');
  }
});
```

---

### 5. **No Configuration Validation** ⚠️ GAP

**Problem:** Invalid configuration silently uses defaults

**Example:**
```json
"env": {
  "PACKAGE_INCLUDE": "com.example.*",
  "MAX_DTO_DEPTH": "not-a-number"  // Silently becomes 10!
}
```

**Impact:**
- Users don't know their config is wrong
- Unexpected behavior
- Harder to debug

**Solution:** Validate configuration on startup

```typescript
function validateConfig(config: JavaParserConfig): void {
  const errors: string[] = [];

  if (config.maxDtoDepth < 1 || config.maxDtoDepth > 50) {
    errors.push(`MAX_DTO_DEPTH must be between 1 and 50 (got: ${config.maxDtoDepth})`);
  }

  if (config.callChainMaxDepth < 1 || config.callChainMaxDepth > 100) {
    errors.push(`CALL_CHAIN_MAX_DEPTH must be between 1 and 100 (got: ${config.callChainMaxDepth})`);
  }

  if (config.packageInclude && !isValidPackagePattern(config.packageInclude)) {
    errors.push(`PACKAGE_INCLUDE has invalid pattern: ${config.packageInclude}`);
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  }

  console.error('✅ Configuration validated successfully');
}
```

---

### 6. **No Performance Metrics / Analytics** ⚠️ MISSING

**Problem:** No aggregated performance data beyond logs

**What's Missing:**
- Average response time per tool
- Tool usage statistics
- Error rates
- Slow query detection
- Memory usage tracking

**Solution:** Add metrics collection

```typescript
class MetricsCollector {
  private toolCalls = new Map<string, { count: number; totalTime: number; errors: number }>();

  recordCall(toolName: string, executionTime: number, success: boolean): void {
    const stats = this.toolCalls.get(toolName) || { count: 0, totalTime: 0, errors: 0 };
    stats.count++;
    stats.totalTime += executionTime;
    if (!success) stats.errors++;
    this.toolCalls.set(toolName, stats);
  }

  getStats(): string {
    let report = '# Performance Metrics\n\n';
    for (const [tool, stats] of this.toolCalls) {
      const avgTime = stats.totalTime / stats.count;
      const errorRate = (stats.errors / stats.count) * 100;
      report += `## ${tool}\n`;
      report += `- Calls: ${stats.count}\n`;
      report += `- Avg Time: ${avgTime.toFixed(2)}ms\n`;
      report += `- Error Rate: ${errorRate.toFixed(1)}%\n\n`;
    }
    return report;
  }
}
```

**Add tool:**
```typescript
{
  name: 'get_performance_metrics',
  description: 'Get aggregated performance statistics for all tools'
}
```

---

### 7. **Tool Descriptions Lack Examples** ⚠️ UX ISSUE

**Problem:** Tool descriptions don't show usage examples

**Current:**
```typescript
{
  name: 'resolve_symbol',
  description: 'Resolves a symbol to its type and declaration location'
  // No examples!
}
```

**Impact:**
- Users don't know how to use tools effectively
- AI assistants may call tools incorrectly
- More trial and error needed

**Solution:** Add examples to descriptions

```typescript
{
  name: 'resolve_symbol',
  description: `Resolves a symbol (variable, field, parameter) to its type and declaration location.

**Example Usage:**
To find what 'userService' refers to in UserController.java:
{
  "symbol_name": "userService",
  "context_file": "/path/to/UserController.java",
  "line_number": 42
}

**Returns:** Type information, file path, package, and declaration details.`,
  inputSchema: { ... }
}
```

---

## 🔧 Medium Priority Improvements

### 8. **No Request Queuing / Rate Limiting**

**Problem:** All requests run in parallel, could overwhelm Java service

**Solution:** Add request queue with concurrency limit
```typescript
const MAX_CONCURRENT = parseInt(process.env.MCP_MAX_CONCURRENT || '5', 10);
```

---

### 9. **No Memory Management**

**Problem:** Could run out of memory on very large codebases

**Solution:**
- Monitor heap usage
- Implement LRU cache eviction
- Add memory limits to Java process

```bash
java -Xmx2g -jar java-parser-service.jar
```

**Configuration:**
```json
"env": {
  "JAVA_MAX_HEAP": "2g"
}
```

---

### 10. **No Incremental Parsing / File Watching**

**Problem:** No detection of file changes, always full parse

**Solution:** Watch filesystem for changes
```typescript
import chokidar from 'chokidar';

const watcher = chokidar.watch(workspaceRoot + '/src', {
  ignored: /(^|[\/\\])\../,
  persistent: true
});

watcher.on('change', (path) => {
  cache.invalidate(path);
  console.error(`📝 File changed: ${path} (cache invalidated)`);
});
```

---

### 11. **No Multi-Workspace Support**

**Problem:** Each server instance handles only one workspace

**Impact:** Can't analyze multiple microservices at once

**Solution:** Allow multiple workspace roots
```json
"args": [
  "/path/to/server/index.js",
  "${workspaceFolder}",
  "/path/to/shared-library",
  "/path/to/common-models"
]
```

---

### 12. **No Dependency Analysis**

**Problem:** Can't analyze external dependencies (Maven/Gradle)

**Missing Features:**
- Resolve types from JAR files
- Analyze Spring Boot autoconfiguration
- Trace to framework code

**Solution:** Parse `pom.xml` or `build.gradle` and load dependencies

---

### 13. **No Progress Reporting for Long Operations**

**Problem:** No feedback during long-running operations

**Solution:** Add progress callbacks
```typescript
{
  name: 'build_method_call_chain',
  description: 'Build method call chain (may take 10-30s for deep chains)',
  supportsProgress: true  // New MCP feature
}
```

---

## 🌟 Nice-to-Have Improvements

### 14. **Spring Boot Version Detection**

**Feature:** Detect Spring Boot version and provide version-specific analysis

```typescript
{
  name: 'get_project_info',
  description: 'Get Spring Boot project information',
  returns: {
    springBootVersion: '3.4.1',
    javaVersion: '21',
    dependencies: [...],
    profiles: ['dev', 'prod']
  }
}
```

---

### 15. **Interactive Tool Testing**

**Feature:** Built-in test mode for debugging

```bash
# Interactive mode
node packages/micro-context/dist/index.js --interactive /path/to/project

> resolve_symbol userService UserController.java
> get_dto_structure UserDTO
> exit
```

---

### 16. **Configuration Presets**

**Feature:** Pre-built configurations for common scenarios

```bash
# Load preset
MCP_CONFIG_PRESET=large-monolith node dist/index.js /path/to/project

# Presets:
# - small-microservice
# - large-monolith
# - multi-module
# - performance-optimized
```

---

### 17. **Better Error Messages with Suggestions**

**Current:**
```
Error: Symbol not found: userService
```

**Improved:**
```
Error: Symbol not found: userService

Suggestions:
- Did you mean 'userRepository'? (found in same file)
- Check if the symbol is imported from another file
- Verify the file path is correct: UserController.java:42
- Try using line_number parameter for disambiguation

Similar symbols found:
- userRepository (line 23)
- productService (line 24)
```

---

### 18. **Batch Operations Support**

**Feature:** Analyze multiple symbols/methods in one request

```typescript
{
  name: 'resolve_symbols_batch',
  description: 'Resolve multiple symbols at once',
  inputSchema: {
    symbols: [
      { symbol_name: 'userService', context_file: '...' },
      { symbol_name: 'productService', context_file: '...' }
    ]
  }
}
```

**Benefit:** Reduce overhead of multiple requests

---

### 19. **Smart Workspace Detection**

**Feature:** Auto-detect workspace root from git/Maven/Gradle

```typescript
// Instead of requiring explicit path:
node dist/index.js  // Auto-detects from current directory
```

---

### 20. **Configuration Hot Reload**

**Feature:** Change configuration without restarting

```typescript
{
  name: 'reload_config',
  description: 'Reload configuration from environment variables'
}
```

---

## 📊 Priority Matrix

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Health Check Tool | High | Low | **P0** |
| Configurable Timeouts | High | Low | **P0** |
| Configuration Validation | High | Low | **P0** |
| Caching | High | Medium | **P1** |
| Auto-Recovery | High | Medium | **P1** |
| Performance Metrics | Medium | Medium | **P2** |
| Better Tool Descriptions | Medium | Low | **P2** |
| Request Queuing | Medium | Medium | **P3** |
| Memory Management | Medium | High | **P3** |
| File Watching | Low | Medium | **P4** |
| Multi-Workspace | Low | High | **P4** |

---

## 🚀 Quick Wins (Can Implement Now)

These can be added without major refactoring:

1. **Health Check Tool** - 30 minutes
2. **Configurable Timeout** - 15 minutes
3. **Configuration Validation** - 1 hour
4. **Better Tool Descriptions with Examples** - 2 hours
5. **Performance Metrics Tool** - 2 hours

---

## 🎯 Recommended Next Steps

### Phase 1: Reliability (Week 1)
- [ ] Add health check tool
- [ ] Make timeouts configurable
- [ ] Add configuration validation
- [ ] Improve error messages

### Phase 2: Performance (Week 2)
- [ ] Implement simple in-memory caching
- [ ] Add performance metrics tool
- [ ] Add request queuing

### Phase 3: Resilience (Week 3)
- [ ] Add auto-recovery for Java process
- [ ] Add memory management
- [ ] Add file watching

### Phase 4: UX (Week 4)
- [ ] Add better tool descriptions
- [ ] Add interactive testing mode
- [ ] Add configuration presets

---

## 📝 Summary

**Current State:**
- ✅ Core functionality works well
- ✅ Good error handling
- ✅ Logging implemented
- ✅ Graceful shutdown

**Main Gaps:**
1. No health check mechanism
2. No caching (performance issue)
3. No auto-recovery (reliability issue)
4. Hardcoded timeouts
5. No configuration validation

**Biggest Impact Improvements:**
1. **Caching** - 10-100x faster for repeated queries
2. **Health Check** - Better diagnostics and monitoring
3. **Auto-Recovery** - Much better reliability
4. **Configurable Timeouts** - Support larger projects
5. **Configuration Validation** - Better user experience

---

**Status:** Analysis Complete
**Version:** 1.0.0
**Date:** 2025-12-12
