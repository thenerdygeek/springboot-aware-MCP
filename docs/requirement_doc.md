# Spring Boot Agentic AI MCP Servers - Complete Implementation Specification

**Version:** 1.0  
**Date:** December 2024  
**Target Implementation:** Claude Code (Agentic AI)  
**Target Integration:** Cody Plugin for IntelliJ IDEA with MCP Server Support  
**Author:** Implementation Specification Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Goals](#2-problem-statement--goals)
3. [Technical Requirements](#3-technical-requirements)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack & Rationale](#5-technology-stack--rationale)
6. [Tool Specifications](#6-tool-specifications)
7. [Implementation Guide](#7-implementation-guide)
8. [Environment Setup](#8-environment-setup)
9. [Configuration & Customization](#9-configuration--customization)
10. [Error Handling Standards](#10-error-handling-standards)
11. [IntelliJ Cody Integration](#11-intellij-cody-integration)
12. [Packaging & Distribution](#12-packaging--distribution)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Appendix: References](#14-appendix-references)

---

## 1. Executive Summary

### 1.1 Purpose
This document specifies the complete implementation requirements for three Model Context Protocol (MCP) servers designed to provide deep contextual understanding of Spring Boot Java projects to the **Cody plugin for IntelliJ IDEA**, which supports MCP servers. The underlying AI model is Claude from Anthropic.

### 1.2 Target Platform
**Cody for IntelliJ IDEA** with MCP server support enables AI-powered coding assistance with access to external context through MCP protocol. This implementation creates specialized MCP servers that give Cody deep understanding of Spring Boot architecture and code flow.

### 1.3 Problem Being Solved
Current AI coding assistants (including Cody in IntelliJ) lack deep understanding of:
- Spring Boot application flow (Filters → Interceptors → Controllers → Services → Repositories)
- Nested method call chains and data transformations
- Custom DTO structures and relationships
- Feature flag conditional logic
- Impact analysis for code changes

This results in:
- ❌ Inaccurate test generation (assumes DTO structures)
- ❌ Wrong bug fix suggestions (doesn't understand actual flow)
- ❌ Missing context for implementation tasks

### 1.4 Solution Overview
Build **3 specialized MCP servers** with **16 fine-grained tools** that provide:
- ✅ **Micro Context**: Deep analysis of selected code for test generation
- ✅ **Macro Context**: Architecture-wide flow and impact analysis
- ✅ **Spring Component Context**: Spring-specific patterns and configurations

### 1.5 Expected Outcome
After implementation, when a developer using **Cody in IntelliJ IDEA** asks:
- *"Generate tests for this method"* → Cody gets complete DTO structures, nested methods, execution branches
- *"Fix bug in POST /api/users"* → Cody understands complete request flow from Filter to Database
- *"Add column to fetch-inbound-request"* → Cody knows where data is actually saved (Advice Adapter, not Service)

### 1.6 Key Metrics
- **16 tools** across 3 MCP servers
- **5 tools** for micro (code-level) context
- **7 tools** for macro (architecture-level) context
- **4 tools** for Spring-specific patterns
- **Markdown-formatted output** for optimal Claude comprehension
- **IntelliJ IDEA compatible** through Cody plugin's MCP support

---

## 2. Problem Statement & Goals

### 2.1 Detailed Problem Statement

#### Current State Issues with Cody in IntelliJ

**Issue 1: Test Generation Failures**
```
Developer: Selects method in IntelliJ → "Generate test for UserController.createUser()"

Current Cody Behavior:
- Assumes UserRequest has fields: name, email
- Generates test with mock data that doesn't compile
- Missing: UserRequest actually has nested AddressDTO with 5 fields

Root Cause: No access to complete DTO structure
```

**Issue 2: Bug Fixing Misunderstandings**
```
Developer: "Fix authentication bug in POST /api/users"

Current Cody Behavior:
- Suggests adding @PreAuthorize to controller
- Doesn't realize AuthenticationFilter (Order: 1) blocks request before controller

Root Cause: No understanding of request execution flow
```

**Issue 3: Implementation Assumptions**
```
Developer: "Add ability to fetch by another column in fetch-inbound-request API"

Current Cody Behavior:
- Assumes data is saved in UserService.save()
- Generates code to modify service layer
- Actually: Data is saved in RequestBodyAdviceAdapter.afterBodyRead()

Root Cause: No knowledge of where data actually flows
```

### 2.2 Goals

#### Primary Goals
1. **Enable accurate test generation** with 100% Jacoco coverage
2. **Provide complete request flow understanding** from HTTP to Database
3. **Enable impact analysis** for code changes
4. **Understand data transformations** across layers
5. **Support feature flag analysis** for conditional logic
6. **Seamless integration with IntelliJ IDEA** through Cody's MCP support

#### Secondary Goals
7. Make Cody **context-aware** without manual file uploads
8. Reduce **developer frustration** from wrong AI suggestions
9. Enable **autonomous bug fixing** and implementation within IntelliJ environment

### 2.3 Success Criteria
- ✅ Cody generates compilable tests on first try in IntelliJ
- ✅ Cody identifies correct files to modify for bugs/features
- ✅ Cody understands Spring Boot request lifecycle
- ✅ Cody traces data from Request DTO → Entity → Response DTO
- ✅ Developer doesn't need to manually explain context
- ✅ Works seamlessly within IntelliJ IDEA workspace

---

## 3. Technical Requirements

### 3.1 Functional Requirements

#### FR-1: Code Analysis
- **FR-1.1**: Parse Java source files to extract AST (Abstract Syntax Tree)
- **FR-1.2**: Resolve symbols (variables, fields, methods) to their declarations
- **FR-1.3**: Build method call chains up to configurable depth
- **FR-1.4**: Extract DTO structures recursively with circular reference detection
- **FR-1.5**: Identify execution branches (if/else, try/catch, switch, loops)

#### FR-2: Spring Boot Awareness
- **FR-2.1**: Detect and order Servlet Filters by @Order annotation
- **FR-2.2**: Identify HandlerInterceptors and their lifecycle methods
- **FR-2.3**: Find RequestBodyAdvice and ResponseBodyAdvice implementations
- **FR-2.4**: Map @RequestMapping/@GetMapping/@PostMapping to controller methods
- **FR-2.5**: Parse @RequestBody, @RequestParam, @PathVariable, @RequestHeader
- **FR-2.6**: Map JPA @Entity to database tables with column mappings

#### FR-3: Data Flow Tracing
- **FR-3.1**: Trace data transformation: DTO → Entity → DTO
- **FR-3.2**: Identify mappers/transformers between types
- **FR-3.3**: Track field additions/removals in transformation
- **FR-3.4**: Build complete endpoint-to-database flow

#### FR-4: Impact Analysis
- **FR-4.1**: Find all usages of method/class/field
- **FR-4.2**: Identify files that will break if signature changes
- **FR-4.3**: Find all implementations of interface/abstract class
- **FR-4.4**: Detect feature flag conditional logic

#### FR-5: Dependency Analysis
- **FR-5.1**: Identify @Autowired fields
- **FR-5.2**: Identify constructor injection
- **FR-5.3**: Determine mock strategy (mock vs spy vs real)
- **FR-5.4**: Generate test setup code

#### FR-6: IntelliJ Integration
- **FR-6.1**: Work with IntelliJ workspace structure
- **FR-6.2**: Support IntelliJ's ${workspaceFolder} variable
- **FR-6.3**: Compatible with Cody plugin's MCP server configuration
- **FR-6.4**: Handle IntelliJ's multi-module Maven/Gradle projects

### 3.2 Non-Functional Requirements

#### NFR-1: Performance
- **NFR-1.1**: Response time should be reasonable for agentic AI workflow
- **NFR-1.2**: Handle projects with 1000+ Java files
- **NFR-1.3**: Implementer decides on caching strategy

#### NFR-2: Accuracy
- **NFR-2.1**: 100% accurate symbol resolution
- **NFR-2.2**: No false positives in call chain tracing
- **NFR-2.3**: Correct handling of Java generics

#### NFR-3: Usability
- **NFR-3.1**: Output must be markdown-formatted for Claude comprehension
- **NFR-3.2**: File paths must be absolute and IntelliJ-compatible
- **NFR-3.3**: Errors must be actionable with suggestions

#### NFR-4: Maintainability
- **NFR-4.1**: Modular tool implementation
- **NFR-4.2**: Configurable via environment variables
- **NFR-4.3**: Easy to extend with new tools

#### NFR-5: Compatibility
- **NFR-5.1**: Support Java 8, 11, 17, 21
- **NFR-5.2**: Support Spring Boot 2.x and 3.x
- **NFR-5.3**: Work with Maven and Gradle projects
- **NFR-5.4**: Compatible with IntelliJ IDEA Ultimate and Community Edition

### 3.3 Constraints

#### Technical Constraints
- Must use MCP (Model Context Protocol) SDK
- Must run on Node.js (for MCP server)
- Must use JavaParser library for Java code analysis
- Cannot access network (except configured allow-list)
- Stateless operation (no memory between calls)
- Must be compatible with Cody plugin for IntelliJ IDEA

#### Project Constraints
- Each Spring Boot project has different package structures
- DTOs may be in different packages per project
- Feature flag patterns vary across projects
- Some projects use Lombok (must handle generated code)
- IntelliJ may have multiple projects open simultaneously

---

## 4. System Architecture

### 4.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              IntelliJ IDEA Ultimate/Community                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Cody Plugin with MCP Support              │    │
│  │              (Claude as LLM)                        │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │ MCP Protocol                            │
│                   │ (JSON-RPC over stdio)                   │
└───────────────────┼─────────────────────────────────────────┘
                    │
        ┌───────────┴────────────┬────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐       ┌─────────────────┐      ┌──────────────────┐
│ Server 1:     │       │ Server 2:       │      │ Server 3:        │
│ Micro Context │       │ Macro Context   │      │ Spring Component │
│ (5 tools)     │       │ (7 tools)       │      │ (4 tools)        │
└───────┬───────┘       └────────┬────────┘      └────────┬─────────┘
        │                        │                         │
        └────────────────────────┴─────────────────────────┘
                                 │
                                 │ Child Process
                                 ▼
                    ┌────────────────────────┐
                    │   JavaParser Service   │
                    │   (Java Process)       │
                    └────────┬───────────────┘
                             │
                             ▼
                    ┌────────────────────────┐
                    │   Spring Boot Project  │
                    │   in IntelliJ Workspace│
                    └────────────────────────┘
```

### 4.2 Component Architecture

#### 4.2.1 Cody Plugin (IntelliJ IDEA)
**Responsibilities:**
- Provide AI coding assistance within IntelliJ
- Manage MCP server lifecycle
- Send user queries to Claude with MCP tool access
- Display results in IntelliJ interface

**Integration Point:**
- Reads MCP server configuration from IntelliJ settings
- Passes IntelliJ workspace root as ${workspaceFolder}
- Manages stdio communication with MCP servers

#### 4.2.2 MCP Server (Node.js)
**Responsibilities:**
- Accept tool calls from Cody via MCP protocol
- Validate input parameters
- Invoke JavaParser service
- Format output as markdown
- Handle errors with suggestions

**Technology:**
- Node.js + TypeScript
- @modelcontextprotocol/sdk

#### 4.2.3 JavaParser Service (Java)
**Responsibilities:**
- Parse Java source files to AST
- Resolve symbols and types
- Extract annotations
- Build call graphs
- Detect patterns

**Technology:**
- Java 11+
- JavaParser library (com.github.javaparser:javaparser-core)
- Jackson for JSON serialization

**Communication:**
- Node.js spawns Java process via child_process.spawn()
- JSON messages over stdin/stdout
- Request-response pattern

#### 4.2.4 Data Flow

```
1. Developer interacts with Cody in IntelliJ
   ↓
2. Cody (with Claude) decides to call MCP tool
   ↓
3. MCP protocol call sent to Node.js server
   ↓
4. Node.js validates parameters
   ↓
5. Sends JSON request to JavaParser service
   ↓
6. JavaParser parses Java files from IntelliJ workspace
   ↓
7. Returns JSON result
   ↓
8. Node.js formats as markdown
   ↓
9. Returns to Cody in IntelliJ
   ↓
10. Cody displays result to developer
```

### 4.3 Directory Structure

```
spring-boot-mcp-servers/
├── packages/
│   ├── micro-context/           # Server 1
│   │   ├── src/
│   │   │   ├── index.ts        # MCP server entry
│   │   │   ├── tools/          # Tool implementations
│   │   │   │   ├── resolve-symbol.ts
│   │   │   │   ├── get-function-definition.ts
│   │   │   │   ├── get-dto-structure.ts
│   │   │   │   ├── find-execution-branches.ts
│   │   │   │   └── find-mockable-dependencies.ts
│   │   │   └── java-parser-client.ts  # Java service client
│   │   └── package.json
│   │
│   ├── macro-context/           # Server 2
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tools/          # 7 tool implementations
│   │   │   └── java-parser-client.ts
│   │   └── package.json
│   │
│   ├── spring-component/        # Server 3
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── tools/          # 4 tool implementations
│   │   │   └── java-parser-client.ts
│   │   └── package.json
│   │
│   └── java-parser-service/    # Java service
│       ├── src/main/java/com/mcp/javaparser/
│       │   ├── Main.java       # Entry point
│       │   ├── Parser.java     # Core parser logic
│       │   ├── SymbolResolver.java
│       │   ├── CallGraphBuilder.java
│       │   ├── DtoAnalyzer.java
│       │   ├── SpringAnalyzer.java
│       │   └── models/         # JSON models
│       ├── pom.xml
│       └── build.sh
│
├── docs/
│   └── IMPLEMENTATION.md        # This document
├── examples/
│   └── sample-spring-project/   # Test project
└── README.md
```

### 4.4 Communication Protocol

#### 4.4.1 Node.js → Java Service Request Format
```json
{
  "operation": "resolve_symbol",
  "workspaceRoot": "/path/to/intellij/workspace/project",
  "params": {
    "symbolName": "userService",
    "contextFile": "/path/to/UserController.java",
    "lineNumber": 45
  },
  "config": {
    "packageInclude": "com.company.*",
    "packageExclude": "com.company.generated.*"
  }
}
```

#### 4.4.2 Java Service → Node.js Response Format
```json
{
  "success": true,
  "data": {
    "symbolName": "userService",
    "resolvedType": "com.company.service.UserService",
    "declarationType": "field",
    "filePath": "/path/to/UserService.java",
    "isCustomClass": true,
    "package": "com.company.service",
    "declarationLocation": {
      "file": "/path/to/UserController.java",
      "line": 45
    }
  },
  "error": null
}
```

#### 4.4.3 Error Response Format
```json
{
  "success": false,
  "data": null,
  "error": {
    "message": "Symbol 'userServce' not found",
    "code": "SYMBOL_NOT_FOUND",
    "suggestions": [
      "Did you mean 'userService'?",
      "Check spelling",
      "Verify context file path"
    ],
    "context": {
      "searchedIn": "/path/to/UserController.java",
      "symbolName": "userServce"
    }
  }
}
```

---

## 5. Technology Stack & Rationale

### 5.1 MCP Server Layer

#### Node.js + TypeScript
**Why:**
- ✅ MCP SDK officially supports Node.js
- ✅ TypeScript provides type safety
- ✅ Easy JSON handling and async operations
- ✅ Large ecosystem for tooling
- ✅ Compatible with Cody's MCP implementation

**Version Requirements:**
- Node.js: >= 18.0.0
- TypeScript: >= 5.0.0

**Key Dependencies:**
```json
{
  "@modelcontextprotocol/sdk": "^0.5.0",
  "typescript": "^5.0.0",
  "zod": "^3.22.0"
}
```

### 5.2 Java Parsing Layer

#### JavaParser Library
**Why JavaParser (vs alternatives):**

| Feature | JavaParser | Tree-sitter | Eclipse JDT |
|---------|-----------|-------------|-------------|
| Semantic Analysis | ✅ Full | ❌ Syntax only | ✅ Full |
| Symbol Resolution | ✅ Yes | ❌ No | ✅ Yes |
| Type Resolution | ✅ Yes | ❌ No | ✅ Yes |
| Standalone | ✅ Yes | ✅ Yes | ❌ Needs Eclipse |
| Learning Curve | ✅ Easy | ✅ Easy | ❌ Complex |
| Performance | ✅ Good | ✅ Excellent | ✅ Good |

**Decision: JavaParser**
- ✅ Semantic awareness (critical for our needs)
- ✅ Symbol and type resolution
- ✅ Lightweight and standalone
- ✅ Well-documented API
- ✅ Active maintenance
- ✅ Works independently of IntelliJ's internal APIs

**Version:**
```xml
<dependency>
    <groupId>com.github.javaparser</groupId>
    <artifactId>javaparser-symbol-solver-core</artifactId>
    <version>3.25.8</version>
</dependency>
```

### 5.3 Architecture Pattern

#### Child Process Communication
**Why not:**
- ❌ JNI (Java Native Interface) - Complex, platform-dependent
- ❌ GraalVM Native - Loses dynamic capabilities
- ❌ HTTP Server - Unnecessary overhead
- ❌ IntelliJ SDK APIs - Would tie us to IntelliJ internals, lose portability

**Why Child Process:**
- ✅ Simple inter-process communication
- ✅ Automatic process lifecycle management
- ✅ JSON over stdin/stdout is straightforward
- ✅ Crash isolation (Java crash doesn't kill Node)
- ✅ Independent of IntelliJ's JVM
- ✅ Works across IntelliJ versions

### 5.4 Output Format

#### Markdown (vs alternatives)

**Why not:**
- ❌ JSON - Verbose, hard for LLM to parse naturally
- ❌ XML - Even more verbose
- ❌ Plain text - No structure

**Why Markdown:**
- ✅ Used by official Anthropic MCP servers (filesystem, github, postgres)
- ✅ Claude reads markdown naturally (trained on it)
- ✅ Provides structure (headers, tables, lists, code blocks)
- ✅ Human-readable for debugging in IntelliJ
- ✅ Token-efficient vs JSON
- ✅ Renders nicely in Cody's UI within IntelliJ

**Research Evidence:**
All official Anthropic MCP servers return markdown:
- Filesystem MCP: Returns file contents as text
- GitHub MCP: Returns PR info as markdown
- Postgres MCP: Returns query results as markdown tables

---

## 6. Tool Specifications

### 6.1 Tool Specification Format

Each tool specification includes:
- **Purpose**: What problem it solves
- **Input Schema**: MCP tool input parameters
- **Output Format**: Markdown template
- **Error Format**: Markdown error template
- **Implementation Notes**: Key algorithms/logic

**Note:** Pseudocode has been omitted. The implementation notes and examples provide sufficient context for Claude Code to understand how to implement each tool using JavaParser APIs, symbol resolution, AST traversal, and pattern matching.

---

## 6.2 Server 1: Micro Context Server (5 Tools)

### Tool 1.1: `resolve_symbol`

#### Purpose
Resolves what a symbol (variable, field, parameter) refers to in code context. Critical for understanding what `userService` or `requestDTO` actually is when developer has code selected in IntelliJ.

#### Input Schema
```typescript
{
  name: "resolve_symbol",
  description: "Resolves a symbol to its type and declaration location",
  inputSchema: {
    type: "object",
    properties: {
      symbol_name: {
        type: "string",
        description: "Symbol to resolve (e.g., 'userService')"
      },
      context_file: {
        type: "string",
        description: "File path where symbol appears"
      },
      line_number: {
        type: "number",
        description: "Optional: Line for disambiguation"
      }
    },
    required: ["symbol_name", "context_file"]
  }
}
```

#### Output Format (Markdown)
```markdown
# Symbol Resolution: {symbol_name}

## Resolved Type
`{fully.qualified.Type}`

## Declaration
- **Type:** {Field | Parameter | Local Variable | Import}
- **Location:** {file_name}, line {number}
- **Package:** {package.name}
- **Custom Class:** {Yes | No}

## File Path
`{/absolute/path/to/file.java}`

## Context
```java
{3 lines of surrounding code}
```

---
Symbol successfully resolved to {custom | framework} class.
```

#### Error Format
```markdown
# Error: Symbol Resolution

**Problem:** Symbol "{symbol_name}" not found in {file}

**Possible Causes:**
- Typo in symbol name
- Symbol not declared in given context
- Symbol declared in parent class

**Suggestions:**
- Check spelling
- Use `find_all_usages` to search for similar names
- Verify context file path

**Context:** Searched in {file_path}
```

#### Implementation Notes
- **Use JavaParser's SymbolSolver** for accurate type resolution
- **Handle ambiguity** with line_number for local variables with same name
- **Check scope hierarchy**: Local → Parameter → Field → Import
- **Resolve generics**: If `List<UserDTO>`, extract `UserDTO`
- **Custom class detection**: Match against PACKAGE_INCLUDE env var
- **Return absolute file paths** compatible with IntelliJ's file system

---

### Tool 1.2: `get_function_definition`

#### Purpose
Returns complete definition of a function/method including signature, annotations, parameters, and body. Essential for understanding what a called method actually does when developer is debugging in IntelliJ.

#### Input Schema
```typescript
{
  name: "get_function_definition",
  description: "Returns complete method definition with body",
  inputSchema: {
    type: "object",
    properties: {
      function_name: { type: "string" },
      class_name: { type: "string" },
      file_path: { type: "string", description: "Optional hint" },
      include_body: { type: "boolean", default: true }
    },
    required: ["function_name", "class_name"]
  }
}
```

#### Output Format
```markdown
# Method Definition: {class_name}.{function_name}

## Signature
```java
{visibility} {static?} {return_type} {function_name}({parameters}) throws {exceptions}
```

## Details
- **Visibility:** {public | private | protected | package}
- **Static:** {Yes | No}
- **Return Type:** `{ReturnType}`
- **Throws:** {Exception1, Exception2}
- **Annotations:** {@Transactional, @Async, ...}

## Parameters
| Name | Type | Annotations |
|------|------|-------------|
| {param1} | `{Type1}` | {@Valid} |
| {param2} | `{Type2}` | {@NotNull} |

## Method Body
```java
{full method body}
```

## Location
- **File:** `{/path/to/file.java}`
- **Lines:** {start}-{end}

## Javadoc
{javadoc if present}

---
Method definition retrieved successfully.
```

#### Error Format
```markdown
# Error: Method Definition

**Problem:** Method "{function_name}" not found in class {class_name}

**Possible Causes:**
- Method name typo
- Method in parent/child class
- Overloaded method (multiple signatures)

**Suggestions:**
- Check method spelling
- Specify parameter types if overloaded
- Use `find_all_usages` to locate method

**Context:** Searched in {class_name}
```

#### Implementation Notes
- **Handle overloaded methods** → return all signatures
- **Include inherited methods** with source indicator
- **Parse annotations** on method and parameters
- **Extract Javadoc** if present using JavaParser API
- **Format code blocks** with proper Java syntax highlighting

---

### Tool 1.3: `get_dto_structure`

#### Purpose
Recursively extracts complete DTO structure including all nested objects, validation annotations, and Lombok annotations. Critical for accurate test data generation in IntelliJ.

#### Input Schema
```typescript
{
  name: "get_dto_structure",
  description: "Recursively extracts DTO structure with nested objects",
  inputSchema: {
    type: "object",
    properties: {
      class_name: { type: "string" },
      max_depth: { type: "number", default: 10 },
      include_annotations: { type: "boolean", default: true },
      include_inheritance: { type: "boolean", default: true }
    },
    required: ["class_name"]
  }
}
```

#### Output Format
```markdown
# DTO Structure: {ClassName}

## Class Information
- **Package:** {package.name}
- **File:** `{/path/to/file.java}`
- **Annotations:** {@Data, @Builder, ...}
- **Parent Class:** {ParentClass if any}
- **Interfaces:** {interfaces}

## Fields

### {field_name} ({Type})
- **Type:** {full_type}
- **Collection:** {Yes (List/Set/Map) | No}
- **Custom Class:** {Yes | No}
- **Required:** {Yes | No}
- **Validation:** {@NotNull, @Size(min=3, max=50)}
- **Line:** {line_number}

{If custom class, nested structure:}

#### {NestedClassName} Structure
**File:** `{/path/to/nested.java}`

**Fields:**
- `{field1}` ({Type}) - Required, Line {num}
- `{field2}` ({Type}) - Optional, Line {num}

## Summary
- **Total Fields:** {count}
- **Nested DTOs:** {count} ({DTO1, DTO2})
- **Max Depth Reached:** {depth}
- **Circular References:** {Yes | No}

## File References
- `{/path/to/main.java}`
- `{/path/to/nested1.java}`

---
Structure extracted with {depth} levels of nesting.
```

#### Error Format
```markdown
# Error: DTO Structure

**Problem:** Class "{class_name}" not found or not a DTO

**Possible Causes:**
- Class name typo
- Class not in configured DTO packages
- Class is not a DTO (has business logic)

**Suggestions:**
- Verify class name spelling
- Check if class is in: {configured_dto_packages}
- Use `resolve_symbol` to find correct class name

**Context:** Searched in packages: {search_packages}
```

#### Implementation Notes
- **Circular reference detection**: Track visited classes in recursion path
- **Parse validation annotations**: @NotNull, @Size, @Min, @Max, @Pattern, @Email
- **Extract Lombok annotations**: @Data, @Getter, @Setter, @Builder
- **Handle generics**: List<T>, Map<K,V>, Set<T>
- **Stop at max_depth** or circular reference
- **Distinguish DTO vs Entity** vs regular class by package (use DTO_PACKAGES env var)
- **Use JavaParser's type resolution** to extract nested class structures

---

### Tool 1.4: `find_execution_branches`

#### Purpose
Analyzes all execution paths in a method to identify branch coverage requirements for 100% Jacoco test coverage. Useful when developer wants to generate comprehensive tests in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_execution_branches",
  description: "Analyzes execution branches for test coverage",
  inputSchema: {
    type: "object",
    properties: {
      method_code: { type: "string", description: "Full method source" },
      class_name: { type: "string", description: "Optional context" },
      method_name: { type: "string", description: "Optional for reporting" }
    },
    required: ["method_code"]
  }
}
```

#### Output Format
```markdown
# Execution Branch Analysis: {method_name}

## Method Complexity
- **Total Branches:** {count}
- **Cyclomatic Complexity:** {number}
- **Max Nesting Depth:** {depth}

## Branch Details

### Branch {N} (Line {line}): {Description}
```java
{code snippet}
```
- **Type:** {if-else | switch | try-catch | ternary}
- **Paths:** {count} ({path1, path2})
- **Nesting:** Level {depth}

## Test Coverage Recommendations

### Test {N}: {Description}
```
{test_method_name}()
```
**Covers:** Branch {N} ({which path})
**Scenario:** {description}

## Summary
- **Minimum Tests for 100% Coverage:** {count}
- **Branch Coverage:** {total_paths} paths
- **Complexity:** {Low | Moderate | High}

---
{count} test cases recommended.
```

#### Error Format
```markdown
# Error: Execution Branch Analysis

**Problem:** Unable to parse method code

**Possible Causes:**
- Incomplete code snippet
- Syntax errors in code
- Unsupported Java version features

**Suggestions:**
- Ensure code snippet is complete method
- Check for syntax errors
- Verify code compiles

**Context:** Failed to parse at line {line}
```

#### Implementation Notes
- **Calculate cyclomatic complexity**: Count decision points (if, switch, catch, loops, ternary) + 1
- **Traverse AST** recursively using JavaParser's visitor pattern to find branches
- **Track nesting depth** for complexity assessment
- **Generate test names** following convention: `{method}_{when}_{then}`
- **Consider all paths**: happy path, edge cases, error paths, early returns
- **Detect**: if-else, switch-case, try-catch-finally, ternary operators, for/while loops

---

### Tool 1.5: `find_mockable_dependencies`

#### Purpose
Identifies all dependencies (fields, constructor parameters) that should be mocked in unit tests. Generates ready-to-use mock setup code for developer in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_mockable_dependencies",
  description: "Finds dependencies to mock in unit tests",
  inputSchema: {
    type: "object",
    properties: {
      class_name: { type: "string" },
      file_path: { type: "string", description: "Optional hint" },
      include_method_params: { type: "boolean", default: false }
    },
    required: ["class_name"]
  }
}
```

#### Output Format
```markdown
# Mockable Dependencies: {ClassName}

## Class Under Test
- **Name:** {ClassName}
- **File:** `{file_path}`
- **Type:** {Controller | Service | Repository}

## @Autowired Dependencies

### {dependency_name} ({DependencyType})
- **File:** `{file_path}`
- **Type:** {Service | Repository | External}
- **Custom Class:** {Yes | No}
- **Mock Strategy:** {Mock | Spy | Real}
- **Reason:** {why}

## Constructor Injection

### {parameter_name} ({ParameterType})
- **File:** `{file_path}`
- **Mock Strategy:** {Mock | Spy | Real}

## Test Setup Code

### Mockito Annotations
```java
@Mock
private {DependencyType} {dependencyName};

@InjectMocks
private {ClassName} {classNameCamelCase};
```

### Setup Method
```java
@BeforeEach
void setUp() {
    MockitoAnnotations.openMocks(this);
}
```

## Summary
- **Total Dependencies:** {count}
- **To Mock:** {count}

## File References
- Main: `{file}`
- Dependencies: `{file1}`, `{file2}`

---
Found {count} dependencies.
```

#### Error Format
```markdown
# Error: Dependency Analysis

**Problem:** Class "{class_name}" not found

**Possible Causes:**
- Class name typo
- File not in workspace
- Class not yet created

**Suggestions:**
- Verify class name
- Check workspace path
- Create class first

**Context:** Searched in {workspace_path}
```

#### Implementation Notes
- **Detect @Autowired fields** using JavaParser annotation checks
- **Detect constructor injection** (no annotation needed in modern Spring)
- **Distinguish custom classes vs framework** using package patterns
- **Mock strategy heuristics**:
  - Mock: Custom Services, Repositories, External APIs
  - Spy: Partial mocking needed
  - Real: POJOs, DTOs, immutable objects
- **Generate Mockito + JUnit 5 code** following conventions
- **Handle both field and constructor injection** in same class

---

## 6.3 Server 2: Macro Context Server (7 Tools)

### Tool 2.1: `build_method_call_chain`

#### Purpose
Builds complete call chain from a method to all nested method calls, stopping at framework boundaries. Essential for understanding "what does this method actually do internally" when developer is investigating code in IntelliJ.

#### Input Schema
```typescript
{
  name: "build_method_call_chain",
  description: "Builds complete call chain to framework boundaries",
  inputSchema: {
    type: "object",
    properties: {
      method_name: { type: "string" },
      class_name: { type: "string" },
      max_depth: { type: "number", default: 15 },
      stop_at_packages: {
        type: "array",
        items: { type: "string" },
        description: "Package patterns to stop at"
      },
      include_package_pattern: {
        type: "string",
        description: "Only include if matches (e.g., 'com.company.*')"
      }
    },
    required: ["method_name", "class_name"]
  }
}
```

#### Output Format
```markdown
# Method Call Chain: {ClassName}.{methodName}

## Entry Point
`{ClassName}.{methodName}()` at {file}:{line}

## Call Chain

### Depth {N}: {Layer Name}
**{CallerClass}.{callerMethod}() → {CalleeClass}.{calleeMethod}()**
- **File:** `{file}:{line}`
- **Call Type:** {Direct | Interface | Abstract}
- **Package:** {package}

{If framework boundary:}
- **Stopped:** Framework boundary ({framework})

## Leaf Methods
- `{Class}.{method}()` at {file}:{line}

## Framework Boundaries
- **{FrameworkClass}.{method}**
  - Package: {package}
  - Depth: {depth}

## Call Graph Visualization
```
{ClassName}.{methodName}
├── {ServiceClass}.{method1}
│   ├── {MapperClass}.{method2}
│   └── {RepoClass}.{method3}
│       └── [JpaRepository.save] ← Framework
└── {ValidationClass}.{method4}
```

## Summary
- **Total Calls:** {count}
- **Max Depth:** {depth}
- **Framework Boundaries:** {count}
- **Leaf Methods:** {count}

## File References
{list}

---
Complete call chain traced.
```

#### Error Format
```markdown
# Error: Call Chain Analysis

**Problem:** Method "{method_name}" not found in {class_name}

**Possible Causes:**
- Method name typo
- Method is private and not visible
- Method in parent/child class

**Suggestions:**
- Verify method name
- Check visibility (public/protected/private)
- Use `find_all_usages` to locate method

**Context:** Entry point: {class_name}.{method_name}
```

#### Implementation Notes
- **Use JavaParser's SymbolSolver** to resolve method calls accurately
- **Track recursion** with visited set to detect circular calls
- **Stop conditions**: framework packages (STOP_AT_PACKAGES env var), max depth, or leaf method
- **Handle call types**: direct calls, interface calls (resolve to implementation if possible), abstract methods
- **Resolve implementations** for interface/abstract calls when concrete type is known
- **Build ASCII tree** visualization of nested calls
- **Group by depth** for readability in IntelliJ output window

---

### Tool 2.2: `trace_data_transformation`

#### Purpose
Traces how a DTO transforms through architecture layers (Request → Service → Entity → Database → Response). Critical for understanding data flow when developer is implementing new features in IntelliJ.

#### Input Schema
```typescript
{
  name: "trace_data_transformation",
  description: "Traces DTO transformation through layers",
  inputSchema: {
    type: "object",
    properties: {
      dto_class_name: { type: "string" },
      endpoint: { type: "string", description: "Optional context" },
      direction: {
        type: "string",
        enum: ["request", "response", "both"],
        default: "both"
      }
    },
    required: ["dto_class_name"]
  }
}
```

#### Output Format
```markdown
# Data Transformation Flow: {DTOClassName}

## Starting Point
- **DTO:** {DTOClassName}
- **File:** `{file}`
- **Direction:** {Request → Response | ...}

## Transformation Steps

### Step {N}: {Layer} → {Layer}
**{FromType} → {ToType}**

**Transformer:**
- **Class:** {TransformerClass}
- **Method:** {method}
- **File:** `{file}:{line}`

**Transformation Logic:**
{Brief description}

**Fields Changed:**
- ✓ Preserved: {field1}, {field2}
- ⊕ Added: {field3} (source: {where})
- ⊖ Removed: {field4} (reason: {why})
- ⚠ Modified: {field5} (how: {description})

## Complete Flow Diagram
```
{RequestDTO}
    ↓ [Controller receives]
{RequestDTO}
    ↓ [Mapper.toEntity]
{Entity}
    ↓ [Repository.save]
{Entity} (with ID)
    ↓ [Mapper.toResponse]
{ResponseDTO}
```

## Field Tracking

### Fields Lost
| Field | Lost At | Reason |
|-------|---------|--------|
| password | Step 4 | Security |

### Fields Added
| Field | Added At | Source |
|-------|----------|--------|
| id | Step 3 | Database |

## Summary
- **Total Steps:** {count}
- **Layers:** {Controller, Service, ...}

## File References
{list}

---
Traced through {count} steps.
```

#### Error Format
```markdown
# Error: Data Transformation Trace

**Problem:** Cannot trace transformation for "{dto_class_name}"

**Possible Causes:**
- DTO not used in any endpoint
- No mapper/transformer found
- DTO is standalone (not transformed)

**Suggestions:**
- Verify DTO is used in controllers
- Check for mapper classes
- Use `find_all_usages` to see DTO usage

**Context:** Searched for transformations from {dto_class_name}
```

#### Implementation Notes
- **Find controllers using DTO** by searching for @RequestBody annotations
- **Trace through services** to find mapping logic
- **Identify mappers**: Manual mapping code, MapStruct annotations, ModelMapper, custom mapper classes
- **Track field changes** by comparing DTO structures using `get_dto_structure` results
- **Note security filtering** (password removal) and **enrichment** (timestamps, auto-generated IDs)
- **Handle bidirectional flow**: Request → Entity and Entity → Response
- **Look for common mapper patterns**: toEntity(), toDto(), toResponse(), map(), convert()

---

### Tool 2.3: `find_all_usages`

#### Purpose
Finds every usage of a method, class, or field in the codebase. Critical for impact analysis when developer wants to change signatures or implementations in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_all_usages",
  description: "Finds all usages with impact assessment",
  inputSchema: {
    type: "object",
    properties: {
      identifier: { type: "string" },
      identifier_type: {
        type: "string",
        enum: ["method", "class", "field"]
      },
      scope_class: {
        type: "string",
        description: "For method/field: containing class"
      },
      include_tests: { type: "boolean", default: true }
    },
    required: ["identifier", "identifier_type"]
  }
}
```

#### Output Format
```markdown
# Usage Analysis: {identifier}

## Identifier Info
- **Name:** {identifier}
- **Type:** {Method | Class | Field}
- **Total Usages:** {count}

## Usages

### Usage {N}: {ClassName}.{methodName}
**Location:** `{file}:{line}`

**Context:**
```java
{3 lines of code context}
```

**Usage Type:** {method_call | field_access | instantiation}

## Grouped by Module
| Module | Count |
|--------|-------|
| user-service | 15 |
| test | 5 |

## Impact Assessment
### Production Code
- **Critical Usages:** {count}
- **Will Break:**
  - `{file1}`
  - `{file2}`

### Test Code
- **Tests to Update:** {count}

### Risk Level
**{Low | Medium | High | Critical}**

## Recommendations
- Update {count} production files
- Update {count} test files
- Estimated effort: {hours}

## File References
{list}

---
Found {count} usages across {file_count} files.
```

#### Error Format
```markdown
# Error: Usage Search

**Problem:** Identifier "{identifier}" not found

**Possible Causes:**
- Identifier doesn't exist
- Typo in name
- Identifier is private/internal

**Suggestions:**
- Check spelling
- Verify identifier exists
- Try different identifier_type

**Context:** Searched for {identifier_type} "{identifier}"
```

#### Implementation Notes
- **Search all Java files** in IntelliJ workspace
- **Use JavaParser's SymbolSolver** to avoid false positives (different classes with same method name)
- **Extract code context**: 3 lines before/after usage for developer understanding
- **Separate production vs test usages** based on file path patterns (src/test vs src/main)
- **Auto-detect multi-module projects** by Maven/Gradle structure
- **Impact scoring**: Higher for usages in Controllers, Services (critical paths)
- **Parse AST** to find: method calls, field accesses, class instantiations, type references

---

### Tool 2.4: `trace_endpoint_to_repository`

#### Purpose
Traces complete flow from HTTP endpoint through all layers (Filters, Interceptors, Advice, Controller, Service, Repository) to database operations. Essential when developer is debugging request flow in IntelliJ.

#### Input Schema
```typescript
{
  name: "trace_endpoint_to_repository",
  description: "Traces complete endpoint flow to database",
  inputSchema: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        description: "API endpoint (e.g., '/api/users')"
      },
      http_method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"]
      }
    },
    required: ["endpoint"]
  }
}
```

#### Output Format
```markdown
# Endpoint Flow: {http_method} {endpoint}

## Endpoint Info
- **Path:** {endpoint}
- **Method:** {http_method}
- **Handler:** {ControllerClass}.{method}

## Complete Request Flow

### Layer 1: Filters (Pre-Controller)

#### Filter {N}: {FilterName}
- **Order:** {order}
- **File:** `{file}:{line}`
- **Purpose:** {description}

### Layer 2: Interceptors

#### {InterceptorName}
- **Phase:** preHandle
- **File:** `{file}:{line}`

### Layer 3: Request Advice

#### {AdviceClass}
- **Method:** afterBodyRead
- **File:** `{file}:{line}`
- **Modifies:** {what}

### Layer 4: Controller
**{ControllerClass}.{method}()**
- **File:** `{file}:{line}`
- **Request DTO:** {RequestDTO}
- **Response:** {ResponseType}

**Method Code:**
```java
{controller method}
```

### Layer 5: Service
**{ServiceClass}.{method}()**
- **File:** `{file}:{line}`

### Layer 6: Repository
**{RepositoryInterface}.{method}()**
- **File:** `{file}:{line}`

### Layer 7: Database
- **Operation:** {INSERT | UPDATE | SELECT | DELETE}
- **Entity:** {Entity}
- **Table:** {table}

## Flow Visualization
```
[HTTP Request]
    ↓
[Filter 1] AuthFilter
    ↓
[Controller] UserController.createUser()
    ↓
[Service] UserService.save()
    ↓
[Repository] UserRepository.save()
    ↓
[Database] INSERT INTO users
```

## Database Operations
| Operation | Entity | Table | Method |
|-----------|--------|-------|--------|
| INSERT | UserEntity | users | save() |

## Summary
- **Total Layers:** {count}
- **Filters:** {count}
- **Database Ops:** {count}

## File References
{list}

---
Complete flow traced.
```

#### Error Format
```markdown
# Error: Endpoint Flow Trace

**Problem:** Endpoint "{endpoint}" not found

**Possible Causes:**
- Endpoint path typo
- Endpoint not yet implemented
- Dynamic path variables not matched

**Suggestions:**
- Check endpoint spelling
- Use `find_controller_for_endpoint` to list all endpoints
- Try pattern: /api/users/{id}

**Context:** Searched for {http_method} {endpoint}
```

#### Implementation Notes
- **Combine multiple tool results**: Uses `find_filters_and_order`, `find_advice_adapters`, `find_controller_for_endpoint`
- **Find filters**: Scan for @Component with Filter/OncePerRequestFilter, extract @Order
- **Find interceptors**: Search for HandlerInterceptor implementations
- **Find advice**: Search for @ControllerAdvice with RequestBodyAdvice/ResponseBodyAdvice
- **Trace service calls**: Parse controller method body for service method invocations
- **Trace repository calls**: Parse service method body for repository method invocations
- **Infer database operation**: From repository method name (save→INSERT, find→SELECT)
- **Map to table**: Use @Table annotation on entity or convert entity name to snake_case

---

### Tool 2.5: `find_entity_by_table`

#### Purpose
Maps database table name to JPA Entity class with complete column mappings, relationships, and constraints. Useful when developer is working with database schema in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_entity_by_table",
  description: "Finds JPA Entity for database table",
  inputSchema: {
    type: "object",
    properties: {
      table_name: {
        type: "string",
        description: "Database table name"
      }
    },
    required: ["table_name"]
  }
}
```

#### Output Format
```markdown
# Entity Mapping: {table_name}

## Entity Class
- **Class:** {EntityClass}
- **Package:** {package}
- **File:** `{file}`
- **Table:** {table_name}

## Column Mappings

### {field_name} → {column_name}
- **Java Type:** {JavaType}
- **Column Type:** {SQLType}
- **Nullable:** {Yes | No}
- **Unique:** {Yes | No}
- **Annotations:** {annotations}

## Primary Key
- **Field:** {id_field}
- **Strategy:** {AUTO | IDENTITY | SEQUENCE}

## Relationships

### {field} (@OneToMany)
- **Target:** {TargetEntity}
- **Mapped By:** {field}
- **Cascade:** {types}
- **Fetch:** {LAZY | EAGER}

## Indexes
- {index_name}: ({columns})

## Auditing
- **Created Date:** {field}
- **Modified Date:** {field}

## Summary
- **Total Columns:** {count}
- **Relationships:** {count}

## Related Components
- **Repository:** {RepositoryInterface}
- **Services:** {Service1}, {Service2}

## File References
- Entity: `{file}`
- Repository: `{file}`

---
Entity mapping retrieved.
```

#### Error Format
```markdown
# Error: Entity Mapping

**Problem:** No entity found for table "{table_name}"

**Possible Causes:**
- Table name typo
- Entity uses different table name
- Entity not in configured packages

**Suggestions:**
- Check table name spelling
- Search for @Table(name="{table_name}")
- Verify entity packages in config

**Context:** Searched in entity packages: {packages}
```

#### Implementation Notes
- **Find entities** in ENTITY_PACKAGES directories
- **Check @Table annotation** for explicit table name
- **Default table name**: snake_case of entity class name if no @Table
- **Parse @Column annotations** for column names (default: snake_case of field name)
- **Extract @Id and @GeneratedValue** for primary key info
- **Parse relationship annotations**: @OneToMany, @ManyToOne, @ManyToMany, @OneToOne
- **Extract @JoinColumn** for foreign key columns
- **Look for audit annotations**: @CreatedDate, @LastModifiedDate, @CreatedBy, @LastModifiedBy
- **Find repository**: Search for {EntityName}Repository interface
- **Find services**: Search for classes that import or use this entity

---

### Tool 2.6: `find_advice_adapters`

#### Purpose
Lists all RequestBodyAdvice and ResponseBodyAdvice implementations that intercept requests/responses globally. Important for understanding where request/response data is modified in IntelliJ project.

#### Input Schema
```typescript
{
  name: "find_advice_adapters",
  description: "Lists request/response advice adapters",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

#### Output Format
```markdown
# Advice Adapters

## Request Body Advice

### {ClassName}
- **File:** `{file}`
- **Implements:** RequestBodyAdvice
- **Supports:** {description}

**Methods:**
- ✓ beforeBodyRead
- ✓ afterBodyRead

**Purpose:** {inferred purpose}

**Code Preview:**
```java
{key method excerpt}
```

## Response Body Advice

### {ClassName}
- **File:** `{file}`
- **Implements:** ResponseBodyAdvice

**Purpose:** {purpose}

## Summary
- **Request Advice:** {count}
- **Response Advice:** {count}

## File References
{list}

---
Found {count} advice adapter(s).
```

#### Error/No Results Format
```markdown
# Advice Adapters

## No Advice Adapters Found

**This project does not implement RequestBodyAdvice or ResponseBodyAdvice.**

**Common Use Cases:**
These interfaces are typically used for:
- Logging all requests/responses
- Adding audit trails
- Transforming data globally
- Adding security headers

**To implement:**
```java
@ControllerAdvice
public class MyRequestAdvice implements RequestBodyAdvice {
    // Implementation
}
```

---
No advice adapters found in project.
```

#### Implementation Notes
- **Find @ControllerAdvice classes** that also implement RequestBodyAdvice or ResponseBodyAdvice
- **Parse supports() method** to understand what requests/responses it applies to
- **Extract implemented methods**: beforeBodyRead, afterBodyRead, handleEmptyBody for request; beforeBodyWrite for response
- **Infer purpose** from class name keywords (Logging, Audit, Transform, Security)
- **Show code preview** of key method (first 10-15 lines)

---

### Tool 2.7: `find_filters_and_order`

#### Purpose
Lists all Servlet Filters with their execution order. Critical for understanding pre-controller request processing when developer is debugging authentication/authorization in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_filters_and_order",
  description: "Lists filters with execution order",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
}
```

#### Output Format
```markdown
# Servlet Filters

## Execution Order

### Filter {N}: {FilterName} (Order: {order})
- **File:** `{file}`
- **Type:** {OncePerRequestFilter | Filter}
- **Order:** {number}
- **URL Patterns:** {patterns}

**Purpose:** {inferred}

**Code Preview:**
```java
{doFilter excerpt}
```

## Filter Chain Visualization
```
[HTTP Request]
    ↓
[Filter 1] AuthFilter (Order: 1)
    ↓
[Filter 2] LogFilter (Order: 2)
    ↓
[DispatcherServlet]
```

## Filter Details Table
| Order | Filter | Type | URL Pattern |
|-------|--------|------|-------------|
| 1 | AuthFilter | OncePerRequestFilter | /* |
| 2 | LogFilter | OncePerRequestFilter | /api/* |

## Summary
- **Total Filters:** {count}
- **Ordered:** {count}

## File References
{list}

---
Found {count} filter(s).
```

#### Error/No Results Format
```markdown
# Servlet Filters

## No Custom Filters Found

**This project uses default Spring Boot filter chain.**

**To add custom filter:**
```java
@Component
@Order(1)
public class MyFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response,
                                   FilterChain filterChain) {
        // Filter logic
        filterChain.doFilter(request, response);
    }
}
```

---
No custom filters found.
```

#### Implementation Notes
- **Find classes** extending: Filter, OncePerRequestFilter, GenericFilterBean
- **Must have @Component** or other Spring annotation to be registered
- **Extract @Order annotation** value (lower number = earlier execution)
- **Handle Ordered interface**: Look for getOrder() method
- **Default order**: Filters without @Order have Integer.MAX_VALUE (executed last)
- **Parse doFilter/doFilterInternal** for purpose inference
- **Infer purpose** from class name (Auth, Log, CORS, Cache, RateLimit, Encoding)
- **Sort by order** (lowest number first) for execution sequence

---

## 6.4 Server 3: Spring Component Context (4 Tools)

### Tool 3.1: `analyze_controller_method`

#### Purpose
Extracts complete information about a controller method including all parameter types, annotations, and return type. Essential when developer is working on controllers in IntelliJ.

#### Input Schema
```typescript
{
  name: "analyze_controller_method",
  description: "Analyzes controller method parameters and return type",
  inputSchema: {
    type: "object",
    properties: {
      controller_name: { type: "string" },
      method_name: { type: "string" }
    },
    required: ["controller_name", "method_name"]
  }
}
```

#### Output Format
```markdown
# Controller Method Analysis: {ControllerName}.{methodName}

## Method Signature
```java
{full signature}
```

## Endpoint Mapping
- **Path:** {path}
- **HTTP Method:** {GET | POST | ...}
- **Produces:** {media types}
- **Consumes:** {media types}

## Request Parameters

### @RequestBody: {param}
- **Type:** `{Type}`
- **DTO File:** `{file}`
- **Required:** {Yes | No}
- **Validated:** {@Valid: Yes | No}

### @RequestParam: {param}
- **Type:** `{Type}`
- **Required:** {Yes | No}
- **Default:** {value}

### @PathVariable: {param}
- **Type:** `{Type}`

### @RequestHeader: {param}
- **Type:** `{Type}`
- **Header Name:** {name}

## Return Type
- **Wrapped:** {ResponseEntity | Mono | Direct}
- **Response DTO:** `{Type}`
- **DTO File:** `{file}`

## Method Body Preview
```java
{method code}
```

## Related DTOs

### Request: {RequestDTO}
- Fields: {count}
- File: `{path}`

### Response: {ResponseDTO}
- Fields: {count}
- File: `{path}`

## Summary
- **Total Parameters:** {count}
- **Request Body:** {Yes | No}
- **Validation:** {Enabled | Disabled}

## File References
{list}

---
Analyzed successfully.
```

#### Error Format
```markdown
# Error: Controller Method Analysis

**Problem:** Method "{method_name}" not found in {controller_name}

**Possible Causes:**
- Method name typo
- Method in parent controller
- Method is private

**Suggestions:**
- Check method spelling
- Use `find_all_usages` to locate method
- Verify controller name

**Context:** Searched in {controller_name}
```

#### Implementation Notes
- **Parse @RequestMapping** at class level for base path
- **Parse method annotations**: @GetMapping, @PostMapping, @PutMapping, @DeleteMapping, @PatchMapping, @RequestMapping
- **Combine paths**: base path + method path
- **Extract all parameter types**: @RequestBody, @RequestParam, @PathVariable, @RequestHeader
- **Parse validation**: Check for @Valid, @Validated on parameters
- **Extract return type**: Unwrap ResponseEntity<T>, Mono<T>, Flux<T> to get actual DTO
- **Get DTO summaries**: Call `get_dto_structure` with max_depth=1 for brief overview
- **Show method body**: Full implementation for context

---

### Tool 3.2: `find_controller_for_endpoint`

#### Purpose
Finds which controller and method handles a specific API endpoint. Useful when developer knows the endpoint but needs to find the implementation in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_controller_for_endpoint",
  description: "Finds controller handling an endpoint",
  inputSchema: {
    type: "object",
    properties: {
      endpoint: {
        type: "string",
        description: "Endpoint path (e.g., '/api/users')"
      },
      http_method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "DELETE", "PATCH"]
      }
    },
    required: ["endpoint"]
  }
}
```

#### Output Format
```markdown
# Endpoint Handler: {http_method} {endpoint}

## Handler Found
- **Controller:** {ControllerClass}
- **Method:** {methodName}
- **File:** `{file}:{line}`

## Complete Mapping
- **Base Path:** {controller base}
- **Method Path:** {method path}
- **Full Path:** {complete endpoint}
- **HTTP Method:** {method}

## Method Signature
```java
{signature}
```

## Quick Info
- **Request Type:** {RequestDTO | N/A}
- **Response Type:** {ResponseDTO}
- **Async:** {Yes | No}

## Related Endpoints in Controller
| Method | Path | HTTP | Handler |
|--------|------|------|---------|
| POST | /api/users | POST | createUser() |
| GET | /api/users/{id} | GET | getUser() |

## File References
- Controller: `{file}`

---
Handler found.
```

#### Error Format
```markdown
# Error: Endpoint Handler Search

**Problem:** No handler found for {http_method} {endpoint}

**Possible Causes:**
- Endpoint path typo
- Endpoint not implemented
- Path variables not matched

**Suggestions:**
- Check endpoint spelling
- List all endpoints with this pattern: {pattern}
- Try without path variables: /api/users instead of /api/users/123

**Available Endpoints:**
{List of similar endpoints}

**Context:** Searched for {http_method} {endpoint}
```

#### Implementation Notes
- **Find all @Controller and @RestController classes**
- **Parse @RequestMapping at class and method level**
- **Match endpoint** accounting for path variables (e.g., {id})
- **Convert path variables to regex** for matching: /api/users/{id} matches /api/users/123
- **Filter by HTTP method** if specified
- **List related endpoints** in same controller for context
- **Find similar endpoints** if not found (Levenshtein distance or structure matching)

---

### Tool 3.3: `find_implementations`

#### Purpose
Finds all classes implementing an interface or extending an abstract class. Useful when developer is working with polymorphism in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_implementations",
  description: "Finds all implementations of interface/abstract class",
  inputSchema: {
    type: "object",
    properties: {
      interface_or_abstract_class: {
        type: "string",
        description: "Interface or abstract class name"
      }
    },
    required: ["interface_or_abstract_class"]
  }
}
```

#### Output Format
```markdown
# Implementations: {InterfaceName}

## Parent Type
- **Name:** {InterfaceName}
- **Type:** {Interface | Abstract Class}
- **File:** `{file}`
- **Package:** {package}

## Methods Defined
- {method_signature_1}
- {method_signature_2}

## Implementations: {count}

### Implementation {N}: {ClassName}
- **File:** `{file}`
- **Package:** {package}
- **Abstract:** {Yes | No}

**Overridden Methods:**
- ✓ {method1}()
- ✓ {method2}()
- ✗ {method3}() ← Not implemented

**Additional Methods:**
- {custom_method1}()

**Annotations:**
- {annotations}

**Usage Context:**
{description}

## Inheritance Hierarchy
```
{InterfaceName}
├── {Implementation1}
├── {Implementation2}
│   └── {SubImplementation}
└── {Implementation3}
```

## Summary
- **Total Implementations:** {count}
- **Direct:** {count}
- **Indirect:** {count}
- **Abstract:** {count}

## Usage Patterns
- Strategy Pattern: {Yes | No}
- Polymorphic Usage: {where}

## File References
{list}

---
Found {count} implementation(s).
```

#### Error Format
```markdown
# Error: Implementation Search

**Problem:** Interface/Abstract class "{name}" not found

**Possible Causes:**
- Class name typo
- Class not in workspace
- Class is a regular class (not interface/abstract)

**Suggestions:**
- Verify class name spelling
- Check if class exists in project
- Confirm class is interface or abstract

**Context:** Searched for {name}
```

#### Implementation Notes
- **Determine if interface or abstract** by checking class declaration
- **Search all classes** for implements/extends declarations
- **Check which methods are overridden** by matching signatures
- **Find methods not implemented** (if abstract methods remain)
- **Detect indirect implementations** (classes extending implementations)
- **Build inheritance tree** showing multi-level hierarchy
- **Detect usage patterns**: Look for fields/parameters of interface type (polymorphic usage)
- **Strategy pattern detection**: 3+ implementations + polymorphic usage

---

### Tool 3.4: `find_feature_flag_usage`

#### Purpose
Finds all places where feature flags control conditional logic in the codebase. Useful when developer is working with feature toggles in IntelliJ.

#### Input Schema
```typescript
{
  name: "find_feature_flag_usage",
  description: "Finds feature flag conditional logic",
  inputSchema: {
    type: "object",
    properties: {
      flag_identifier: {
        type: "string",
        description: "Optional: Specific flag name"
      },
      search_pattern: {
        type: "string",
        description: "Optional: Method pattern (e.g., 'isFeatureEnabled')"
      }
    },
    required: []
  }
}
```

#### Output Format
```markdown
# Feature Flag Usage Analysis

{If specific flag:}
## Flag: {flag_identifier}

## Flags Detected: {count}

### Flag {N}: {flag_name}

#### Flag Definition
- **Type:** {Field | Method | Config Property}
- **Location:** {where defined}
- **Default:** {value}

#### Usage Locations: {count}

##### Usage {N}: {ClassName}.{methodName}
**Location:** `{file}:{line}`

**Conditional Logic:**
```java
{code context}
```

**Condition Type:** {if-else | switch | ternary}

**Branches:**
- ✓ Flag Enabled: {what happens}
- ✗ Flag Disabled: {what happens}

**Impact:**
{description}

## Flag Impact Analysis

### {flag_name}
**Affects:** {count} components

| Component | Impact | File |
|-----------|--------|------|
| UserService | Changes save logic | UserService.java:45 |

**Dependencies:**
- Depends on: {other_flag}

## Flag Configuration Sources

### Database Flags
- {flag}: {table}.{column}

### Config Flags
- {flag}: {property_key}

### Request Flags
- {flag}: {request param/header}

## Summary
- **Total Flags:** {count}
- **Total Usages:** {count}
- **Files Affected:** {count}

## Recommendations
- ⚠️ Flag {name} has {N} usages
- ⚠️ Nested flags detected

## File References
{list}

---
Found {count} flag(s).
```

#### Error/No Results Format
```markdown
# Feature Flag Usage Analysis

## No Feature Flags Found

**No feature flag patterns detected in this project.**

**Common feature flag patterns:**
- `if (isFeatureEnabled("feature_name"))`
- `if (config.getFeatureFlag("feature_name"))`
- `if (request.hasFlag("feature_name"))`
- `if (featureFlags.get("feature_name"))`

**To implement feature flags:**
- Add configuration properties
- Use database flag tables
- Integrate feature flag service (LaunchDarkly, etc.)

---
No feature flags found.
```

#### Implementation Notes
- **Use configured patterns** from FEATURE_FLAG_PATTERNS env var or defaults
- **Default patterns**: isFeatureEnabled, isEnabled, hasFeature, getFeatureFlag, getFlag, feature_, flag_
- **Search for method calls** matching patterns using JavaParser AST traversal
- **Extract flag name** from method arguments (string literal, constant, field reference)
- **Find containing conditional**: Walk up AST to find if-else, switch, or ternary
- **Analyze branches**: Determine what happens when flag is enabled vs disabled
- **Track flag sources**: Infer if flag comes from DB, config file, request parameter
- **Detect dependencies**: Find nested flag checks (one flag depends on another)
- **Impact analysis**: Count affected components and files

---

## 7. Implementation Guide

### 7.1 Phase 1: Foundation Setup

#### Step 1: Project Initialization

```bash
# Create project structure
mkdir -p spring-boot-mcp-servers
cd spring-boot-mcp-servers

# Initialize workspace
npm init -w packages/micro-context -w packages/macro-context -w packages/spring-component

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "spring-boot-mcp-servers",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "dev": "npm run dev --workspaces",
    "test": "npm run test --workspaces"
  }
}
EOF
```

#### Step 2: Set Up TypeScript MCP Server Template

```bash
cd packages/micro-context

# Initialize package
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk zod

# Install dev dependencies
npm install -D typescript @types/node tsx

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create directory structure
mkdir -p src/tools
touch src/index.ts src/java-parser-client.ts
```

#### Step 3: Set Up Java Parser Service

```bash
cd ../../
mkdir -p packages/java-parser-service

cd packages/java-parser-service

# Create Maven project structure
mkdir -p src/main/java/com/mcp/javaparser/models
mkdir -p src/main/resources

# Create pom.xml
cat > pom.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.mcp</groupId>
    <artifactId>java-parser-service</artifactId>
    <version>1.0.0</version>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <javaparser.version>3.25.8</javaparser.version>
        <jackson.version>2.16.0</jackson.version>
    </properties>

    <dependencies>
        <!-- JavaParser with Symbol Solver -->
        <dependency>
            <groupId>com.github.javaparser</groupId>
            <artifactId>javaparser-symbol-solver-core</artifactId>
            <version>${javaparser.version}</version>
        </dependency>

        <!-- Jackson for JSON -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>${jackson.version}</version>
        </dependency>

        <!-- JUnit for testing -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>5.10.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
            </plugin>

            <!-- Create executable JAR with dependencies -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.1</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <transformers>
                                <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                    <mainClass>com.mcp.javaparser.Main</mainClass>
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
EOF

# Create build script
cat > build.sh << 'EOF'
#!/bin/bash
mvn clean package
echo "Java Parser Service built: target/java-parser-service-1.0.0.jar"
EOF

chmod +x build.sh
```

#### Step 4: Create Base MCP Server Structure

**File: `packages/micro-context/src/index.ts`**

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { JavaParserClient } from './java-parser-client.js';

// Import tool implementations
import { resolveSymbol } from './tools/resolve-symbol.js';
import { getFunctionDefinition } from './tools/get-function-definition.js';
import { getDtoStructure } from './tools/get-dto-structure.js';
import { findExecutionBranches } from './tools/find-execution-branches.js';
import { findMockableDependencies } from './tools/find-mockable-dependencies.js';

// Get workspace root from command line args (passed by IntelliJ Cody)
const workspaceRoot = process.argv[2];

if (!workspaceRoot) {
  console.error('Usage: node dist/index.js <workspace-root>');
  process.exit(1);
}

// Configuration from environment variables
const config = {
  packageInclude: process.env.PACKAGE_INCLUDE || '',
  packageExclude: process.env.PACKAGE_EXCLUDE || '',
  dtoPackages: process.env.DTO_PACKAGES?.split(',') || [],
  maxDtoDepth: parseInt(process.env.MAX_DTO_DEPTH || '10', 10)
};

// Initialize JavaParser client
const javaParserClient = new JavaParserClient(workspaceRoot, config);

// Create MCP server
const server = new Server(
  {
    name: 'spring-boot-micro-context',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools = [
  {
    name: 'resolve_symbol',
    description: 'Resolves a symbol to its type and declaration location',
    inputSchema: {
      type: 'object',
      properties: {
        symbol_name: { type: 'string', description: 'Symbol to resolve' },
        context_file: { type: 'string', description: 'File where symbol appears' },
        line_number: { type: 'number', description: 'Optional: Line for disambiguation' }
      },
      required: ['symbol_name', 'context_file']
    }
  },
  {
    name: 'get_function_definition',
    description: 'Returns complete method definition with body',
    inputSchema: {
      type: 'object',
      properties: {
        function_name: { type: 'string' },
        class_name: { type: 'string' },
        file_path: { type: 'string', description: 'Optional hint' },
        include_body: { type: 'boolean', description: 'Include method body', default: true }
      },
      required: ['function_name', 'class_name']
    }
  },
  {
    name: 'get_dto_structure',
    description: 'Recursively extracts DTO structure with nested objects',
    inputSchema: {
      type: 'object',
      properties: {
        class_name: { type: 'string' },
        max_depth: { type: 'number', default: 10 },
        include_annotations: { type: 'boolean', default: true },
        include_inheritance: { type: 'boolean', default: true }
      },
      required: ['class_name']
    }
  },
  {
    name: 'find_execution_branches',
    description: 'Analyzes execution branches for test coverage',
    inputSchema: {
      type: 'object',
      properties: {
        method_code: { type: 'string', description: 'Full method source' },
        class_name: { type: 'string', description: 'Optional context' },
        method_name: { type: 'string', description: 'Optional for reporting' }
      },
      required: ['method_code']
    }
  },
  {
    name: 'find_mockable_dependencies',
    description: 'Finds dependencies to mock in unit tests',
    inputSchema: {
      type: 'object',
      properties: {
        class_name: { type: 'string' },
        file_path: { type: 'string', description: 'Optional hint' },
        include_method_params: { type: 'boolean', default: false }
      },
      required: ['class_name']
    }
  }
];

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'resolve_symbol':
        result = await resolveSymbol(javaParserClient, args);
        break;
      case 'get_function_definition':
        result = await getFunctionDefinition(javaParserClient, args);
        break;
      case 'get_dto_structure':
        result = await getDtoStructure(javaParserClient, args);
        break;
      case 'find_execution_branches':
        result = await findExecutionBranches(javaParserClient, args);
        break;
      case 'find_mockable_dependencies':
        result = await findMockableDependencies(javaParserClient, args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result
        }
      ]
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return {
      content: [
        {
          type: 'text',
          text: `# Error: ${name}\n\n**Problem:** ${errorMessage}\n\n**Suggestions:**\n- Verify input parameters\n- Check file paths\n- Ensure Java files are valid`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Spring Boot Micro Context MCP Server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

#### Step 5: Create JavaParser Client (Node.js ↔ Java Bridge)

**File: `packages/micro-context/src/java-parser-client.ts`**

```typescript
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';

export interface JavaParserConfig {
  packageInclude: string;
  packageExclude: string;
  dtoPackages: string[];
  maxDtoDepth: number;
}

export class JavaParserClient {
  private javaProcess: ChildProcess | null = null;
  private workspaceRoot: string;
  private config: JavaParserConfig;
  private requestId = 0;
  private pendingRequests: Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }> = new Map();

  constructor(workspaceRoot: string, config: JavaParserConfig) {
    this.workspaceRoot = workspaceRoot;
    this.config = config;
    this.startJavaProcess();
  }

  private startJavaProcess() {
    const jarPath = path.join(__dirname, '../../java-parser-service/target/java-parser-service-1.0.0.jar');

    this.javaProcess = spawn('java', ['-jar', jarPath, this.workspaceRoot], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Handle stdout (responses)
    const rl = readline.createInterface({
      input: this.javaProcess.stdout!,
      crlfDelay: Infinity
    });

    rl.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        const requestId = response.requestId;

        if (this.pendingRequests.has(requestId)) {
          const { resolve, reject } = this.pendingRequests.get(requestId)!;
          this.pendingRequests.delete(requestId);

          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error.message));
          }
        }
      } catch (error) {
        console.error('Failed to parse Java response:', error);
      }
    });

    // Handle stderr (errors)
    this.javaProcess.stderr!.on('data', (data) => {
      console.error('Java process error:', data.toString());
    });

    // Handle process exit
    this.javaProcess.on('close', (code) => {
      console.error(`Java process exited with code ${code}`);
      // Reject all pending requests
      for (const { reject } of this.pendingRequests.values()) {
        reject(new Error('Java process terminated'));
      }
      this.pendingRequests.clear();
    });
  }

  async sendRequest(operation: string, params: any): Promise<any> {
    if (!this.javaProcess || this.javaProcess.killed) {
      throw new Error('Java process not running');
    }

    const requestId = ++this.requestId;

    const request = {
      requestId,
      operation,
      workspaceRoot: this.workspaceRoot,
      params,
      config: this.config
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      this.javaProcess!.stdin!.write(JSON.stringify(request) + '\n', (error) => {
        if (error) {
          this.pendingRequests.delete(requestId);
          reject(error);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  dispose() {
    if (this.javaProcess) {
      this.javaProcess.kill();
      this.javaProcess = null;
    }
  }
}
```

#### Step 6: Create Base Java Parser Service

**File: `packages/java-parser-service/src/main/java/com/mcp/javaparser/Main.java`**

```java
package com.mcp.javaparser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static Parser parser;

    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java -jar java-parser-service.jar <workspace-root>");
            System.exit(1);
        }

        String workspaceRoot = args[0];
        parser = new Parser(Paths.get(workspaceRoot));

        System.err.println("Java Parser Service started for workspace: " + workspaceRoot);

        // Read requests from stdin
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            String line;
            while ((line = reader.readLine()) != null) {
                handleRequest(line);
            }
        } catch (Exception e) {
            System.err.println("Error reading requests: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void handleRequest(String requestJson) {
        try {
            JsonNode request = objectMapper.readTree(requestJson);
            int requestId = request.get("requestId").asInt();
            String operation = request.get("operation").asText();
            JsonNode params = request.get("params");
            JsonNode config = request.get("config");

            // Update parser config
            parser.updateConfig(config);

            // Execute operation
            Object result;
            switch (operation) {
                case "resolve_symbol":
                    result = parser.resolveSymbol(params);
                    break;
                case "get_function_definition":
                    result = parser.getFunctionDefinition(params);
                    break;
                case "get_dto_structure":
                    result = parser.getDtoStructure(params);
                    break;
                case "find_execution_branches":
                    result = parser.findExecutionBranches(params);
                    break;
                case "find_mockable_dependencies":
                    result = parser.findMockableDependencies(params);
                    break;
                // Add other operations for macro and component servers
                default:
                    throw new IllegalArgumentException("Unknown operation: " + operation);
            }

            // Send success response
            sendResponse(requestId, true, result, null);
        } catch (Exception e) {
            try {
                JsonNode request = objectMapper.readTree(requestJson);
                int requestId = request.get("requestId").asInt();
                sendResponse(requestId, false, null, e.getMessage());
            } catch (Exception ex) {
                System.err.println("Failed to send error response: " + ex.getMessage());
            }
        }
    }

    private static void sendResponse(int requestId, boolean success, Object data, String errorMessage) {
        try {
            ObjectNode response = objectMapper.createObjectNode();
            response.put("requestId", requestId);
            response.put("success", success);

            if (success) {
                response.set("data", objectMapper.valueToTree(data));
                response.putNull("error");
            } else {
                response.putNull("data");
                ObjectNode error = objectMapper.createObjectNode();
                error.put("message", errorMessage);
                error.put("code", "PROCESSING_ERROR");
                response.set("error", error);
            }

            // Write to stdout (one line per response)
            System.out.println(objectMapper.writeValueAsString(response));
            System.out.flush();
        } catch (Exception e) {
            System.err.println("Failed to send response: " + e.getMessage());
        }
    }
}
```

### 7.2 Implementation Phases

#### Phase 2: Server 1 (Micro Context) - Implement Tools 1.1 - 1.5
- Implement `resolve_symbol` tool in TypeScript and Java
- Implement `get_function_definition` tool
- Implement `get_dto_structure` tool (with recursion and circular reference detection)
- Implement `find_execution_branches` tool
- Implement `find_mockable_dependencies` tool

**Key Implementation Tasks:**
- Create Parser.java class with JavaParser initialization and SymbolSolver setup
- Implement each tool as a method in Parser.java
- Create corresponding TypeScript tool wrapper in src/tools/
- Format output as markdown according to specifications
- Handle errors with actionable suggestions

#### Phase 3: Server 2 (Macro Context) - Implement Tools 2.1 - 2.7
- Implement `build_method_call_chain` tool
- Implement `trace_data_transformation` tool
- Implement `find_all_usages` tool
- Implement `trace_endpoint_to_repository` tool
- Implement `find_entity_by_table` tool
- Implement `find_advice_adapters` tool
- Implement `find_filters_and_order` tool

**Key Implementation Tasks:**
- Create CallGraphBuilder.java for method call chain tracing
- Create SpringAnalyzer.java for Spring-specific pattern detection
- Implement AST traversal for usage finding
- Combine multiple tool results for endpoint-to-repository tracing

#### Phase 4: Server 3 (Spring Component) - Implement Tools 3.1 - 3.4
- Implement `analyze_controller_method` tool
- Implement `find_controller_for_endpoint` tool
- Implement `find_implementations` tool
- Implement `find_feature_flag_usage` tool

**Key Implementation Tasks:**
- Parse Spring annotations (@RequestMapping, @GetMapping, etc.)
- Handle path variable matching with regex
- Implement interface/abstract class resolution
- Pattern matching for feature flag detection

#### Phase 5: Testing, Integration & Refinement
- Test all tools with real Spring Boot projects
- Test integration with Cody in IntelliJ IDEA
- Performance optimization
- Error handling improvements
- Documentation and examples

---

## 8. Environment Setup

### 8.1 Development Environment Requirements

#### Required Software
- **Node.js**: >= 18.0.0
- **Java JDK**: >= 11 (recommended: 17 or 21)
- **Maven**: >= 3.8.0
- **Git**: Latest version
- **IntelliJ IDEA**: Ultimate or Community Edition (with Cody plugin installed)

#### Installation Instructions

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install Java
brew install openjdk@17

# Install Maven
brew install maven

# Verify installations
node --version  # Should be >= 18
java --version  # Should be >= 11
mvn --version   # Should be >= 3.8
```

**Linux (Ubuntu/Debian):**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java
sudo apt-get install -y openjdk-17-jdk

# Install Maven
sudo apt-get install -y maven

# Verify installations
node --version
java --version
mvn --version
```

**Windows:**
1. Install Node.js from https://nodejs.org/
2. Install Java JDK from https://adoptium.net/
3. Install Maven from https://maven.apache.org/download.cgi
4. Add to PATH environment variables
5. Verify in PowerShell:
```powershell
node --version
java --version
mvn --version
```

### 8.2 IntelliJ IDEA Setup

#### Install Cody Plugin
1. Open IntelliJ IDEA
2. Go to **Settings/Preferences** → **Plugins**
3. Search for "Cody" in Marketplace
4. Click **Install**
5. Restart IntelliJ IDEA
6. Verify Cody is enabled and has MCP server support

#### Install Required IntelliJ Plugins (Optional but Recommended)
- Lombok Plugin (if projects use Lombok)
- Maven Helper
- Spring Boot Assistant

### 8.3 Project Setup

```bash
# Clone or create project
git clone <repository-url>
cd spring-boot-mcp-servers

# Install Node dependencies
npm install

# Build Java Parser Service
cd packages/java-parser-service
./build.sh
cd ../..

# Build TypeScript MCP servers
npm run build

# Verify build
ls -l packages/micro-context/dist/
ls -l packages/macro-context/dist/
ls -l packages/spring-component/dist/
ls -l packages/java-parser-service/target/*.jar
```

### 8.4 IDE Configuration

#### IntelliJ IDEA
1. **Open Project**: File → Open → Select spring-boot-mcp-servers directory
2. **Configure Java SDK**: File → Project Structure → Project SDK → Select Java 17
3. **Enable Maven Auto-Import**: Settings → Build, Execution, Deployment → Build Tools → Maven → Check "Automatically download"
4. **Configure TypeScript**: Settings → Languages & Frameworks → TypeScript → Set compiler to project's node_modules/typescript/lib

---

## 9. Configuration & Customization

### 9.1 Project-Specific Configuration

Each Spring Boot project has different package structures. Configure via environment variables in Cody's MCP server settings in IntelliJ IDEA:

**Example Configuration for Your Project:**

In **IntelliJ IDEA Settings → Tools → Cody → MCP Servers**, add:

```json
{
  "spring-micro-context": {
    "command": "node",
    "args": [
      "/absolute/path/to/spring-boot-mcp-servers/packages/micro-context/dist/index.js",
      "${workspaceFolder}"
    ],
    "env": {
      "PACKAGE_INCLUDE": "com.yourcompany.*",
      "PACKAGE_EXCLUDE": "com.yourcompany.generated.*",
      "DTO_PACKAGES": "com.yourcompany.dto,com.yourcompany.model,com.yourcompany.api.request,com.yourcompany.api.response",
      "MAX_DTO_DEPTH": "10"
    }
  },
  "spring-macro-context": {
    "command": "node",
    "args": [
      "/absolute/path/to/spring-boot-mcp-servers/packages/macro-context/dist/index.js",
      "${workspaceFolder}"
    ],
    "env": {
      "PACKAGE_INCLUDE": "com.yourcompany.*",
      "CALL_CHAIN_MAX_DEPTH": "15",
      "STOP_AT_PACKAGES": "java.*,javax.*,org.springframework.*,org.hibernate.*,org.apache.*"
    }
  },
  "spring-component": {
    "command": "node",
    "args": [
      "/absolute/path/to/spring-boot-mcp-servers/packages/spring-component/dist/index.js",
      "${workspaceFolder}"
    ],
    "env": {
      "PACKAGE_INCLUDE": "com.yourcompany.*",
      "ENTITY_PACKAGES": "com.yourcompany.entity,com.yourcompany.domain",
      "FEATURE_FLAG_PATTERNS": "isFeatureEnabled,isEnabled,hasFeature"
    }
  }
}
```

**Note:** Replace `/absolute/path/to/` with actual absolute path to your built MCP servers. `${workspaceFolder}` is a variable that Cody will replace with the current IntelliJ project directory.

### 9.2 Configuration Variables Reference

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| **PACKAGE_INCLUDE** | Package pattern to analyze | `com.company.*` | (required) |
| **PACKAGE_EXCLUDE** | Packages to exclude | `com.company.generated.*` | null |
| **DTO_PACKAGES** | Where DTOs are located | `com.company.dto,com.company.model` | Auto-detect |
| **ENTITY_PACKAGES** | Where JPA entities are | `com.company.entity` | Auto-detect |
| **MAX_DTO_DEPTH** | Max nesting for DTOs | `15` | 10 |
| **CALL_CHAIN_MAX_DEPTH** | Max call chain depth | `20` | 15 |
| **STOP_AT_PACKAGES** | Framework boundaries | `java.*,javax.*,org.springframework.*` | (see below) |
| **FEATURE_FLAG_PATTERNS** | Flag method patterns | `isEnabled,hasFlag` | (see below) |

### 9.3 Default Values

**STOP_AT_PACKAGES (default):**
```
java.*
javax.*
org.springframework.*
org.hibernate.*
org.apache.*
org.slf4j.*
com.fasterxml.jackson.*
```

**FEATURE_FLAG_PATTERNS (default):**
```
isFeatureEnabled
isEnabled
hasFeature
getFeatureFlag
getFlag
feature_
flag_
```

### 9.4 Per-Project Customization Steps for IntelliJ

1. **Identify your package structure in IntelliJ:**
   - Open any Java file in your project
   - Look at the package declaration at the top
   - Note the base package (e.g., `com.yourcompany.projectname`)

2. **Find where DTOs are:**
   - In IntelliJ's Project view, navigate to src/main/java
   - Look for packages named: dto, model, request, response, api
   - Note full package names

3. **Find where Entities are:**
   - Look for packages named: entity, domain, persistence
   - Or search for files with @Entity annotation: Ctrl+Shift+F (Windows/Linux) or Cmd+Shift+F (Mac)
   - Search for: `@Entity`

4. **Update Cody MCP configuration in IntelliJ:**
   - Settings → Tools → Cody → MCP Servers
   - Add/Edit server configuration with your values
   - Click Apply and OK

5. **Test in IntelliJ:**
   - Open a Java file in your Spring Boot project
   - Ask Cody: "What services do we have?"
   - Verify Cody uses the MCP tools (you'll see detailed structured output)

---

## 10. Error Handling Standards

### 10.1 Error Response Format

Based on research of popular agentic AI systems and official Anthropic MCP servers, all errors follow this markdown format:

```markdown
# Error: {Tool Name}

**Problem:** {Clear description of what went wrong}

**Possible Causes:**
- Cause 1
- Cause 2
- Cause 3

**Suggestions:**
- Try: Action 1
- Or: Action 2
- Check: Detail 3

**Context:** {Additional debugging info}
```

### 10.2 Error Categories

#### Category 1: Input Validation Errors
**When:** Invalid parameters provided by Cody
**Response:**
```markdown
# Error: {Tool Name}

**Problem:** Invalid input parameter "{param_name}"

**Possible Causes:**
- Parameter is required but not provided
- Parameter format is incorrect
- Parameter value out of range

**Suggestions:**
- Verify parameter: {param_name}
- Expected format: {format}
- Valid range: {range}
```

#### Category 2: File/Class Not Found
**When:** Cannot find requested Java file or class in IntelliJ workspace
**Response:**
```markdown
# Error: {Tool Name}

**Problem:** Class/File "{name}" not found

**Possible Causes:**
- Class name typo
- File not in workspace
- Not in configured packages

**Suggestions:**
- Check spelling: {name}
- Verify file exists in IntelliJ project: {workspace}
- Check PACKAGE_INCLUDE config: {current_config}

**Context:** Searched in packages: {searched_packages}
```

#### Category 3: Parsing Errors
**When:** Cannot parse Java code
**Response:**
```markdown
# Error: {Tool Name}

**Problem:** Failed to parse Java code

**Possible Causes:**
- Syntax errors in code
- Unsupported Java version features
- Incomplete code snippet

**Suggestions:**
- Verify code compiles in IntelliJ
- Check Java version compatibility
- Ensure complete code block

**Context:** Parse error at line {line}: {error_detail}
```

#### Category 4: Resolution Errors
**When:** Cannot resolve symbols/types
**Response:**
```markdown
# Error: {Tool Name}

**Problem:** Cannot resolve "{symbol}"

**Possible Causes:**
- Symbol not declared in context
- Missing imports in file
- Ambiguous symbol reference

**Suggestions:**
- Check if symbol is declared in IntelliJ
- Verify imports are present
- Use line_number parameter for disambiguation

**Context:** Searched in: {file}
```

#### Category 5: Timeout/Performance Errors
**When:** Operation takes too long
**Response:**
```markdown
# Error: {Tool Name}

**Problem:** Operation timeout after {seconds} seconds

**Possible Causes:**
- Very large codebase in IntelliJ project
- Circular dependencies
- Complex nested structure

**Suggestions:**
- Reduce max_depth parameter
- Use more specific search scope
- Break into smaller queries

**Context:** Processing: {what_was_processing}
```

### 10.3 Error Handling Principles

1. **Always actionable**: Every error suggests what the user should do in IntelliJ
2. **Never show stack traces**: Keep error messages user-friendly for IntelliJ users
3. **Provide context**: Show what was being processed when error occurred
4. **Suggest alternatives**: If operation fails, suggest workarounds
5. **Be specific**: Don't use generic "Error occurred" messages
6. **IntelliJ-aware**: Reference IntelliJ features when helpful (e.g., "Verify code compiles in IntelliJ")

### 10.4 Error Recovery

**Graceful degradation:**
- If can't resolve all symbols, return partial results with note
- If max depth reached, indicate truncation
- If some files inaccessible, process available files

**Example in IntelliJ context:**
```markdown
# Symbol Resolution: userService (Partial Result)

## Resolved Type
`com.company.service.UserService`

## ⚠️ Warning
Could not resolve complete type information due to missing dependencies.

**Partial Resolution:**
- Type identified: UserService
- Package: com.company.service
- File: /path/to/UserService.java

**Could not resolve:**
- Full method signatures (missing import)
- Generic type parameters

**Suggestions:**
- Ensure all project dependencies are in IntelliJ project structure
- Run Maven/Gradle sync in IntelliJ
- Check if project compiles successfully
```

---

## 11. IntelliJ Cody Integration

### 11.1 How Cody Uses MCP Servers in IntelliJ

**Workflow:**
1. Developer works in IntelliJ IDEA with Cody plugin installed
2. Developer asks Cody a question (via chat or inline command)
3. Cody (Claude) analyzes the query and decides if MCP tools are needed
4. Cody calls appropriate MCP tool with parameters
5. MCP server (Node.js) processes request
6. JavaParser service analyzes IntelliJ workspace
7. Result formatted as markdown is returned to Cody
8. Cody displays result to developer in IntelliJ interface

### 11.2 Configuring MCP Servers in IntelliJ Cody

#### Access MCP Settings
1. Open IntelliJ IDEA
2. Go to **Settings/Preferences** (Ctrl+Alt+S on Windows/Linux, Cmd+, on Mac)
3. Navigate to **Tools → Cody → MCP Servers**
4. Click **Add Server** or **Edit** existing configuration

#### Add MCP Server Configuration

**For Micro Context Server:**
```json
{
  "name": "spring-micro-context",
  "command": "node",
  "args": [
    "/Users/yourname/spring-boot-mcp-servers/packages/micro-context/dist/index.js",
    "${workspaceFolder}"
  ],
  "env": {
    "PACKAGE_INCLUDE": "com.yourcompany.*",
    "DTO_PACKAGES": "com.yourcompany.dto,com.yourcompany.model"
  }
}
```

**For Macro Context Server:**
```json
{
  "name": "spring-macro-context",
  "command": "node",
  "args": [
    "/Users/yourname/spring-boot-mcp-servers/packages/macro-context/dist/index.js",
    "${workspaceFolder}"
  ],
  "env": {
    "PACKAGE_INCLUDE": "com.yourcompany.*",
    "STOP_AT_PACKAGES": "java.*,javax.*,org.springframework.*"
  }
}
```

**For Spring Component Server:**
```json
{
  "name": "spring-component",
  "command": "node",
  "args": [
    "/Users/yourname/spring-boot-mcp-servers/packages/spring-component/dist/index.js",
    "${workspaceFolder}"
  ],
  "env": {
    "PACKAGE_INCLUDE": "com.yourcompany.*",
    "ENTITY_PACKAGES": "com.yourcompany.entity"
  }
}
```

**Important Notes:**
- Replace `/Users/yourname/` with the actual absolute path where you built the MCP servers
- `${workspaceFolder}` is a special variable that Cody will replace with the current IntelliJ project root path
- All environment variables are optional except `PACKAGE_INCLUDE`

### 11.3 Testing MCP Integration in IntelliJ

#### Verify MCP Servers are Running

1. After adding configuration, restart IntelliJ or restart Cody plugin
2. Open Cody chat in IntelliJ
3. Type: `@workspace What tools do you have available?`
4. Verify you see tools like: `resolve_symbol`, `get_dto_structure`, etc.

#### Test Basic Functionality

**Test 1: Symbol Resolution**
1. Open a Spring Boot controller in IntelliJ
2. Select a line with a service field (e.g., `userService`)
3. Ask Cody: "What is the type of userService?"
4. Expected: Cody uses `resolve_symbol` tool and shows full type information

**Test 2: Test Generation**
1. Open a controller method
2. Select the method
3. Ask Cody: "Generate JUnit test for this method with 100% coverage"
4. Expected: Cody uses `analyze_controller_method`, `get_dto_structure`, `find_mockable_dependencies`, `find_execution_branches` and generates accurate test

**Test 3: Endpoint Tracing**
1. In IntelliJ, ask Cody: "What is the complete flow for POST /api/users?"
2. Expected: Cody uses `trace_endpoint_to_repository` and shows Filters → Controller → Service → Repository → Database

### 11.4 Troubleshooting in IntelliJ

#### MCP Servers Not Showing Up

**Problem:** Cody doesn't show MCP tools
**Solutions:**
1. Check IntelliJ logs: **Help → Show Log in Finder/Explorer**
2. Look for MCP-related errors
3. Verify Node.js is in PATH: Open IntelliJ Terminal and run `node --version`
4. Verify Java is in PATH: Run `java --version`
5. Check MCP configuration syntax is valid JSON
6. Restart IntelliJ IDEA completely

#### MCP Tools Failing

**Problem:** Tools are listed but fail when called
**Solutions:**
1. Check absolute paths in configuration are correct
2. Verify MCP servers are built: `ls packages/micro-context/dist/index.js`
3. Verify JAR is built: `ls packages/java-parser-service/target/*.jar`
4. Test manually from terminal:
```bash
cd packages/micro-context
node dist/index.js /path/to/your/spring/project
# Should start and wait for input
```

#### Wrong Package Configuration

**Problem:** Tools can't find classes in your project
**Solutions:**
1. Verify `PACKAGE_INCLUDE` matches your package structure
2. Check a Java file in IntelliJ, copy the package declaration
3. Update `PACKAGE_INCLUDE` to: `com.your.actual.package.*`
4. Restart Cody plugin

### 11.5 IntelliJ-Specific Features

#### Working with Multiple Projects

If you have multiple Spring Boot projects open in IntelliJ:
- Cody uses `${workspaceFolder}` which points to the currently active project
- MCP servers analyze whichever project is currently open
- To switch, just open files from different project

#### Integration with IntelliJ Features

**MCP servers work alongside IntelliJ's built-in features:**
- Code navigation (Ctrl+Click) works normally
- IntelliJ's own code completion works as usual
- Cody with MCP provides AI-powered deep analysis on top
- Use IntelliJ for navigation, use Cody for understanding and generation

#### Performance Considerations

- First call to MCP tool may be slower (JavaParser initialization)
- Subsequent calls are faster (Java process stays running)
- Large projects (1000+ files) may take 5-10 seconds for complex queries
- Cody shows "Thinking..." indicator while MCP tools work

---

## 12. Packaging & Distribution

### 12.1 Build for Distribution

#### Build All Servers

```bash
# From project root

# 1. Build Java Parser Service
cd packages/java-parser-service
mvn clean package
cd ../..

# 2. Build TypeScript servers
npm run build --workspaces

# 3. Verify builds
ls -l packages/micro-context/dist/index.js
ls -l packages/macro-context/dist/index.js
ls -l packages/spring-component/dist/index.js
ls -l packages/java-parser-service/target/java-parser-service-1.0.0.jar
```

### 12.2 Distribution Options

#### Option 1: NPM Packages (Recommended for Teams)

**Publish each server as NPM package:**

```bash
cd packages/micro-context

# Update package.json for publishing
npm version 1.0.0
npm publish

# Users install with:
npm install -g @yourcompany/spring-boot-micro-context-mcp
```

**In IntelliJ Cody config, users reference:**
```json
{
  "spring-micro-context": {
    "command": "spring-micro-context",
    "args": ["${workspaceFolder}"],
    "env": {
      "PACKAGE_INCLUDE": "com.company.*"
    }
  }
}
```

#### Option 2: GitHub Releases (For Open Source)

```bash
# Create release package
mkdir -p release/spring-boot-mcp-servers-v1.0.0

# Copy built artifacts
cp -r packages/micro-context/dist release/spring-boot-mcp-servers-v1.0.0/micro-context
cp -r packages/macro-context/dist release/spring-boot-mcp-servers-v1.0.0/macro-context
cp -r packages/spring-component/dist release/spring-boot-mcp-servers-v1.0.0/spring-component
cp packages/java-parser-service/target/*.jar release/spring-boot-mcp-servers-v1.0.0/

# Create installation README
cat > release/spring-boot-mcp-servers-v1.0.0/README.md << 'EOF'
# Spring Boot MCP Servers v1.0.0 for IntelliJ Cody

## Installation

1. Ensure Node.js >= 18 and Java >= 11 installed
2. Extract this archive to a permanent location
3. In IntelliJ IDEA: Settings → Tools → Cody → MCP Servers
4. Add server configurations pointing to extracted location

## Configuration

See CONFIGURATION.md for project-specific setup.
EOF

# Create tarball
cd release
tar -czf spring-boot-mcp-servers-v1.0.0.tar.gz spring-boot-mcp-servers-v1.0.0

# Upload to GitHub Releases
```

#### Option 3: Internal Distribution (For Companies)

1. **Build once** on a build server
2. **Upload to internal artifact repository** (Artifactory, Nexus, etc.)
3. **Create installation script** for developers:

```bash
#!/bin/bash
# install-spring-mcp.sh

INSTALL_DIR="$HOME/.spring-boot-mcp-servers"

# Download from internal repository
curl -o spring-mcp.tar.gz https://your-internal-repo/spring-mcp/v1.0.0/spring-mcp.tar.gz

# Extract
mkdir -p $INSTALL_DIR
tar -xzf spring-mcp.tar.gz -C $INSTALL_DIR

echo "Spring Boot MCP Servers installed to: $INSTALL_DIR"
echo "Configure IntelliJ Cody with this path"
```

### 12.3 Installation Guide for IntelliJ Users

**Create a comprehensive installation guide:**

```markdown
# Installing Spring Boot MCP Servers for IntelliJ Cody

## Prerequisites
- IntelliJ IDEA (Ultimate or Community)
- Cody plugin installed
- Node.js >= 18.0.0
- Java >= 11

## Installation Steps

### 1. Install Prerequisites

**Check if you have Node.js and Java:**
```bash
node --version  # Should be >= 18
java --version  # Should be >= 11
```

If not installed:
- **Node.js**: https://nodejs.org/
- **Java**: https://adoptium.net/

### 2. Install MCP Servers

**Option A: Via NPM (Recommended)**
```bash
npm install -g @yourcompany/spring-boot-micro-context-mcp
npm install -g @yourcompany/spring-boot-macro-context-mcp
npm install -g @yourcompany/spring-boot-spring-component-mcp
```

**Option B: Manual Installation**
1. Download latest release from [GitHub Releases]
2. Extract to permanent location (e.g., `~/spring-boot-mcp-servers`)
3. Note the installation path

### 3. Configure in IntelliJ Cody

1. Open IntelliJ IDEA
2. Go to **Settings** → **Tools** → **Cody** → **MCP Servers**
3. Click **Add Server**
4. Add three configurations:

**Micro Context Server:**
```json
{
  "name": "spring-micro-context",
  "command": "node",
  "args": [
    "/path/to/spring-boot-mcp-servers/packages/micro-context/dist/index.js",
    "${workspaceFolder}"
  ],
  "env": {
    "PACKAGE_INCLUDE": "com.yourcompany.*",
    "DTO_PACKAGES": "com.yourcompany.dto,com.yourcompany.model"
  }
}
```

(Repeat for macro-context and spring-component)

5. Click **Apply** and **OK**
6. Restart IntelliJ or restart Cody plugin

### 4. Verify Installation

1. Open a Spring Boot project in IntelliJ
2. Open Cody chat
3. Ask: "What services do we have?"
4. Verify Cody provides detailed structured response

### 5. Customize for Your Project

Update environment variables to match your package structure:
- `PACKAGE_INCLUDE`: Your base package (e.g., `com.yourcompany.*`)
- `DTO_PACKAGES`: Where your DTOs are
- `ENTITY_PACKAGES`: Where your JPA entities are

## Troubleshooting

### MCP tools not appearing
- Verify Node.js and Java are in PATH
- Check IntelliJ logs: Help → Show Log
- Restart IntelliJ completely

### Tools failing
- Check paths in configuration are absolute
- Verify MCP servers are built correctly
- Test manually from terminal

### Can't find classes
- Update `PACKAGE_INCLUDE` to match your actual package
- Restart Cody plugin after configuration changes

## Support

For issues or questions:
- GitHub Issues: [link]
- Internal Slack: #spring-mcp-support
```

### 12.4 Versioning Strategy

Follow Semantic Versioning:
- **Major** (1.0.0): Breaking changes (API, output format, configuration structure)
- **Minor** (1.1.0): New tools added, new features, backward compatible
- **Patch** (1.0.1): Bug fixes, performance improvements, documentation updates

---

## 13. Acceptance Criteria

### 13.1 Functional Acceptance

#### Server 1: Micro Context
- [ ] `resolve_symbol` correctly identifies symbol types and locations in IntelliJ projects
- [ ] `get_function_definition` extracts complete method signatures and bodies
- [ ] `get_dto_structure` recursively extracts nested DTOs to configured depth
- [ ] `find_execution_branches` identifies all conditional branches for test coverage
- [ ] `find_mockable_dependencies` finds all @Autowired and constructor dependencies

#### Server 2: Macro Context
- [ ] `build_method_call_chain` traces calls to framework boundaries correctly
- [ ] `trace_data_transformation` shows complete DTO → Entity → DTO flow
- [ ] `find_all_usages` finds every usage of method/class/field
- [ ] `trace_endpoint_to_repository` shows complete HTTP → DB flow
- [ ] `find_entity_by_table` maps tables to JPA entities accurately
- [ ] `find_advice_adapters` lists all advice implementations
- [ ] `find_filters_and_order` lists filters in correct execution order

#### Server 3: Spring Component
- [ ] `analyze_controller_method` extracts all parameter types and annotations
- [ ] `find_controller_for_endpoint` finds correct handler for any endpoint
- [ ] `find_implementations` finds all implementing classes
- [ ] `find_feature_flag_usage` detects flag-based conditional logic

### 13.2 IntelliJ Integration Acceptance

#### Configuration
- [ ] MCP servers can be configured in IntelliJ Cody settings
- [ ] `${workspaceFolder}` variable resolves to current IntelliJ project
- [ ] Environment variables are correctly passed to MCP servers
- [ ] Configuration changes take effect after Cody restart

#### Cody Integration
- [ ] Tools appear in Cody's available tools list
- [ ] Cody successfully calls tools from chat interface
- [ ] Markdown output renders correctly in IntelliJ Cody UI
- [ ] File paths in output are clickable and open correct files in IntelliJ
- [ ] Error messages are displayed clearly to user

#### Workspace Handling
- [ ] Works with single-module Maven projects
- [ ] Works with multi-module Maven projects
- [ ] Works with Gradle projects
- [ ] Correctly analyzes whichever project is currently open in IntelliJ
- [ ] Handles multiple Spring Boot projects in same IntelliJ window

### 13.3 Quality Acceptance

#### Accuracy
- [ ] No false positives in symbol resolution
- [ ] Correct handling of Java generics (List<T>, Map<K,V>)
- [ ] Proper circular reference detection in DTOs
- [ ] Accurate method override detection
- [ ] Correct @Order annotation parsing for filters

#### Performance in IntelliJ
- [ ] Handles IntelliJ projects with 1000+ Java files
- [ ] First tool call completes within 10 seconds
- [ ] Subsequent calls complete within 5 seconds
- [ ] No memory leaks in long-running IntelliJ sessions
- [ ] Java process properly managed by Node.js

#### Robustness
- [ ] Gracefully handles missing files in IntelliJ project
- [ ] Proper error messages for all failure cases
- [ ] Handles edge cases (empty files, abstract methods, Lombok code)
- [ ] Works with Java 8, 11, 17, 21 syntax
- [ ] Compatible with Spring Boot 2.x and 3.x

#### Usability in IntelliJ
- [ ] All outputs are markdown-formatted and readable
- [ ] File paths are absolute and match IntelliJ's file system
- [ ] Errors are actionable with IntelliJ-specific suggestions
- [ ] No stack traces in Cody chat output
- [ ] Output is concise yet comprehensive

### 13.4 Test Scenarios in IntelliJ

#### Scenario 1: Test Generation in IntelliJ
**Given:** Developer has `UserController.createUser()` method open in IntelliJ  
**When:** Developer selects method and asks Cody "Generate test with 100% coverage"  
**Then:** 
- Cody calls `analyze_controller_method`
- Cody calls `get_dto_structure` for UserRequest
- Cody calls `find_mockable_dependencies` for UserController
- Cody calls `find_execution_branches` for method body
- Test is generated in IntelliJ with:
  - Correct DTO structure instantiation
  - All dependencies mocked (@Mock annotations)
  - All execution branches covered
  - Code compiles in IntelliJ

#### Scenario 2: Bug Fixing in IntelliJ
**Given:** Bug in `POST /api/users` endpoint  
**When:** Developer asks Cody "Why is authentication failing for POST /api/users?"  
**Then:**
- Cody calls `find_controller_for_endpoint` to find handler
- Cody calls `trace_endpoint_to_repository` to see flow
- Cody identifies AuthenticationFilter (Order: 1) runs before controller
- Cody suggests fix in correct location (filter, not controller)
- Developer can click file path to jump to AuthenticationFilter in IntelliJ

#### Scenario 3: Feature Implementation in IntelliJ
**Given:** Need to add new column to fetch-inbound-request table  
**When:** Developer asks Cody "Add ability to fetch by requestId column"  
**Then:**
- Cody calls `find_entity_by_table("fetch_inbound_requests")`
- Cody sees entity structure and relationships
- Cody calls `find_all_usages` for entity
- Cody identifies where data is saved (RequestBodyAdviceAdapter)
- Cody suggests correct implementation location with IntelliJ-compatible file paths
- Developer can navigate to suggested files directly from Cody output

#### Scenario 4: Multi-Module Project in IntelliJ
**Given:** IntelliJ has multi-module Maven project open (common, service, api modules)  
**When:** Developer asks about a class in 'common' module  
**Then:**
- MCP server analyzes entire IntelliJ project structure
- Finds class across all modules
- Traces usages in 'service' and 'api' modules
- Reports which module each file is in

---

## 14. Appendix: References

### 14.1 JavaParser Documentation
- **Official Docs:** https://javaparser.org/
- **API Javadoc:** https://www.javadoc.io/doc/com.github.javaparser/javaparser-core/latest/index.html
- **Symbol Solver Guide:** https://github.com/javaparser/javaparser/wiki/Symbol-solving
- **Examples:** https://github.com/javaparser/javaparser/tree/master/javaparser-core-testing/src/test/java/com/github/javaparser

### 14.2 MCP SDK Documentation
- **Official Spec:** https://spec.modelcontextprotocol.io/
- **TypeScript SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Example Servers:** https://github.com/modelcontextprotocol/servers

### 14.3 Cody for IntelliJ Documentation
- **Cody Plugin:** https://plugins.jetbrains.com/plugin/22637-cody-ai-coding-assistant
- **Cody Documentation:** https://sourcegraph.com/docs/cody
- **MCP Support in Cody:** Check Cody's latest documentation for MCP server configuration

### 14.4 Spring Boot Reference
- **Request Mapping:** https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-requestmapping.html
- **Filters:** https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html
- **Interceptors:** https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html
- **JPA Annotations:** https://docs.spring.io/spring-data/jpa/reference/jpa/getting-started.html

### 14.5 IntelliJ IDEA Documentation
- **Plugin Development:** https://plugins.jetbrains.com/docs/intellij/welcome.html
- **Project Structure:** https://www.jetbrains.com/help/idea/project-structure.html
- **Maven Integration:** https://www.jetbrains.com/help/idea/maven-support.html
- **Gradle Integration:** https://www.jetbrains.com/help/idea/gradle.html

### 14.6 Official Anthropic MCP Servers (for reference)
- **Filesystem:** https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
- **GitHub:** https://github.com/modelcontextprotocol/servers/tree/main/src/github
- **PostgreSQL:** https://github.com/modelcontextprotocol/servers/tree/main/src/postgres
- **Brave Search:** https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search

### 14.7 Related Tools & Libraries
- **Jackson (JSON):** https://github.com/FasterXML/jackson
- **Zod (Validation):** https://zod.dev/
- **Node.js child_process:** https://nodejs.org/api/child_process.html
- **TypeScript:** https://www.typescriptlang.org/

### 14.8 Spring Boot Example Projects (for testing)
- **Spring PetClinic:** https://github.com/spring-projects/spring-petclinic
- **Spring Boot Samples:** https://github.com/spring-projects/spring-boot/tree/main/spring-boot-samples
- **Spring REST Service:** https://spring.io/guides/gs/rest-service/

---

## Document End

**Target Integration:** Cody Plugin for IntelliJ IDEA with MCP Server Support  
**Total Tools Specified:** 16  
**Total Pages:** ~120  
**Last Updated:** December 2024  
**Version:** 1.0

This document provides complete implementation specifications for Claude Code or any agentic AI to implement the Spring Boot MCP servers specifically for use with **Cody plugin in IntelliJ IDEA**. All requirements, architecture, tool specifications, IntelliJ integration details, and configuration instructions are included.

**Next Step:** Begin implementation starting with Phase 1 (Foundation Setup) as detailed in Section 7. The implementation should prioritize seamless integration with IntelliJ IDEA's Cody plugin through proper MCP server configuration and workspace path handling.