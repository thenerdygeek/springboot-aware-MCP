# Security Vulnerability Fix Guide

## 🚨 Issue: High Severity Vulnerability in @modelcontextprotocol/sdk

**Current Version:** `0.5.0`
**Recommended Version:** `1.24.3`
**Severity:** High

---

## 📊 Analysis

Your project uses `@modelcontextprotocol/sdk@^0.5.0` across all three MCP servers:
- packages/micro-context/package.json
- packages/macro-context/package.json
- packages/spring-component/package.json

The caret (`^`) in `^0.5.0` means:
- Accepts: `>= 0.5.0` and `< 1.0.0`
- **Does NOT** auto-update to `1.x` versions (major version change)

**Version Jump:** `0.5.0` → `1.24.3` is a **MAJOR version update** with breaking changes.

---

## ✅ Recommended Solution

**Option 1: Safe Update (RECOMMENDED)**

Update to the latest 1.x version and test thoroughly.

### Step 1: Update package.json files

Update all three package.json files:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.24.3",
    "zod": "^3.22.0"
  }
}
```

### Step 2: Clean install

```bash
# Windows (PowerShell or CMD)
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Or on Windows with CMD:
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Step 3: Rebuild all packages

```bash
npm run build
```

### Step 4: Test the servers

```bash
# Run the test suite
./run-tests.sh test-spring-project

# Or manually test each server
node packages/micro-context/dist/index.js test-spring-project
```

---

## 🔧 Automated Fix Script

I'll create a script to automate this update for you.

---

## ⚠️ Potential Breaking Changes

The jump from `0.5.0` to `1.24.3` may include:

### 1. **API Changes**
- Method signatures may have changed
- New required parameters
- Deprecated methods removed

### 2. **Protocol Changes**
- MCP protocol version updates
- Request/response format changes

### 3. **Type Changes**
- TypeScript type definitions may differ
- Stricter type checking

---

## 🧪 What to Test After Update

1. **Server Startup**
   ```bash
   node packages/micro-context/dist/index.js test-spring-project
   ```
   Should show:
   ```
   🚀 Starting Spring Boot Micro Context MCP Server
   ✅ Spring Boot Micro Context MCP Server running
   ```

2. **Tool Availability**
   - Verify all tools are registered
   - Check tool descriptions are correct

3. **Tool Functionality**
   - Run the full test suite
   - Test each tool manually

4. **Logging**
   - Verify logs are created in `.mcp-logs/`
   - Check log format is correct

---

## 🐛 Common Issues After Update

### Issue 1: TypeScript Compilation Errors

**Solution:** Update import statements

```typescript
// Old (0.5.0)
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

// New (1.24.3) - may need adjustment
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// OR
import { Server } from '@modelcontextprotocol/sdk/server';
```

### Issue 2: Server Initialization Changes

**Solution:** Check for new required parameters

```typescript
// Old
const server = new Server({
  name: 'spring-boot-micro-context',
  version: '1.0.0',
}, {
  capabilities: { tools: {} }
});

// New - might require additional fields
const server = new Server({
  name: 'spring-boot-micro-context',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
    // Possibly new required capabilities
  }
});
```

### Issue 3: Request Handler Changes

**Solution:** Verify schema imports

```typescript
// Check if these still work:
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
```

---

## 📋 Step-by-Step Update Process

### For Windows Users

**1. Backup your project** (important!)
```powershell
# Create a backup
xcopy /E /I CodyMcpServers CodyMcpServers_backup
```

**2. Update package.json files**

Edit these three files:
- `packages/micro-context/package.json`
- `packages/macro-context/package.json`
- `packages/spring-component/package.json`

Change:
```json
"@modelcontextprotocol/sdk": "^0.5.0"
```

To:
```json
"@modelcontextprotocol/sdk": "^1.24.3"
```

**3. Clean install (Windows CMD)**
```cmd
cd C:\path\to\CodyMcpServers
rmdir /s /q node_modules
del package-lock.json
npm install
```

**4. Rebuild**
```cmd
npm run build
```

**5. Test**
```cmd
node packages\micro-context\dist\index.js test-spring-project
```

---

## 🔒 Alternative: Selective Update (NOT RECOMMENDED)

If the breaking changes are too severe, you could:

1. **Audit the specific vulnerability**
   ```bash
   npm audit --json
   ```

2. **Check if it affects your usage**
   - If the vulnerability is in a feature you don't use
   - If it's only in dev dependencies

3. **Use overrides (package.json)**
   ```json
   {
     "overrides": {
       "@modelcontextprotocol/sdk": "0.5.0"
     }
   }
   ```

⚠️ **This is NOT recommended** as it ignores security issues.

---

## ✅ Verification Checklist

After updating, verify:

- [ ] All packages build without errors (`npm run build`)
- [ ] No TypeScript compilation errors
- [ ] Servers start successfully
- [ ] All 16 tools are available
- [ ] Test suite passes (12/12 tests)
- [ ] Logging works correctly
- [ ] No runtime errors in console

---

## 📞 If Update Fails

If you encounter issues after updating:

1. **Check the changelog**
   - Visit: https://github.com/modelcontextprotocol/sdk
   - Look for migration guides

2. **Rollback**
   ```bash
   git checkout packages/*/package.json
   npm install
   npm run build
   ```

3. **Report compatibility issues**
   - Document the specific error
   - Check if it's a known issue
   - Consider submitting a bug report

---

## 🎯 Expected Outcome

After successful update:

```bash
npm audit

# Should show:
found 0 vulnerabilities
```

---

## 📝 Summary

**Current State:**
- Using @modelcontextprotocol/sdk@0.5.0
- High severity vulnerability detected

**Recommended Action:**
1. Update to @modelcontextprotocol/sdk@^1.24.3
2. Rebuild all packages
3. Run full test suite
4. Verify functionality

**Estimated Time:** 15-30 minutes

**Risk Level:** Medium (breaking changes possible, but tests should catch issues)

---

**Status:** Ready to Update
**Last Verified:** 2025-12-12
**SDK Latest Version:** 1.24.3
