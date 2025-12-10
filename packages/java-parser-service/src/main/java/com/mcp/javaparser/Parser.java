package com.mcp.javaparser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.Node;
import com.github.javaparser.ast.body.*;
import com.github.javaparser.ast.expr.*;
import com.github.javaparser.resolution.declarations.ResolvedValueDeclaration;
import com.github.javaparser.symbolsolver.JavaSymbolSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.CombinedTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.JavaParserTypeSolver;
import com.github.javaparser.symbolsolver.resolution.typesolvers.ReflectionTypeSolver;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core parser for analyzing Spring Boot Java projects using JavaParser.
 * Implements all 16 tools across the three MCP servers.
 */
public class Parser {
    private final Path workspaceRoot;
    private final ObjectMapper objectMapper;
    private JavaParser javaParser;
    private Map<String, String> config;

    public Parser(Path workspaceRoot) throws IOException {
        this.workspaceRoot = workspaceRoot;
        this.objectMapper = new ObjectMapper();
        this.config = new HashMap<>();
        initializeJavaParser();
    }

    /**
     * Initialize JavaParser with symbol solver for type resolution
     */
    private void initializeJavaParser() throws IOException {
        CombinedTypeSolver typeSolver = new CombinedTypeSolver();

        // Add reflection type solver for JDK classes
        typeSolver.add(new ReflectionTypeSolver());

        // Add source directory type solver for project classes
        File srcDir = workspaceRoot.resolve("src/main/java").toFile();
        if (srcDir.exists() && srcDir.isDirectory()) {
            typeSolver.add(new JavaParserTypeSolver(srcDir));
        }

        JavaSymbolSolver symbolSolver = new JavaSymbolSolver(typeSolver);
        this.javaParser = new JavaParser();
        this.javaParser.getParserConfiguration().setSymbolResolver(symbolSolver);

        System.err.println("JavaParser initialized with workspace: " + workspaceRoot);
    }

    /**
     * Update configuration from MCP request
     */
    public void updateConfig(JsonNode configNode) {
        if (configNode != null) {
            configNode.fields().forEachRemaining(entry -> {
                config.put(entry.getKey(), entry.getValue().asText());
            });
        }
    }

    // =========================================================================
    // MICRO CONTEXT SERVER TOOLS (Server 1)
    // =========================================================================

    /**
     * Tool 1.1: resolve_symbol
     * Resolves a symbol to its type and declaration location
     */
    public ObjectNode resolveSymbol(JsonNode params) throws Exception {
        String symbolName = params.get("symbolName").asText();
        String contextFile = params.get("contextFile").asText();
        Integer lineNumber = params.has("lineNumber") ? params.get("lineNumber").asInt() : null;

        System.err.println("Resolving symbol: " + symbolName + " in " + contextFile);

        // Parse the context file
        ParseResult<CompilationUnit> parseResult = javaParser.parse(new File(contextFile));

        if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
            throw new Exception("Failed to parse file: " + contextFile);
        }

        CompilationUnit cu = parseResult.getResult().get();

        // Find the symbol in the compilation unit
        Optional<NameExpr> symbolUsage = cu.findAll(NameExpr.class).stream()
                .filter(n -> n.getNameAsString().equals(symbolName))
                .filter(n -> lineNumber == null || isNearLine(n, lineNumber))
                .findFirst();

        if (!symbolUsage.isPresent()) {
            throw new Exception("Symbol '" + symbolName + "' not found in " + contextFile);
        }

        NameExpr nameExpr = symbolUsage.get();

        // Attempt to resolve the symbol
        try {
            ResolvedValueDeclaration resolved = nameExpr.resolve();
            String resolvedType = resolved.getType().describe();

            // Determine if it's a custom class
            boolean isCustomClass = isCustomClass(resolvedType);

            // Get package name
            String packageName = extractPackage(resolvedType);

            // Find the declaration location
            Optional<Node> declaration = findDeclarationNode(cu, symbolName);
            int declLine = declaration.map(n -> n.getBegin().map(pos -> pos.line).orElse(0)).orElse(0);

            // Extract code context (3 lines around the symbol)
            String codeContext = extractCodeContext(contextFile, nameExpr.getBegin().get().line, 1);

            // Find file path for the resolved type
            String filePath = findFilePath(resolvedType);

            // Build response
            ObjectNode result = objectMapper.createObjectNode();
            result.put("symbolName", symbolName);
            result.put("resolvedType", resolvedType);
            result.put("declarationType", getDeclarationType(resolved));
            result.put("filePath", filePath != null ? filePath : contextFile);
            result.put("isCustomClass", isCustomClass);
            result.put("packageName", packageName);

            ObjectNode declLocation = objectMapper.createObjectNode();
            declLocation.put("file", contextFile);
            declLocation.put("line", declLine > 0 ? declLine : nameExpr.getBegin().get().line);
            result.set("declarationLocation", declLocation);

            result.put("codeContext", codeContext);

            return result;

        } catch (Exception e) {
            System.err.println("Failed to resolve symbol: " + e.getMessage());
            throw new Exception("Could not resolve symbol '" + symbolName + "': " + e.getMessage());
        }
    }

    /**
     * Helper: Check if a node is near a specific line number
     */
    private boolean isNearLine(Node node, int targetLine) {
        if (!node.getBegin().isPresent()) return false;
        int nodeLine = node.getBegin().get().line;
        return Math.abs(nodeLine - targetLine) <= 2;
    }

    /**
     * Helper: Determine if a type is a custom class (not from JDK/framework)
     */
    private boolean isCustomClass(String typeName) {
        String packageInclude = config.getOrDefault("packageInclude", "");

        if (packageInclude.isEmpty()) {
            // Heuristic: custom if not from common framework packages
            return !typeName.startsWith("java.") &&
                   !typeName.startsWith("javax.") &&
                   !typeName.startsWith("org.springframework.") &&
                   !typeName.startsWith("org.hibernate.");
        } else {
            // Use configured pattern
            String pattern = packageInclude.replace(".*", "");
            return typeName.startsWith(pattern);
        }
    }

    /**
     * Helper: Extract package from fully qualified type name
     */
    private String extractPackage(String fullyQualifiedType) {
        int lastDot = fullyQualifiedType.lastIndexOf('.');
        return lastDot > 0 ? fullyQualifiedType.substring(0, lastDot) : "";
    }

    /**
     * Helper: Get declaration type (Field, Parameter, Local Variable, etc.)
     */
    private String getDeclarationType(ResolvedValueDeclaration resolved) {
        if (resolved.isField()) return "Field";
        if (resolved.isParameter()) return "Parameter";
        if (resolved.isVariable()) return "Local Variable";
        return "Unknown";
    }

    /**
     * Helper: Find declaration node in compilation unit
     */
    private Optional<Node> findDeclarationNode(CompilationUnit cu, String symbolName) {
        // Look for field declarations
        Optional<FieldDeclaration> field = cu.findAll(FieldDeclaration.class).stream()
                .filter(f -> f.getVariables().stream()
                        .anyMatch(v -> v.getNameAsString().equals(symbolName)))
                .findFirst();

        if (field.isPresent()) return Optional.of(field.get());

        // Look for parameter declarations
        Optional<Parameter> param = cu.findAll(Parameter.class).stream()
                .filter(p -> p.getNameAsString().equals(symbolName))
                .findFirst();

        if (param.isPresent()) return Optional.of(param.get());

        // Look for variable declarations
        Optional<VariableDeclarator> var = cu.findAll(VariableDeclarator.class).stream()
                .filter(v -> v.getNameAsString().equals(symbolName))
                .findFirst();

        return var.map(variableDeclarator -> variableDeclarator);
    }

    /**
     * Helper: Extract code context around a line
     */
    private String extractCodeContext(String filePath, int centerLine, int contextLines) {
        try {
            List<String> allLines = Files.readAllLines(new File(filePath).toPath());
            int startLine = Math.max(0, centerLine - contextLines - 1);
            int endLine = Math.min(allLines.size(), centerLine + contextLines);

            StringBuilder context = new StringBuilder();
            for (int i = startLine; i < endLine; i++) {
                context.append(String.format("%4d: %s\n", i + 1, allLines.get(i)));
            }
            return context.toString().trim();
        } catch (IOException e) {
            return "// Could not read file context";
        }
    }

    /**
     * Helper: Find file path for a resolved type
     */
    private String findFilePath(String fullyQualifiedType) {
        // Convert package.ClassName to path
        String relativePath = fullyQualifiedType.replace('.', '/') + ".java";
        Path fullPath = workspaceRoot.resolve("src/main/java").resolve(relativePath);

        if (Files.exists(fullPath)) {
            return fullPath.toString();
        }

        return null;
    }

    // =========================================================================
    // STUBS FOR OTHER TOOLS (To be implemented in Phase 2+)
    // =========================================================================

    /**
     * Tool 1.2: get_function_definition
     * Returns complete method definition with signature, annotations, parameters, and body
     */
    public ObjectNode getFunctionDefinition(JsonNode params) throws Exception {
        String functionName = params.get("functionName").asText();
        String className = params.get("className").asText();
        String filePath = params.has("filePath") ? params.get("filePath").asText() : null;
        boolean includeBody = params.has("includeBody") ? params.get("includeBody").asBoolean() : true;

        System.err.println("Getting function definition: " + className + "." + functionName);

        // Find the class file
        File classFile = findClassFile(className, filePath);
        if (classFile == null) {
            throw new Exception("Class file not found for: " + className);
        }

        // Parse the file
        ParseResult<CompilationUnit> parseResult = javaParser.parse(classFile);
        if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
            throw new Exception("Failed to parse file: " + classFile.getPath());
        }

        CompilationUnit cu = parseResult.getResult().get();

        // Find all methods with the given name
        List<MethodDeclaration> methods = cu.findAll(MethodDeclaration.class).stream()
                .filter(m -> m.getNameAsString().equals(functionName))
                .collect(Collectors.toList());

        if (methods.isEmpty()) {
            throw new Exception("Method '" + functionName + "' not found in class " + className);
        }

        // Build response
        ObjectNode result = objectMapper.createObjectNode();
        result.put("filePath", classFile.getAbsolutePath());

        // Get class annotations
        ArrayNode classAnnotations = objectMapper.createArrayNode();
        cu.findFirst(ClassOrInterfaceDeclaration.class).ifPresent(cls -> {
            cls.getAnnotations().forEach(ann -> classAnnotations.add(ann.getNameAsString()));
        });
        result.set("classAnnotations", classAnnotations);

        // Process each method (handles overloaded methods)
        ArrayNode methodsArray = objectMapper.createArrayNode();
        for (MethodDeclaration method : methods) {
            ObjectNode methodNode = objectMapper.createObjectNode();

            // Basic info
            methodNode.put("name", method.getNameAsString());
            methodNode.put("visibility", method.getAccessSpecifier().asString());
            methodNode.put("isStatic", method.isStatic());
            methodNode.put("isFinal", method.isFinal());
            methodNode.put("isAbstract", method.isAbstract());
            methodNode.put("isSynchronized", method.isSynchronized());
            methodNode.put("returnType", method.getType().asString());

            // Location
            methodNode.put("startLine", method.getBegin().map(pos -> pos.line).orElse(0));
            methodNode.put("endLine", method.getEnd().map(pos -> pos.line).orElse(0));

            // Annotations
            ArrayNode annotations = objectMapper.createArrayNode();
            method.getAnnotations().forEach(ann -> {
                // Get full annotation string including values
                String annStr = ann.toString().replace("\n", " ").trim();
                annotations.add(annStr);
            });
            methodNode.set("annotations", annotations);

            // Parameters
            ArrayNode parameters = objectMapper.createArrayNode();
            method.getParameters().forEach(param -> {
                ObjectNode paramNode = objectMapper.createObjectNode();
                paramNode.put("name", param.getNameAsString());
                paramNode.put("type", param.getType().asString());

                ArrayNode paramAnnotations = objectMapper.createArrayNode();
                param.getAnnotations().forEach(ann -> {
                    // Get full annotation string including values
                    String annStr = ann.toString().replace("\n", " ").trim();
                    paramAnnotations.add(annStr);
                });
                paramNode.set("annotations", paramAnnotations);

                parameters.add(paramNode);
            });
            methodNode.set("parameters", parameters);

            // Throws exceptions
            ArrayNode throwsExceptions = objectMapper.createArrayNode();
            method.getThrownExceptions().forEach(exc -> {
                throwsExceptions.add(exc.asString());
            });
            methodNode.set("throwsExceptions", throwsExceptions);

            // Method body
            if (includeBody && method.getBody().isPresent()) {
                methodNode.put("body", method.getBody().get().toString());
            }

            // Javadoc
            method.getJavadoc().ifPresent(javadoc -> {
                methodNode.put("javadoc", javadoc.toText());
            });

            methodsArray.add(methodNode);
        }

        result.set("methods", methodsArray);
        return result;
    }

    /**
     * Helper: Find class file by class name
     */
    private File findClassFile(String className, String hintPath) {
        // If hint path provided and exists, use it
        if (hintPath != null) {
            File hintFile = new File(hintPath);
            if (hintFile.exists()) {
                return hintFile;
            }
        }

        // Convert class name to file path
        String relativePath = className.replace('.', '/') + ".java";
        Path fullPath = workspaceRoot.resolve("src/main/java").resolve(relativePath);

        if (Files.exists(fullPath)) {
            return fullPath.toFile();
        }

        // Try to find in any Java source directory
        try {
            Optional<Path> found = Files.walk(workspaceRoot.resolve("src"))
                    .filter(p -> p.toString().endsWith(className.contains(".") ?
                            className.substring(className.lastIndexOf('.') + 1) + ".java" :
                            className + ".java"))
                    .findFirst();

            if (found.isPresent()) {
                return found.get().toFile();
            }
        } catch (IOException e) {
            System.err.println("Error searching for class file: " + e.getMessage());
        }

        return null;
    }

    public ObjectNode getDtoStructure(JsonNode params) {
        return createStubResponse("get_dto_structure", "Phase 2");
    }

    public ObjectNode findExecutionBranches(JsonNode params) {
        return createStubResponse("find_execution_branches", "Phase 2");
    }

    public ObjectNode findMockableDependencies(JsonNode params) {
        return createStubResponse("find_mockable_dependencies", "Phase 2");
    }

    // MACRO CONTEXT SERVER TOOLS (Server 2)
    public ObjectNode buildMethodCallChain(JsonNode params) {
        return createStubResponse("build_method_call_chain", "Phase 3");
    }

    public ObjectNode traceDataTransformation(JsonNode params) {
        return createStubResponse("trace_data_transformation", "Phase 3");
    }

    public ObjectNode findAllUsages(JsonNode params) {
        return createStubResponse("find_all_usages", "Phase 3");
    }

    public ObjectNode traceEndpointToRepository(JsonNode params) {
        return createStubResponse("trace_endpoint_to_repository", "Phase 3");
    }

    public ObjectNode findEntityByTable(JsonNode params) {
        return createStubResponse("find_entity_by_table", "Phase 3");
    }

    public ObjectNode findAdviceAdapters(JsonNode params) {
        return createStubResponse("find_advice_adapters", "Phase 3");
    }

    public ObjectNode findFiltersAndOrder(JsonNode params) {
        return createStubResponse("find_filters_and_order", "Phase 3");
    }

    // SPRING COMPONENT CONTEXT SERVER TOOLS (Server 3)
    public ObjectNode analyzeControllerMethod(JsonNode params) {
        return createStubResponse("analyze_controller_method", "Phase 4");
    }

    public ObjectNode findControllerForEndpoint(JsonNode params) {
        return createStubResponse("find_controller_for_endpoint", "Phase 4");
    }

    public ObjectNode findImplementations(JsonNode params) {
        return createStubResponse("find_implementations", "Phase 4");
    }

    public ObjectNode findFeatureFlagUsage(JsonNode params) {
        return createStubResponse("find_feature_flag_usage", "Phase 4");
    }

    /**
     * Helper: Create stub response for tools not yet implemented
     */
    private ObjectNode createStubResponse(String toolName, String phase) {
        ObjectNode stub = objectMapper.createObjectNode();
        stub.put("status", "not_implemented");
        stub.put("tool", toolName);
        stub.put("message", "This tool will be implemented in " + phase);
        return stub;
    }
}
