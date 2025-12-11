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

    /**
     * Tool 1.3: get_dto_structure
     * Recursively extract DTO/entity structure with fields, annotations, and nested types
     */
    public ObjectNode getDtoStructure(JsonNode params) throws Exception {
        String className = params.get("className").asText();
        String filePath = params.has("filePath") ? params.get("filePath").asText() : null;
        int maxDepth = params.has("maxDepth") ? params.get("maxDepth").asInt() : 10;

        System.err.println("Getting DTO structure for: " + className + " (max depth: " + maxDepth + ")");

        // Track visited classes to prevent infinite recursion
        Set<String> visitedClasses = new HashSet<>();

        // Extract structure recursively
        ObjectNode structure = extractClassStructure(className, filePath, 0, maxDepth, visitedClasses);

        return structure;
    }

    /**
     * Recursively extract class structure
     */
    private ObjectNode extractClassStructure(String className, String filePath, int currentDepth,
                                             int maxDepth, Set<String> visitedClasses) throws Exception {
        ObjectNode result = objectMapper.createObjectNode();

        // Check circular reference
        if (visitedClasses.contains(className)) {
            result.put("className", className);
            result.put("circular", true);
            result.put("message", "Circular reference detected");
            return result;
        }

        // Check max depth
        if (currentDepth >= maxDepth) {
            result.put("className", className);
            result.put("maxDepthReached", true);
            result.put("message", "Maximum depth reached");
            return result;
        }

        // Mark as visited
        visitedClasses.add(className);

        // Find and parse the class file
        File classFile = findClassFile(className, filePath);
        if (classFile == null) {
            // Not a custom class - might be JDK or framework class
            result.put("className", className);
            result.put("isCustomClass", false);
            result.put("packageName", extractPackage(className));
            visitedClasses.remove(className); // Remove so it can be visited in other branches
            return result;
        }

        ParseResult<CompilationUnit> parseResult = javaParser.parse(classFile);
        if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
            throw new Exception("Failed to parse file: " + classFile.getPath());
        }

        CompilationUnit cu = parseResult.getResult().get();

        // Find the class declaration
        Optional<ClassOrInterfaceDeclaration> classDecl = cu.findFirst(ClassOrInterfaceDeclaration.class);
        if (!classDecl.isPresent()) {
            throw new Exception("Class declaration not found in: " + classFile.getPath());
        }

        ClassOrInterfaceDeclaration cls = classDecl.get();

        // Basic information
        result.put("className", className);
        result.put("simpleName", cls.getNameAsString());
        result.put("isInterface", cls.isInterface());
        result.put("isAbstract", cls.isAbstract());
        result.put("filePath", classFile.getAbsolutePath());
        result.put("isCustomClass", true);
        result.put("packageName", cu.getPackageDeclaration().map(p -> p.getNameAsString()).orElse(""));

        // Class type (DTO, Entity, or Regular)
        String classType = determineClassType(cls);
        result.put("classType", classType);

        // Class annotations
        ArrayNode classAnnotations = objectMapper.createArrayNode();
        cls.getAnnotations().forEach(ann -> {
            ObjectNode annNode = objectMapper.createObjectNode();
            annNode.put("name", ann.getNameAsString());
            annNode.put("fullAnnotation", ann.toString().replace("\n", " ").trim());
            classAnnotations.add(annNode);
        });
        result.set("classAnnotations", classAnnotations);

        // Check for Lombok annotations
        boolean hasLombokData = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("Data"));
        boolean hasLombokGetter = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("Getter"));
        boolean hasLombokSetter = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("Setter"));
        boolean hasLombokBuilder = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("Builder"));
        boolean hasLombokAllArgsConstructor = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("AllArgsConstructor"));
        boolean hasLombokNoArgsConstructor = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("NoArgsConstructor"));

        ObjectNode lombokInfo = objectMapper.createObjectNode();
        lombokInfo.put("hasData", hasLombokData);
        lombokInfo.put("hasGetter", hasLombokGetter);
        lombokInfo.put("hasSetter", hasLombokSetter);
        lombokInfo.put("hasBuilder", hasLombokBuilder);
        lombokInfo.put("hasAllArgsConstructor", hasLombokAllArgsConstructor);
        lombokInfo.put("hasNoArgsConstructor", hasLombokNoArgsConstructor);
        result.set("lombokAnnotations", lombokInfo);

        // Extract fields
        ArrayNode fields = objectMapper.createArrayNode();
        List<FieldDeclaration> fieldDeclarations = cls.findAll(FieldDeclaration.class);

        for (FieldDeclaration field : fieldDeclarations) {
            // Skip static fields
            if (field.isStatic()) continue;

            for (VariableDeclarator variable : field.getVariables()) {
                ObjectNode fieldNode = objectMapper.createObjectNode();

                String fieldName = variable.getNameAsString();
                String fieldType = variable.getType().asString();

                fieldNode.put("name", fieldName);
                fieldNode.put("type", fieldType);
                fieldNode.put("isFinal", field.isFinal());
                fieldNode.put("visibility", field.getAccessSpecifier().asString());

                // Field annotations
                ArrayNode fieldAnnotations = objectMapper.createArrayNode();
                field.getAnnotations().forEach(ann -> {
                    ObjectNode annNode = objectMapper.createObjectNode();
                    annNode.put("name", ann.getNameAsString());
                    annNode.put("fullAnnotation", ann.toString().replace("\n", " ").trim());

                    // Parse validation annotation details
                    if (isValidationAnnotation(ann.getNameAsString())) {
                        annNode.put("isValidation", true);
                    }

                    fieldAnnotations.add(annNode);
                });
                fieldNode.set("annotations", fieldAnnotations);

                // Detect collection types
                ObjectNode typeInfo = analyzeFieldType(fieldType);
                fieldNode.set("typeInfo", typeInfo);

                // Recursively extract nested type structure if it's a custom class
                String baseType = typeInfo.get("baseType").asText();
                if (isCustomClass(baseType) && currentDepth < maxDepth - 1) {
                    ObjectNode nestedStructure = extractClassStructure(
                            baseType, null, currentDepth + 1, maxDepth, visitedClasses
                    );
                    fieldNode.set("nestedStructure", nestedStructure);
                }

                // If it's a collection, also extract the element type structure
                if (typeInfo.get("isCollection").asBoolean() && typeInfo.has("elementType")) {
                    String elementType = typeInfo.get("elementType").asText();
                    if (isCustomClass(elementType) && currentDepth < maxDepth - 1) {
                        ObjectNode elementStructure = extractClassStructure(
                                elementType, null, currentDepth + 1, maxDepth, visitedClasses
                        );
                        fieldNode.set("elementStructure", elementStructure);
                    }
                }

                // If it's a map, extract both key and value type structures
                if (typeInfo.get("isMap").asBoolean()) {
                    if (typeInfo.has("keyType")) {
                        String keyType = typeInfo.get("keyType").asText();
                        if (isCustomClass(keyType) && currentDepth < maxDepth - 1) {
                            ObjectNode keyStructure = extractClassStructure(
                                    keyType, null, currentDepth + 1, maxDepth, visitedClasses
                            );
                            fieldNode.set("keyStructure", keyStructure);
                        }
                    }
                    if (typeInfo.has("valueType")) {
                        String valueType = typeInfo.get("valueType").asText();
                        if (isCustomClass(valueType) && currentDepth < maxDepth - 1) {
                            ObjectNode valueStructure = extractClassStructure(
                                    valueType, null, currentDepth + 1, maxDepth, visitedClasses
                            );
                            fieldNode.set("valueStructure", valueStructure);
                        }
                    }
                }

                fields.add(fieldNode);
            }
        }

        result.set("fields", fields);

        // Remove from visited set to allow visiting in other branches
        visitedClasses.remove(className);

        return result;
    }

    /**
     * Determine if a class is a DTO, Entity, or regular class
     */
    private String determineClassType(ClassOrInterfaceDeclaration cls) {
        // Check for Entity annotations
        boolean hasEntity = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("Entity"));

        boolean hasTable = cls.getAnnotations().stream()
                .anyMatch(ann -> ann.getNameAsString().equals("Table"));

        if (hasEntity || hasTable) {
            return "Entity";
        }

        // Check if in DTO packages (from config)
        String dtoPackages = config.getOrDefault("dtoPackages", "");
        if (!dtoPackages.isEmpty()) {
            // Simple heuristic: if package name contains "dto" or "model"
            String packageName = cls.findCompilationUnit()
                    .flatMap(cu -> cu.getPackageDeclaration())
                    .map(pd -> pd.getNameAsString())
                    .orElse("");

            if (packageName.contains("dto") || packageName.contains("model")) {
                return "DTO";
            }
        }

        // Default
        return "Regular";
    }

    /**
     * Analyze field type to determine if it's a collection, map, or simple type
     */
    private ObjectNode analyzeFieldType(String fieldType) {
        ObjectNode typeInfo = objectMapper.createObjectNode();

        typeInfo.put("rawType", fieldType);

        // Check for Collection types
        boolean isList = fieldType.startsWith("List<") || fieldType.startsWith("ArrayList<");
        boolean isSet = fieldType.startsWith("Set<") || fieldType.startsWith("HashSet<") ||
                       fieldType.startsWith("TreeSet<") || fieldType.startsWith("LinkedHashSet<");
        boolean isCollection = fieldType.startsWith("Collection<");
        boolean isMap = fieldType.startsWith("Map<") || fieldType.startsWith("HashMap<") ||
                       fieldType.startsWith("TreeMap<") || fieldType.startsWith("LinkedHashMap<");

        typeInfo.put("isList", isList);
        typeInfo.put("isSet", isSet);
        typeInfo.put("isCollection", isCollection || isList || isSet);
        typeInfo.put("isMap", isMap);

        // Extract generic type parameters
        if (isList || isSet || isCollection) {
            String elementType = extractGenericType(fieldType);
            typeInfo.put("elementType", elementType);
            typeInfo.put("baseType", elementType);
        } else if (isMap) {
            String[] types = extractMapTypes(fieldType);
            if (types.length >= 2) {
                typeInfo.put("keyType", types[0]);
                typeInfo.put("valueType", types[1]);
                typeInfo.put("baseType", types[1]); // Use value type as base
            }
        } else {
            // Simple type
            typeInfo.put("baseType", fieldType);
        }

        // Check if primitive
        boolean isPrimitive = isPrimitiveType(fieldType);
        typeInfo.put("isPrimitive", isPrimitive);

        return typeInfo;
    }

    /**
     * Extract generic type from List<T>, Set<T>, etc.
     */
    private String extractGenericType(String typeWithGenerics) {
        int start = typeWithGenerics.indexOf('<');
        int end = typeWithGenerics.lastIndexOf('>');
        if (start > 0 && end > start) {
            return typeWithGenerics.substring(start + 1, end).trim();
        }
        return typeWithGenerics;
    }

    /**
     * Extract key and value types from Map<K, V>
     */
    private String[] extractMapTypes(String mapType) {
        int start = mapType.indexOf('<');
        int end = mapType.lastIndexOf('>');
        if (start > 0 && end > start) {
            String generics = mapType.substring(start + 1, end).trim();
            // Simple split by comma (doesn't handle nested generics perfectly, but good enough)
            String[] parts = generics.split(",");
            if (parts.length >= 2) {
                return new String[]{parts[0].trim(), parts[1].trim()};
            }
        }
        return new String[]{};
    }

    /**
     * Check if a type is a Java primitive
     */
    private boolean isPrimitiveType(String type) {
        return type.equals("int") || type.equals("long") || type.equals("double") ||
               type.equals("float") || type.equals("boolean") || type.equals("char") ||
               type.equals("byte") || type.equals("short") ||
               type.equals("Integer") || type.equals("Long") || type.equals("Double") ||
               type.equals("Float") || type.equals("Boolean") || type.equals("Character") ||
               type.equals("Byte") || type.equals("Short") || type.equals("String");
    }

    /**
     * Check if an annotation is a validation annotation
     */
    private boolean isValidationAnnotation(String annotationName) {
        return annotationName.equals("NotNull") || annotationName.equals("NotEmpty") ||
               annotationName.equals("NotBlank") || annotationName.equals("Size") ||
               annotationName.equals("Min") || annotationName.equals("Max") ||
               annotationName.equals("Email") || annotationName.equals("Pattern") ||
               annotationName.equals("Valid") || annotationName.equals("Validated") ||
               annotationName.equals("Past") || annotationName.equals("Future") ||
               annotationName.equals("Positive") || annotationName.equals("Negative");
    }

    /**
     * Tool 1.4: find_execution_branches
     * Analyzes all execution paths in a method for test coverage
     */
    public ObjectNode findExecutionBranches(JsonNode params) throws Exception {
        String methodCode = params.get("methodCode").asText();
        String className = params.has("className") ? params.get("className").asText() : "UnknownClass";
        String methodName = params.has("methodName") ? params.get("methodName").asText() : "method";

        System.err.println("Analyzing execution branches for: " + methodName);

        // Parse the method code
        com.github.javaparser.ast.body.MethodDeclaration method = parseMethod(methodCode);

        if (method == null) {
            throw new Exception("Failed to parse method code");
        }

        // Analyze branches
        BranchAnalyzer analyzer = new BranchAnalyzer();
        method.accept(analyzer, null);

        // Calculate cyclomatic complexity: decision points + 1
        int cyclomaticComplexity = analyzer.getDecisionPoints() + 1;

        // Build result
        ObjectNode result = objectMapper.createObjectNode();
        result.put("totalBranches", analyzer.getBranches().size());
        result.put("cyclomaticComplexity", cyclomaticComplexity);
        result.put("maxNestingDepth", analyzer.getMaxNestingDepth());
        result.put("totalPaths", analyzer.getTotalPaths());

        // Determine complexity level
        String complexityLevel;
        if (cyclomaticComplexity <= 5) {
            complexityLevel = "Low";
        } else if (cyclomaticComplexity <= 10) {
            complexityLevel = "Moderate";
        } else {
            complexityLevel = "High";
        }
        result.put("complexityLevel", complexityLevel);

        // Add branch details
        ArrayNode branches = objectMapper.createArrayNode();
        for (BranchInfo branch : analyzer.getBranches()) {
            ObjectNode branchNode = objectMapper.createObjectNode();
            branchNode.put("lineNumber", branch.lineNumber);
            branchNode.put("type", branch.type);
            branchNode.put("description", branch.description);
            branchNode.put("codeSnippet", branch.codeSnippet);
            branchNode.put("pathCount", branch.pathCount);

            ArrayNode paths = objectMapper.createArrayNode();
            for (String path : branch.paths) {
                paths.add(path);
            }
            branchNode.set("paths", paths);
            branchNode.put("nestingLevel", branch.nestingLevel);

            branches.add(branchNode);
        }
        result.set("branches", branches);

        // Generate test recommendations
        ArrayNode testRecommendations = objectMapper.createArrayNode();
        int testNumber = 1;

        for (BranchInfo branch : analyzer.getBranches()) {
            for (String path : branch.paths) {
                ObjectNode testNode = objectMapper.createObjectNode();

                // Generate test method name
                String testMethodName = generateTestMethodName(methodName, branch.type, path, testNumber);
                testNode.put("testMethodName", testMethodName);

                // Generate description and scenario
                String description = generateTestDescription(branch, path);
                String scenario = generateTestScenario(branch, path);

                testNode.put("description", description);
                testNode.put("scenario", scenario);

                ArrayNode coversBranches = objectMapper.createArrayNode();
                coversBranches.add("Branch at line " + branch.lineNumber + " (" + path + ")");
                testNode.set("coversBranches", coversBranches);

                testRecommendations.add(testNode);
                testNumber++;
            }
        }

        result.set("testRecommendations", testRecommendations);
        result.put("minimumTests", testRecommendations.size());

        return result;
    }

    /**
     * Parse method code into MethodDeclaration
     */
    private com.github.javaparser.ast.body.MethodDeclaration parseMethod(String methodCode) {
        try {
            // Try parsing as a complete method
            String wrappedCode = "class Wrapper { " + methodCode + " }";
            ParseResult<CompilationUnit> parseResult = javaParser.parse(wrappedCode);

            if (parseResult.isSuccessful() && parseResult.getResult().isPresent()) {
                CompilationUnit cu = parseResult.getResult().get();
                Optional<MethodDeclaration> methodOpt = cu.findFirst(MethodDeclaration.class);
                if (methodOpt.isPresent()) {
                    return methodOpt.get();
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse method: " + e.getMessage());
        }
        return null;
    }

    /**
     * Generate test method name following convention: method_when_then
     */
    private String generateTestMethodName(String methodName, String branchType, String path, int testNumber) {
        String cleanPath = path.toLowerCase()
                .replace(" ", "_")
                .replace("-", "_")
                .replaceAll("[^a-z0-9_]", "");

        return methodName + "_when_" + cleanPath + "_test" + testNumber;
    }

    /**
     * Generate test description
     */
    private String generateTestDescription(BranchInfo branch, String path) {
        return "Test " + branch.type + " branch: " + path;
    }

    /**
     * Generate test scenario description
     */
    private String generateTestScenario(BranchInfo branch, String path) {
        return "Verify behavior when " + path + " at line " + branch.lineNumber;
    }

    /**
     * Branch information holder
     */
    private static class BranchInfo {
        int lineNumber;
        String type;
        String description;
        String codeSnippet;
        int pathCount;
        List<String> paths;
        int nestingLevel;

        BranchInfo(int lineNumber, String type, String description, String codeSnippet,
                   List<String> paths, int nestingLevel) {
            this.lineNumber = lineNumber;
            this.type = type;
            this.description = description;
            this.codeSnippet = codeSnippet;
            this.pathCount = paths.size();
            this.paths = paths;
            this.nestingLevel = nestingLevel;
        }
    }

    /**
     * AST Visitor to analyze execution branches
     */
    private class BranchAnalyzer extends com.github.javaparser.ast.visitor.VoidVisitorAdapter<Void> {
        private List<BranchInfo> branches = new ArrayList<>();
        private int decisionPoints = 0;
        private int maxNestingDepth = 0;
        private int currentNestingDepth = 0;
        private int totalPaths = 1;

        @Override
        public void visit(com.github.javaparser.ast.stmt.IfStmt n, Void arg) {
            currentNestingDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth);

            decisionPoints++;
            totalPaths++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            String codeSnippet = n.getCondition().toString();

            List<String> paths = new ArrayList<>();
            paths.add("condition is true");
            paths.add("condition is false");

            // If there's an else branch, note it
            if (n.getElseStmt().isPresent()) {
                paths.set(1, "else branch");
            }

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "if-else",
                    "Conditional statement",
                    "if (" + codeSnippet + ")",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
            currentNestingDepth--;
        }

        @Override
        public void visit(com.github.javaparser.ast.stmt.SwitchStmt n, Void arg) {
            currentNestingDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth);

            decisionPoints++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            String codeSnippet = n.getSelector().toString();

            int caseCount = n.getEntries().size();
            totalPaths += caseCount - 1; // -1 because we already count 1 in initial totalPaths

            List<String> paths = new ArrayList<>();
            for (int i = 0; i < caseCount; i++) {
                paths.add("case " + (i + 1));
            }

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "switch",
                    "Switch statement with " + caseCount + " cases",
                    "switch (" + codeSnippet + ")",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
            currentNestingDepth--;
        }

        @Override
        public void visit(com.github.javaparser.ast.stmt.TryStmt n, Void arg) {
            currentNestingDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth);

            decisionPoints++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            int catchCount = n.getCatchClauses().size();
            totalPaths += catchCount; // Each catch is a new path

            List<String> paths = new ArrayList<>();
            paths.add("try block succeeds");
            for (int i = 0; i < catchCount; i++) {
                String exceptionType = n.getCatchClauses().get(i).getParameter().getType().asString();
                paths.add("catch " + exceptionType);
            }
            if (n.getFinallyBlock().isPresent()) {
                paths.add("finally block");
            }

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "try-catch",
                    "Exception handling with " + catchCount + " catch block(s)",
                    "try { ... }",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
            currentNestingDepth--;
        }

        @Override
        public void visit(com.github.javaparser.ast.stmt.ForStmt n, Void arg) {
            currentNestingDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth);

            decisionPoints++;
            totalPaths++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            String codeSnippet = n.getCompare().map(Object::toString).orElse("condition");

            List<String> paths = new ArrayList<>();
            paths.add("loop executes");
            paths.add("loop skipped (condition false)");

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "for-loop",
                    "For loop",
                    "for (...; " + codeSnippet + "; ...)",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
            currentNestingDepth--;
        }

        @Override
        public void visit(com.github.javaparser.ast.stmt.WhileStmt n, Void arg) {
            currentNestingDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth);

            decisionPoints++;
            totalPaths++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            String codeSnippet = n.getCondition().toString();

            List<String> paths = new ArrayList<>();
            paths.add("loop executes");
            paths.add("loop skipped (condition false)");

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "while-loop",
                    "While loop",
                    "while (" + codeSnippet + ")",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
            currentNestingDepth--;
        }

        @Override
        public void visit(com.github.javaparser.ast.stmt.ForEachStmt n, Void arg) {
            currentNestingDepth++;
            maxNestingDepth = Math.max(maxNestingDepth, currentNestingDepth);

            decisionPoints++;
            totalPaths++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            String variable = n.getVariable().toString();
            String iterable = n.getIterable().toString();

            List<String> paths = new ArrayList<>();
            paths.add("collection has elements");
            paths.add("collection is empty");

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "for-each-loop",
                    "Enhanced for loop",
                    "for (" + variable + " : " + iterable + ")",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
            currentNestingDepth--;
        }

        @Override
        public void visit(com.github.javaparser.ast.expr.ConditionalExpr n, Void arg) {
            decisionPoints++;
            totalPaths++;

            int lineNumber = n.getBegin().map(pos -> pos.line).orElse(0);
            String condition = n.getCondition().toString();

            List<String> paths = new ArrayList<>();
            paths.add("ternary true");
            paths.add("ternary false");

            BranchInfo branch = new BranchInfo(
                    lineNumber,
                    "ternary",
                    "Ternary operator",
                    condition + " ? ... : ...",
                    paths,
                    currentNestingDepth
            );

            branches.add(branch);

            super.visit(n, arg);
        }

        public List<BranchInfo> getBranches() {
            return branches;
        }

        public int getDecisionPoints() {
            return decisionPoints;
        }

        public int getMaxNestingDepth() {
            return maxNestingDepth;
        }

        public int getTotalPaths() {
            return totalPaths;
        }
    }

    /**
     * Tool 1.5: find_mockable_dependencies
     * Identifies all dependencies that should be mocked in unit tests
     */
    public ObjectNode findMockableDependencies(JsonNode params) throws Exception {
        String className = params.get("className").asText();
        String filePath = params.has("filePath") ? params.get("filePath").asText() : null;
        boolean includeMethodParams = params.has("includeMethodParams") ?
                params.get("includeMethodParams").asBoolean() : false;

        System.err.println("Finding mockable dependencies for: " + className);

        // Find and parse the class file
        File classFile = findClassFile(className, filePath);
        if (classFile == null) {
            throw new Exception("Class file not found for: " + className);
        }

        ParseResult<CompilationUnit> parseResult = javaParser.parse(classFile);
        if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
            throw new Exception("Failed to parse file: " + classFile.getPath());
        }

        CompilationUnit cu = parseResult.getResult().get();

        // Find the class declaration
        Optional<ClassOrInterfaceDeclaration> classDecl = cu.findFirst(ClassOrInterfaceDeclaration.class);
        if (!classDecl.isPresent()) {
            throw new Exception("Class declaration not found in: " + classFile.getPath());
        }

        ClassOrInterfaceDeclaration cls = classDecl.get();

        // Build result
        ObjectNode result = objectMapper.createObjectNode();
        result.put("simpleName", cls.getNameAsString());
        result.put("filePath", classFile.getAbsolutePath());

        // Determine class type
        String classType = determineClassType(cls);
        result.put("classType", classType);

        // Find @Autowired dependencies
        ArrayNode autowiredDeps = objectMapper.createArrayNode();
        List<FieldDeclaration> fields = cls.findAll(FieldDeclaration.class);

        for (FieldDeclaration field : fields) {
            // Check if field has @Autowired annotation
            boolean hasAutowired = field.getAnnotations().stream()
                    .anyMatch(ann -> ann.getNameAsString().equals("Autowired"));

            if (hasAutowired) {
                for (VariableDeclarator variable : field.getVariables()) {
                    ObjectNode depNode = objectMapper.createObjectNode();

                    String depName = variable.getNameAsString();
                    String depType = variable.getType().asString();

                    depNode.put("name", depName);
                    depNode.put("type", depType);

                    // Find file path for dependency
                    String depFilePath = findFilePath(depType);
                    if (depFilePath != null) {
                        depNode.put("filePath", depFilePath);
                    }

                    // Determine dependency type
                    String dependencyType = determineDependencyType(depType, field);
                    depNode.put("dependencyType", dependencyType);

                    // Check if custom class
                    boolean isCustomClass = isCustomClass(depType);
                    depNode.put("isCustomClass", isCustomClass);

                    // Determine mock strategy
                    MockStrategy strategy = determineMockStrategy(depType, isCustomClass, dependencyType);
                    depNode.put("mockStrategy", strategy.strategy);
                    depNode.put("reason", strategy.reason);

                    autowiredDeps.add(depNode);
                }
            }
        }

        result.set("autowiredDependencies", autowiredDeps);

        // Find constructor injection
        ArrayNode constructorDeps = objectMapper.createArrayNode();
        Optional<ConstructorDeclaration> constructor = cls.findFirst(ConstructorDeclaration.class);

        if (constructor.isPresent()) {
            for (Parameter param : constructor.get().getParameters()) {
                ObjectNode depNode = objectMapper.createObjectNode();

                String paramName = param.getNameAsString();
                String paramType = param.getType().asString();

                depNode.put("name", paramName);
                depNode.put("type", paramType);

                // Find file path for dependency
                String depFilePath = findFilePath(paramType);
                if (depFilePath != null) {
                    depNode.put("filePath", depFilePath);
                }

                // Check if custom class
                boolean isCustomClass = isCustomClass(paramType);
                depNode.put("isCustomClass", isCustomClass);

                // Determine dependency type
                String dependencyType = determineDependencyTypeFromParam(paramType);

                // Determine mock strategy
                MockStrategy strategy = determineMockStrategy(paramType, isCustomClass, dependencyType);
                depNode.put("mockStrategy", strategy.strategy);
                depNode.put("reason", strategy.reason);

                constructorDeps.add(depNode);
            }
        }

        result.set("constructorDependencies", constructorDeps);

        // Summary
        int totalDeps = autowiredDeps.size() + constructorDeps.size();
        int depsToMock = 0;

        // Count dependencies that should be mocked
        for (int i = 0; i < autowiredDeps.size(); i++) {
            if (autowiredDeps.get(i).get("mockStrategy").asText().equals("Mock") ||
                autowiredDeps.get(i).get("mockStrategy").asText().equals("Spy")) {
                depsToMock++;
            }
        }
        for (int i = 0; i < constructorDeps.size(); i++) {
            if (constructorDeps.get(i).get("mockStrategy").asText().equals("Mock") ||
                constructorDeps.get(i).get("mockStrategy").asText().equals("Spy")) {
                depsToMock++;
            }
        }

        result.put("totalDependencies", totalDeps);
        result.put("dependenciesToMock", depsToMock);

        // File references
        ArrayNode fileRefs = objectMapper.createArrayNode();
        fileRefs.add(classFile.getAbsolutePath());

        for (int i = 0; i < autowiredDeps.size(); i++) {
            if (autowiredDeps.get(i).has("filePath")) {
                fileRefs.add(autowiredDeps.get(i).get("filePath").asText());
            }
        }
        for (int i = 0; i < constructorDeps.size(); i++) {
            if (constructorDeps.get(i).has("filePath")) {
                fileRefs.add(constructorDeps.get(i).get("filePath").asText());
            }
        }

        result.set("fileReferences", fileRefs);

        return result;
    }

    /**
     * Determine dependency type from field
     */
    private String determineDependencyType(String typeName, FieldDeclaration field) {
        // Check if it's a repository
        if (typeName.contains("Repository") || typeName.endsWith("Repo")) {
            return "Repository";
        }

        // Check if it's a service
        if (typeName.contains("Service")) {
            return "Service";
        }

        // Check for common external dependencies
        if (typeName.startsWith("RestTemplate") || typeName.startsWith("WebClient") ||
            typeName.contains("Client") || typeName.contains("Api")) {
            return "External";
        }

        return "Other";
    }

    /**
     * Determine dependency type from parameter type
     */
    private String determineDependencyTypeFromParam(String typeName) {
        if (typeName.contains("Repository") || typeName.endsWith("Repo")) {
            return "Repository";
        }
        if (typeName.contains("Service")) {
            return "Service";
        }
        if (typeName.contains("Client") || typeName.contains("Api")) {
            return "External";
        }
        return "Other";
    }

    /**
     * Determine mock strategy for a dependency
     */
    private MockStrategy determineMockStrategy(String typeName, boolean isCustomClass, String dependencyType) {
        // Framework classes or primitives - use real instances
        if (!isCustomClass || isPrimitiveType(typeName)) {
            return new MockStrategy("Real", "Framework class or primitive type");
        }

        // Services and Repositories - always mock
        if (dependencyType.equals("Service") || dependencyType.equals("Repository")) {
            return new MockStrategy("Mock", "Custom " + dependencyType + " should be mocked");
        }

        // External APIs - always mock
        if (dependencyType.equals("External")) {
            return new MockStrategy("Mock", "External dependency should be mocked");
        }

        // DTOs and POJOs - use real instances
        if (typeName.endsWith("DTO") || typeName.endsWith("Request") ||
            typeName.endsWith("Response") || typeName.endsWith("Model")) {
            return new MockStrategy("Real", "POJO/DTO - use real instance");
        }

        // Default: mock custom classes
        return new MockStrategy("Mock", "Custom class dependency");
    }

    /**
     * Mock strategy holder
     */
    private static class MockStrategy {
        String strategy;
        String reason;

        MockStrategy(String strategy, String reason) {
            this.strategy = strategy;
            this.reason = reason;
        }
    }

    // MACRO CONTEXT SERVER TOOLS (Server 2)
    /**
     * Tool 2.1: build_method_call_chain
     * Builds complete call chain from a method to all nested method calls
     */
    public ObjectNode buildMethodCallChain(JsonNode params) throws Exception {
        String className = params.get("className").asText();
        String methodName = params.get("methodName").asText();
        int maxDepth = params.has("maxDepth") ? params.get("maxDepth").asInt() : 15;

        List<String> stopAtPackages = new ArrayList<>();
        if (params.has("stopAtPackages")) {
            params.get("stopAtPackages").forEach(node -> stopAtPackages.add(node.asText()));
        } else {
            // Default stop packages
            stopAtPackages.addAll(Arrays.asList(
                    "java.*", "javax.*", "org.springframework.*",
                    "org.hibernate.*", "org.apache.*"
            ));
        }

        System.err.println("Building call chain for: " + className + "." + methodName);

        // Find and parse the class file
        File classFile = findClassFile(className, null);
        if (classFile == null) {
            throw new Exception("Class file not found for: " + className);
        }

        ParseResult<CompilationUnit> parseResult = javaParser.parse(classFile);
        if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
            throw new Exception("Failed to parse file: " + classFile.getPath());
        }

        CompilationUnit cu = parseResult.getResult().get();

        // Find the method
        List<MethodDeclaration> methods = cu.findAll(MethodDeclaration.class).stream()
                .filter(m -> m.getNameAsString().equals(methodName))
                .collect(Collectors.toList());

        if (methods.isEmpty()) {
            throw new Exception("Method '" + methodName + "' not found in class " + className);
        }

        MethodDeclaration entryMethod = methods.get(0); // Take first if overloaded

        // Build result
        ObjectNode result = objectMapper.createObjectNode();

        // Entry point
        ObjectNode entryPoint = objectMapper.createObjectNode();
        entryPoint.put("fullSignature", className + "." + methodName + "()");
        entryPoint.put("file", classFile.getAbsolutePath());
        entryPoint.put("line", entryMethod.getBegin().map(pos -> pos.line).orElse(0));
        result.set("entryPoint", entryPoint);

        // Build call chain
        Set<String> visited = new HashSet<>();
        List<CallInfo> callChain = new ArrayList<>();
        Set<String> leafMethods = new HashSet<>();
        Set<String> frameworkBoundaries = new HashSet<>();
        Set<String> fileReferences = new HashSet<>();
        fileReferences.add(classFile.getAbsolutePath());

        // Traverse calls
        traverseMethodCalls(entryMethod, className, methodName, 0, maxDepth,
                stopAtPackages, visited, callChain, leafMethods,
                frameworkBoundaries, fileReferences);

        // Format call chain
        ArrayNode callChainArray = objectMapper.createArrayNode();
        for (CallInfo call : callChain) {
            ObjectNode callNode = objectMapper.createObjectNode();
            callNode.put("depth", call.depth);
            callNode.put("layerName", getLayerName(call.depth));
            callNode.put("caller", call.caller);
            callNode.put("callee", call.callee);
            callNode.put("file", call.file);
            callNode.put("line", call.line);
            callNode.put("callType", call.callType);
            callNode.put("package", call.packageName);
            callNode.put("stoppedAtFramework", call.stoppedAtFramework);
            if (call.stoppedAtFramework) {
                callNode.put("frameworkName", call.frameworkName);
            }
            callChainArray.add(callNode);
        }
        result.set("callChain", callChainArray);

        // Leaf methods
        ArrayNode leafMethodsArray = objectMapper.createArrayNode();
        for (String leaf : leafMethods) {
            ObjectNode leafNode = objectMapper.createObjectNode();
            leafNode.put("signature", leaf);
            leafNode.put("file", "");
            leafNode.put("line", 0);
            leafMethodsArray.add(leafNode);
        }
        result.set("leafMethods", leafMethodsArray);

        // Framework boundaries
        ArrayNode boundariesArray = objectMapper.createArrayNode();
        for (String boundary : frameworkBoundaries) {
            String[] parts = boundary.split("\\.");
            ObjectNode boundaryNode = objectMapper.createObjectNode();
            boundaryNode.put("className", parts.length > 1 ? parts[parts.length - 2] : "");
            boundaryNode.put("methodName", parts.length > 0 ? parts[parts.length - 1] : "");
            boundaryNode.put("package", boundary);
            boundaryNode.put("depth", 0);
            boundariesArray.add(boundaryNode);
        }
        result.set("frameworkBoundaries", boundariesArray);

        // Call graph (simple text visualization)
        String callGraph = buildCallGraphText(className + "." + methodName, callChain, 0);
        result.put("callGraph", callGraph);

        // Summary
        result.put("totalCalls", callChain.size());
        result.put("maxDepth", callChain.stream().mapToInt(c -> c.depth).max().orElse(0));

        // File references
        ArrayNode fileRefsArray = objectMapper.createArrayNode();
        fileReferences.forEach(fileRefsArray::add);
        result.set("fileReferences", fileRefsArray);

        return result;
    }

    /**
     * Recursively traverse method calls
     */
    private void traverseMethodCalls(MethodDeclaration method, String currentClass,
                                     String currentMethod, int depth, int maxDepth,
                                     List<String> stopAtPackages, Set<String> visited,
                                     List<CallInfo> callChain, Set<String> leafMethods,
                                     Set<String> frameworkBoundaries, Set<String> fileReferences) {
        if (depth >= maxDepth) {
            return;
        }

        String methodKey = currentClass + "." + currentMethod;
        if (visited.contains(methodKey)) {
            return; // Avoid infinite recursion
        }
        visited.add(methodKey);

        if (!method.getBody().isPresent()) {
            leafMethods.add(methodKey);
            return;
        }

        // Find all method calls in this method
        List<MethodCallExpr> methodCalls = method.getBody().get().findAll(MethodCallExpr.class);

        if (methodCalls.isEmpty()) {
            leafMethods.add(methodKey);
            return;
        }

        for (MethodCallExpr call : methodCalls) {
            String calledMethod = call.getNameAsString();
            String calledClass = "Unknown";
            String packageName = "";

            // Try to resolve the called method
            try {
                // Simple heuristic: check if it's a framework call
                boolean isFramework = false;
                for (String pattern : stopAtPackages) {
                    String patternPrefix = pattern.replace(".*", "");
                    if (calledMethod.startsWith(patternPrefix)) {
                        isFramework = true;
                        frameworkBoundaries.add(calledMethod);
                        break;
                    }
                }

                CallInfo callInfo = new CallInfo();
                callInfo.depth = depth + 1;
                callInfo.caller = currentClass + "." + currentMethod;
                callInfo.callee = calledClass + "." + calledMethod;
                callInfo.file = method.findCompilationUnit()
                        .flatMap(cu -> cu.getStorage())
                        .map(storage -> storage.getPath().toString())
                        .orElse("");
                callInfo.line = call.getBegin().map(pos -> pos.line).orElse(0);
                callInfo.callType = "Direct";
                callInfo.packageName = packageName;
                callInfo.stoppedAtFramework = isFramework;
                callInfo.frameworkName = isFramework ? "Framework" : "";

                callChain.add(callInfo);

                if (!isFramework) {
                    // Recursively traverse (simplified - would need to find and parse the called method)
                    // For now, we just record the call
                }
            } catch (Exception e) {
                // Couldn't resolve, just record the call
                CallInfo callInfo = new CallInfo();
                callInfo.depth = depth + 1;
                callInfo.caller = currentClass + "." + currentMethod;
                callInfo.callee = calledMethod;
                callInfo.file = "";
                callInfo.line = call.getBegin().map(pos -> pos.line).orElse(0);
                callInfo.callType = "Unknown";
                callInfo.packageName = "";
                callInfo.stoppedAtFramework = false;

                callChain.add(callInfo);
            }
        }
    }

    /**
     * Get layer name for depth
     */
    private String getLayerName(int depth) {
        switch (depth) {
            case 1: return "Service Layer";
            case 2: return "Repository/DAO Layer";
            case 3: return "Framework Layer";
            default: return "Layer " + depth;
        }
    }

    /**
     * Build ASCII call graph
     */
    private String buildCallGraphText(String entryPoint, List<CallInfo> calls, int depth) {
        StringBuilder graph = new StringBuilder();
        graph.append(entryPoint).append("\n");

        Map<Integer, List<CallInfo>> byDepth = calls.stream()
                .collect(Collectors.groupingBy(c -> c.depth));

        for (int d = 1; d <= byDepth.keySet().stream().max(Integer::compareTo).orElse(0); d++) {
            List<CallInfo> depthCalls = byDepth.get(d);
            if (depthCalls != null) {
                for (int i = 0; i < depthCalls.size(); i++) {
                    CallInfo call = depthCalls.get(i);
                    String prefix = "├── ";
                    if (i == depthCalls.size() - 1) {
                        prefix = "└── ";
                    }
                    graph.append(prefix).append(call.callee);
                    if (call.stoppedAtFramework) {
                        graph.append(" ← Framework");
                    }
                    graph.append("\n");
                }
            }
        }

        return graph.toString();
    }

    /**
     * Call information holder
     */
    private static class CallInfo {
        int depth;
        String caller;
        String callee;
        String file;
        int line;
        String callType;
        String packageName;
        boolean stoppedAtFramework;
        String frameworkName;
    }

    /**
     * Tool 2.2: trace_data_transformation
     * Traces how a DTO transforms through architecture layers
     */
    public ObjectNode traceDataTransformation(JsonNode params) throws Exception {
        String dtoClassName = params.get("dtoClassName").asText();
        String endpoint = params.has("endpoint") ? params.get("endpoint").asText() : null;
        String direction = params.has("direction") ? params.get("direction").asText() : "both";

        System.err.println("Tracing data transformation for: " + dtoClassName);

        // Find the DTO class file
        File dtoFile = findClassFile(dtoClassName, null);
        if (dtoFile == null) {
            throw new Exception("DTO class file not found for: " + dtoClassName);
        }

        // Build result
        ObjectNode result = objectMapper.createObjectNode();

        // Starting point
        ObjectNode startingPoint = objectMapper.createObjectNode();
        startingPoint.put("dtoClass", dtoClassName);
        startingPoint.put("file", dtoFile.getAbsolutePath());
        startingPoint.put("direction", direction);
        result.set("startingPoint", startingPoint);

        // Find transformation steps (simplified - looks for common mapper patterns)
        ArrayNode transformationSteps = objectMapper.createArrayNode();
        List<String> layers = new ArrayList<>();
        Set<String> fileReferences = new HashSet<>();
        fileReferences.add(dtoFile.getAbsolutePath());

        // Search for mapper classes and transformation methods
        findTransformationSteps(dtoClassName, transformationSteps, layers, fileReferences);

        result.set("transformationSteps", transformationSteps);

        // Build flow diagram
        String flowDiagram = buildFlowDiagram(dtoClassName, transformationSteps);
        result.put("flowDiagram", flowDiagram);

        // Track fields (simplified)
        ArrayNode fieldsLost = objectMapper.createArrayNode();
        ArrayNode fieldsAdded = objectMapper.createArrayNode();
        result.set("fieldsLost", fieldsLost);
        result.set("fieldsAdded", fieldsAdded);

        // Summary
        result.put("totalSteps", transformationSteps.size());

        ArrayNode layersArray = objectMapper.createArrayNode();
        layers.forEach(layersArray::add);
        result.set("layers", layersArray);

        // File references
        ArrayNode fileRefsArray = objectMapper.createArrayNode();
        fileReferences.forEach(fileRefsArray::add);
        result.set("fileReferences", fileRefsArray);

        return result;
    }

    /**
     * Find transformation steps for a DTO
     */
    private void findTransformationSteps(String dtoClassName, ArrayNode steps,
                                         List<String> layers, Set<String> fileReferences) {
        try {
            // Search for mapper classes in the workspace
            Path srcDir = workspaceRoot.resolve("src/main/java");
            if (!Files.exists(srcDir)) {
                return;
            }

            // Look for common mapper/converter patterns
            Files.walk(srcDir)
                    .filter(p -> p.toString().endsWith(".java"))
                    .filter(p -> p.toString().contains("Mapper") ||
                                p.toString().contains("Converter") ||
                                p.toString().contains("Transformer"))
                    .forEach(mapperFile -> {
                        try {
                            ParseResult<CompilationUnit> parseResult = javaParser.parse(mapperFile.toFile());
                            if (parseResult.isSuccessful() && parseResult.getResult().isPresent()) {
                                CompilationUnit cu = parseResult.getResult().get();

                                // Find methods that reference the DTO
                                List<MethodDeclaration> methods = cu.findAll(MethodDeclaration.class);
                                for (MethodDeclaration method : methods) {
                                    String methodBody = method.toString();
                                    if (methodBody.contains(dtoClassName.substring(dtoClassName.lastIndexOf('.') + 1))) {
                                        // Found a transformation method
                                        ObjectNode step = objectMapper.createObjectNode();

                                        String returnType = method.getType().asString();
                                        step.put("fromLayer", "Service");
                                        step.put("toLayer", "Entity");
                                        step.put("fromType", dtoClassName);
                                        step.put("toType", returnType);

                                        ObjectNode transformer = objectMapper.createObjectNode();
                                        transformer.put("className", cu.getType(0).getNameAsString());
                                        transformer.put("methodName", method.getNameAsString());
                                        transformer.put("file", mapperFile.toString());
                                        transformer.put("line", method.getBegin().map(pos -> pos.line).orElse(0));
                                        step.set("transformer", transformer);

                                        step.put("transformationLogic", "Maps DTO fields to entity");

                                        steps.add(step);
                                        layers.add("Service");
                                        layers.add("Entity");
                                        fileReferences.add(mapperFile.toString());
                                    }
                                }
                            }
                        } catch (Exception e) {
                            // Skip files that can't be parsed
                        }
                    });
        } catch (IOException e) {
            System.err.println("Error searching for transformations: " + e.getMessage());
        }
    }

    /**
     * Build flow diagram text
     */
    private String buildFlowDiagram(String dtoClassName, ArrayNode steps) {
        StringBuilder diagram = new StringBuilder();
        diagram.append(dtoClassName).append("\n");

        for (int i = 0; i < steps.size(); i++) {
            JsonNode step = steps.get(i);
            String transformer = "";
            if (step.has("transformer")) {
                JsonNode trans = step.get("transformer");
                transformer = trans.get("className").asText() + "." +
                             trans.get("methodName").asText();
            }

            diagram.append("    ↓ [").append(transformer).append("]\n");
            diagram.append(step.get("toType").asText()).append("\n");
        }

        return diagram.toString();
    }

    /**
     * Tool 2.3: find_all_usages
     * Finds all usages of a method, field, or class across the codebase
     */
    public ObjectNode findAllUsages(JsonNode params) throws Exception {
        String identifier = params.get("identifier").asText();
        String identifierType = params.get("identifierType").asText(); // method, class, field
        String scopeClass = params.has("scopeClass") ? params.get("scopeClass").asText() : null;
        boolean includeTests = params.has("includeTests") ? params.get("includeTests").asBoolean() : true;

        System.err.println("Finding all usages of " + identifierType + ": " + identifier);

        ObjectNode result = objectMapper.createObjectNode();
        ArrayNode usages = objectMapper.createArrayNode();
        Map<String, Integer> groupedByModule = new HashMap<>();
        Set<String> fileReferences = new HashSet<>();
        int productionUsages = 0;
        int testUsages = 0;

        // Walk through all Java files in the workspace
        Path srcDir = workspaceRoot.resolve("src");
        if (!Files.exists(srcDir)) {
            throw new Exception("Source directory not found: " + srcDir);
        }

        Files.walk(srcDir)
                .filter(p -> p.toString().endsWith(".java"))
                .filter(p -> includeTests || !p.toString().contains("/test/"))
                .forEach(javaFile -> {
                    try {
                        ParseResult<CompilationUnit> parseResult = javaParser.parse(javaFile.toFile());
                        if (parseResult.isSuccessful() && parseResult.getResult().isPresent()) {
                            CompilationUnit cu = parseResult.getResult().get();

                            // Find usages based on identifier type
                            List<ObjectNode> fileUsages = findUsagesInFile(
                                    cu, javaFile, identifier, identifierType, scopeClass);

                            if (!fileUsages.isEmpty()) {
                                fileUsages.forEach(usages::add);
                                fileReferences.add(javaFile.toString());

                                // Count by module
                                String module = getModuleName(javaFile);
                                groupedByModule.put(module, groupedByModule.getOrDefault(module, 0) + fileUsages.size());
                            }
                        }
                    } catch (Exception e) {
                        // Skip files that can't be parsed
                        System.err.println("Warning: Could not parse " + javaFile + ": " + e.getMessage());
                    }
                });

        // Count production vs test usages
        for (int i = 0; i < usages.size(); i++) {
            String file = usages.get(i).get("file").asText();
            if (file.contains("/test/")) {
                testUsages++;
            } else {
                productionUsages++;
            }
        }

        result.put("totalUsages", usages.size());
        result.set("usages", usages);

        // Grouped by module
        ObjectNode groupedByModuleNode = objectMapper.createObjectNode();
        groupedByModule.forEach(groupedByModuleNode::put);
        result.set("groupedByModule", groupedByModuleNode);

        // Impact assessment
        ObjectNode impactAssessment = objectMapper.createObjectNode();

        ObjectNode productionCode = objectMapper.createObjectNode();
        productionCode.put("criticalUsages", productionUsages);
        ArrayNode willBreak = objectMapper.createArrayNode();
        fileReferences.stream()
                .filter(f -> !f.contains("/test/"))
                .forEach(willBreak::add);
        productionCode.set("willBreak", willBreak);
        impactAssessment.set("productionCode", productionCode);

        ObjectNode testCode = objectMapper.createObjectNode();
        testCode.put("testsToUpdate", testUsages);
        impactAssessment.set("testCode", testCode);

        // Risk level based on usage count
        String riskLevel;
        if (productionUsages == 0) {
            riskLevel = "LOW - No production code affected";
        } else if (productionUsages <= 3) {
            riskLevel = "MEDIUM - Few production usages";
        } else if (productionUsages <= 10) {
            riskLevel = "HIGH - Multiple production usages";
        } else {
            riskLevel = "CRITICAL - Widespread usage across codebase";
        }
        impactAssessment.put("riskLevel", riskLevel);
        result.set("impactAssessment", impactAssessment);

        // Recommendations
        ObjectNode recommendations = objectMapper.createObjectNode();
        recommendations.put("productionFiles", (int) fileReferences.stream().filter(f -> !f.contains("/test/")).count());
        recommendations.put("testFiles", (int) fileReferences.stream().filter(f -> f.contains("/test/")).count());

        String effort;
        if (usages.size() <= 3) {
            effort = "Small (< 1 hour)";
        } else if (usages.size() <= 10) {
            effort = "Medium (1-4 hours)";
        } else {
            effort = "Large (4+ hours)";
        }
        recommendations.put("estimatedEffort", effort);
        result.set("recommendations", recommendations);

        // File references
        ArrayNode fileRefsArray = objectMapper.createArrayNode();
        fileReferences.forEach(fileRefsArray::add);
        result.set("fileReferences", fileRefsArray);

        return result;
    }

    /**
     * Find usages of an identifier within a compilation unit
     */
    private List<ObjectNode> findUsagesInFile(CompilationUnit cu, Path javaFile,
                                              String identifier, String identifierType,
                                              String scopeClass) {
        List<ObjectNode> usages = new ArrayList<>();

        switch (identifierType.toLowerCase()) {
            case "method":
                // Find method calls
                List<MethodCallExpr> methodCalls = cu.findAll(MethodCallExpr.class).stream()
                        .filter(mc -> mc.getNameAsString().equals(identifier))
                        .collect(Collectors.toList());

                for (MethodCallExpr methodCall : methodCalls) {
                    ObjectNode usage = createUsageNode(cu, javaFile, methodCall, identifier, "METHOD_CALL");
                    usages.add(usage);
                }
                break;

            case "class":
                // Find class usages (instantiation, type references, etc.)
                List<ObjectCreationExpr> objectCreations = cu.findAll(ObjectCreationExpr.class).stream()
                        .filter(oc -> oc.getType().getNameAsString().equals(identifier) ||
                                     oc.getType().getNameAsString().endsWith("." + identifier))
                        .collect(Collectors.toList());

                for (ObjectCreationExpr creation : objectCreations) {
                    ObjectNode usage = createUsageNode(cu, javaFile, creation, identifier, "INSTANTIATION");
                    usages.add(usage);
                }

                // Also find type references in variable declarations
                List<VariableDeclarator> varDecls = cu.findAll(VariableDeclarator.class).stream()
                        .filter(vd -> vd.getType().asString().equals(identifier) ||
                                     vd.getType().asString().endsWith("." + identifier))
                        .collect(Collectors.toList());

                for (VariableDeclarator varDecl : varDecls) {
                    ObjectNode usage = createUsageNode(cu, javaFile, varDecl, identifier, "TYPE_REFERENCE");
                    usages.add(usage);
                }
                break;

            case "field":
                // Find field accesses
                List<FieldAccessExpr> fieldAccesses = cu.findAll(FieldAccessExpr.class).stream()
                        .filter(fa -> fa.getNameAsString().equals(identifier))
                        .collect(Collectors.toList());

                for (FieldAccessExpr fieldAccess : fieldAccesses) {
                    ObjectNode usage = createUsageNode(cu, javaFile, fieldAccess, identifier, "FIELD_ACCESS");
                    usages.add(usage);
                }

                // Also find simple name references (local field access)
                List<NameExpr> nameExprs = cu.findAll(NameExpr.class).stream()
                        .filter(ne -> ne.getNameAsString().equals(identifier))
                        .collect(Collectors.toList());

                for (NameExpr nameExpr : nameExprs) {
                    ObjectNode usage = createUsageNode(cu, javaFile, nameExpr, identifier, "FIELD_REFERENCE");
                    usages.add(usage);
                }
                break;
        }

        return usages;
    }

    /**
     * Create a usage node from an AST node
     */
    private ObjectNode createUsageNode(CompilationUnit cu, Path javaFile,
                                       Node node, String identifier, String usageType) {
        ObjectNode usage = objectMapper.createObjectNode();

        // Find the enclosing method and class
        Optional<MethodDeclaration> enclosingMethod = node.findAncestor(MethodDeclaration.class);
        Optional<ClassOrInterfaceDeclaration> enclosingClass = node.findAncestor(ClassOrInterfaceDeclaration.class);

        String className = enclosingClass.map(c -> c.getNameAsString()).orElse("Unknown");
        String methodName = enclosingMethod.map(m -> m.getNameAsString()).orElse("(class-level)");

        usage.put("className", className);
        usage.put("methodName", methodName);
        usage.put("file", javaFile.toString());
        usage.put("line", node.getBegin().map(pos -> pos.line).orElse(0));
        usage.put("usageType", usageType);

        // Extract context (a few lines around the usage)
        String context = extractContext(node, 2);
        usage.put("context", context);

        return usage;
    }

    /**
     * Extract context lines around a node
     */
    private String extractContext(Node node, int linesBefore) {
        // Get the node's string representation and limit to reasonable size
        String nodeStr = node.toString();

        // If it's part of a statement, get the full statement
        Optional<com.github.javaparser.ast.stmt.Statement> stmt = node.findAncestor(com.github.javaparser.ast.stmt.Statement.class);
        if (stmt.isPresent()) {
            nodeStr = stmt.get().toString();
        }

        // Limit context to 5 lines max
        String[] lines = nodeStr.split("\n");
        if (lines.length > 5) {
            nodeStr = String.join("\n", Arrays.copyOfRange(lines, 0, 5)) + "\n...";
        }

        return nodeStr;
    }

    /**
     * Get module name from file path
     */
    private String getModuleName(Path javaFile) {
        String pathStr = javaFile.toString();

        // Try to extract module from path structure
        // Typical: .../src/main/java/com/example/module/...
        if (pathStr.contains("/src/main/java/")) {
            String afterSrc = pathStr.substring(pathStr.indexOf("/src/main/java/") + "/src/main/java/".length());
            String[] parts = afterSrc.split("/");
            if (parts.length >= 3) {
                return parts[0] + "." + parts[1] + "." + parts[2];
            } else if (parts.length >= 2) {
                return parts[0] + "." + parts[1];
            } else if (parts.length >= 1) {
                return parts[0];
            }
        } else if (pathStr.contains("/src/test/java/")) {
            String afterSrc = pathStr.substring(pathStr.indexOf("/src/test/java/") + "/src/test/java/".length());
            String[] parts = afterSrc.split("/");
            if (parts.length >= 3) {
                return parts[0] + "." + parts[1] + "." + parts[2] + " (test)";
            } else if (parts.length >= 2) {
                return parts[0] + "." + parts[1] + " (test)";
            } else if (parts.length >= 1) {
                return parts[0] + " (test)";
            }
        }

        return "unknown";
    }

    /**
     * Tool 2.4: trace_endpoint_to_repository
     * Traces complete flow from REST endpoint through service layer to repository
     */
    public ObjectNode traceEndpointToRepository(JsonNode params) throws Exception {
        String endpointPath = params.get("endpointPath").asText();
        String httpMethod = params.has("httpMethod") ? params.get("httpMethod").asText() : null;

        System.err.println("Tracing endpoint to repository: " + httpMethod + " " + endpointPath);

        ObjectNode result = objectMapper.createObjectNode();
        Set<String> fileReferences = new HashSet<>();
        List<String> layers = new ArrayList<>();

        // Step 1: Find the controller method that handles this endpoint
        ControllerEndpoint controllerEndpoint = findControllerForEndpoint(endpointPath, httpMethod);

        if (controllerEndpoint == null) {
            throw new Exception("No controller found for endpoint: " + httpMethod + " " + endpointPath);
        }

        // Endpoint info
        ObjectNode endpoint = objectMapper.createObjectNode();
        endpoint.put("path", endpointPath);
        endpoint.put("method", httpMethod != null ? httpMethod : "ANY");
        endpoint.put("controllerClass", controllerEndpoint.controllerClass);
        result.set("endpoint", endpoint);

        // Controller method info
        ObjectNode controllerMethod = objectMapper.createObjectNode();
        controllerMethod.put("className", controllerEndpoint.controllerClass);
        controllerMethod.put("methodName", controllerEndpoint.methodName);
        controllerMethod.put("file", controllerEndpoint.file);
        controllerMethod.put("line", controllerEndpoint.line);
        controllerMethod.put("returnType", controllerEndpoint.returnType);

        ArrayNode annotations = objectMapper.createArrayNode();
        controllerEndpoint.annotations.forEach(annotations::add);
        controllerMethod.set("annotations", annotations);

        ArrayNode parameters = objectMapper.createArrayNode();
        controllerEndpoint.parameters.forEach(parameters::add);
        controllerMethod.set("parameters", parameters);

        if (controllerEndpoint.requestBody != null) {
            controllerMethod.put("requestBody", controllerEndpoint.requestBody);
        }

        result.set("controllerMethod", controllerMethod);
        fileReferences.add(controllerEndpoint.file);
        layers.add("Controller");

        // Step 2: Find service calls from controller method
        ArrayNode serviceCalls = objectMapper.createArrayNode();
        List<String> serviceClassNames = findServiceCallsInMethod(controllerEndpoint.methodDeclaration, serviceCalls, fileReferences);
        result.set("serviceCalls", serviceCalls);

        if (!serviceCalls.isEmpty()) {
            layers.add("Service");
        }

        // Step 3: Find repository calls from services
        ArrayNode repositoryCalls = objectMapper.createArrayNode();
        List<String> entityNames = new ArrayList<>();

        for (String serviceClassName : serviceClassNames) {
            findRepositoryCallsInService(serviceClassName, repositoryCalls, entityNames, fileReferences);
        }

        result.set("repositoryCalls", repositoryCalls);

        if (!repositoryCalls.isEmpty()) {
            layers.add("Repository");
        }

        // Step 4: Get entity information
        ArrayNode entities = objectMapper.createArrayNode();
        for (String entityName : entityNames) {
            ObjectNode entityInfo = getEntityInfo(entityName);
            if (entityInfo != null) {
                entities.add(entityInfo);
                layers.add("Entity");
            }
        }
        result.set("entities", entities);

        // Build flow diagram
        String flowDiagram = buildEndpointFlowDiagram(endpointPath, httpMethod, controllerEndpoint,
                serviceCalls, repositoryCalls, entityNames);
        result.put("flowDiagram", flowDiagram);

        // Summary
        int totalHops = 1; // Controller
        totalHops += serviceCalls.size();
        totalHops += repositoryCalls.size();
        totalHops += entities.size();

        result.put("totalHops", totalHops);

        ArrayNode layersArray = objectMapper.createArrayNode();
        layers.stream().distinct().forEach(layersArray::add);
        result.set("layers", layersArray);

        // File references
        ArrayNode fileRefsArray = objectMapper.createArrayNode();
        fileReferences.forEach(fileRefsArray::add);
        result.set("fileReferences", fileRefsArray);

        return result;
    }

    /**
     * Find controller method that handles an endpoint
     */
    private ControllerEndpoint findControllerForEndpoint(String endpointPath, String httpMethod) throws IOException {
        Path srcDir = workspaceRoot.resolve("src/main/java");
        if (!Files.exists(srcDir)) {
            return null;
        }

        // Search for controllers
        final ControllerEndpoint[] foundEndpoint = {null};

        Files.walk(srcDir)
                .filter(p -> p.toString().endsWith("Controller.java") || p.toString().contains("/controller/"))
                .forEach(controllerFile -> {
                    try {
                        ParseResult<CompilationUnit> parseResult = javaParser.parse(controllerFile.toFile());
                        if (parseResult.isSuccessful() && parseResult.getResult().isPresent()) {
                            CompilationUnit cu = parseResult.getResult().get();

                            // Find controller class
                            List<ClassOrInterfaceDeclaration> controllers = cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                                    .filter(c -> c.getAnnotationByName("RestController").isPresent() ||
                                               c.getAnnotationByName("Controller").isPresent())
                                    .collect(Collectors.toList());

                            for (ClassOrInterfaceDeclaration controller : controllers) {
                                String baseMapping = "";

                                // Check for class-level @RequestMapping
                                controller.getAnnotationByName("RequestMapping").ifPresent(ann -> {
                                    // Extract base path from annotation
                                });

                                // Find methods with mapping annotations
                                List<MethodDeclaration> methods = controller.getMethods();
                                for (MethodDeclaration method : methods) {
                                    String mappingPath = null;
                                    String mappingMethod = null;

                                    // Check for various mapping annotations
                                    if (method.getAnnotationByName("GetMapping").isPresent()) {
                                        mappingMethod = "GET";
                                        mappingPath = extractMappingPath(method.getAnnotationByName("GetMapping").get());
                                    } else if (method.getAnnotationByName("PostMapping").isPresent()) {
                                        mappingMethod = "POST";
                                        mappingPath = extractMappingPath(method.getAnnotationByName("PostMapping").get());
                                    } else if (method.getAnnotationByName("PutMapping").isPresent()) {
                                        mappingMethod = "PUT";
                                        mappingPath = extractMappingPath(method.getAnnotationByName("PutMapping").get());
                                    } else if (method.getAnnotationByName("DeleteMapping").isPresent()) {
                                        mappingMethod = "DELETE";
                                        mappingPath = extractMappingPath(method.getAnnotationByName("DeleteMapping").get());
                                    } else if (method.getAnnotationByName("PatchMapping").isPresent()) {
                                        mappingMethod = "PATCH";
                                        mappingPath = extractMappingPath(method.getAnnotationByName("PatchMapping").get());
                                    } else if (method.getAnnotationByName("RequestMapping").isPresent()) {
                                        mappingPath = extractMappingPath(method.getAnnotationByName("RequestMapping").get());
                                    }

                                    if (mappingPath != null) {
                                        String fullPath = baseMapping + mappingPath;

                                        // Simple path matching (can be enhanced for path variables)
                                        if (pathMatches(fullPath, endpointPath) &&
                                            (httpMethod == null || httpMethod.equalsIgnoreCase(mappingMethod))) {

                                            ControllerEndpoint ep = new ControllerEndpoint();
                                            ep.controllerClass = controller.getNameAsString();
                                            ep.methodName = method.getNameAsString();
                                            ep.methodDeclaration = method;
                                            ep.file = controllerFile.toString();
                                            ep.line = method.getBegin().map(pos -> pos.line).orElse(0);
                                            ep.returnType = method.getType().asString();
                                            ep.annotations = method.getAnnotations().stream()
                                                    .map(a -> a.getNameAsString())
                                                    .collect(Collectors.toList());
                                            ep.parameters = method.getParameters().stream()
                                                    .map(p -> p.getType().asString() + " " + p.getNameAsString())
                                                    .collect(Collectors.toList());

                                            // Check for @RequestBody parameter
                                            method.getParameters().stream()
                                                    .filter(p -> p.getAnnotationByName("RequestBody").isPresent())
                                                    .findFirst()
                                                    .ifPresent(p -> ep.requestBody = p.getType().asString());

                                            foundEndpoint[0] = ep;
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Skip files that can't be parsed
                    }
                });

        return foundEndpoint[0];
    }

    /**
     * Extract mapping path from annotation
     */
    private String extractMappingPath(AnnotationExpr annotation) {
        String path = "";

        if (annotation.isSingleMemberAnnotationExpr()) {
            path = annotation.asSingleMemberAnnotationExpr()
                    .getMemberValue()
                    .toString()
                    .replace("\"", "");
        } else if (annotation.isNormalAnnotationExpr()) {
            annotation.asNormalAnnotationExpr()
                    .getPairs()
                    .stream()
                    .filter(pair -> pair.getNameAsString().equals("value") || pair.getNameAsString().equals("path"))
                    .findFirst()
                    .ifPresent(pair -> {
                        // Handle both single values and arrays
                    });
        }

        return path;
    }

    /**
     * Simple path matching (ignores path variables for now)
     */
    private boolean pathMatches(String pattern, String path) {
        // Simple comparison - can be enhanced for path variables like {id}
        String normalizedPattern = pattern.replaceAll("\\{[^}]+\\}", "*");
        String normalizedPath = path;

        if (normalizedPattern.contains("*")) {
            String regex = normalizedPattern.replace("*", "[^/]+");
            return normalizedPath.matches(regex);
        }

        return normalizedPattern.equals(normalizedPath) ||
               normalizedPattern.startsWith(normalizedPath) ||
               normalizedPath.startsWith(normalizedPattern);
    }

    /**
     * Find service calls in a controller method
     */
    private List<String> findServiceCallsInMethod(MethodDeclaration method, ArrayNode serviceCalls,
                                                   Set<String> fileReferences) {
        List<String> serviceClassNames = new ArrayList<>();

        // Find method calls in the controller method
        List<MethodCallExpr> methodCalls = method.findAll(MethodCallExpr.class);

        for (MethodCallExpr call : methodCalls) {
            try {
                // Try to determine if this is a service call
                String calledMethod = call.getNameAsString();

                // Look for service field in the controller
                Optional<FieldDeclaration> serviceField = method.findAncestor(ClassOrInterfaceDeclaration.class)
                        .flatMap(controller -> controller.getFields().stream()
                                .filter(f -> f.getAnnotationByName("Autowired").isPresent() ||
                                           f.getAnnotationByName("Inject").isPresent() ||
                                           f.getVariables().stream().anyMatch(v ->
                                                   v.getTypeAsString().contains("Service")))
                                .findFirst());

                if (serviceField.isPresent()) {
                    String serviceClassName = serviceField.get().getVariable(0).getTypeAsString();

                    ObjectNode serviceCall = objectMapper.createObjectNode();
                    serviceCall.put("className", serviceClassName);
                    serviceCall.put("methodName", calledMethod);
                    serviceCall.put("serviceType", "Service");
                    serviceCall.put("line", call.getBegin().map(pos -> pos.line).orElse(0));

                    serviceCalls.add(serviceCall);
                    serviceClassNames.add(serviceClassName);
                }
            } catch (Exception e) {
                // Skip if can't resolve
            }
        }

        return serviceClassNames;
    }

    /**
     * Find repository calls in a service class
     */
    private void findRepositoryCallsInService(String serviceClassName, ArrayNode repositoryCalls,
                                              List<String> entityNames, Set<String> fileReferences) {
        try {
            File serviceFile = findClassFile(serviceClassName, null);
            if (serviceFile == null) {
                return;
            }

            ParseResult<CompilationUnit> parseResult = javaParser.parse(serviceFile);
            if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
                return;
            }

            CompilationUnit cu = parseResult.getResult().get();
            fileReferences.add(serviceFile.getAbsolutePath());

            // Find repository fields
            List<FieldDeclaration> repoFields = cu.findAll(FieldDeclaration.class).stream()
                    .filter(f -> f.getVariables().stream()
                            .anyMatch(v -> v.getTypeAsString().contains("Repository")))
                    .collect(Collectors.toList());

            for (FieldDeclaration repoField : repoFields) {
                String repoClassName = repoField.getVariable(0).getTypeAsString();

                ObjectNode repoCall = objectMapper.createObjectNode();
                repoCall.put("className", repoClassName);
                repoCall.put("methodName", "(various)");
                repoCall.put("file", serviceFile.getAbsolutePath());
                repoCall.put("line", repoField.getBegin().map(pos -> pos.line).orElse(0));
                repoCall.put("repoType", "JpaRepository");

                // Try to determine entity from repository
                String entityName = extractEntityFromRepository(repoClassName);
                if (entityName != null) {
                    repoCall.put("entity", entityName);
                    entityNames.add(entityName);
                }

                repositoryCalls.add(repoCall);
            }

        } catch (Exception e) {
            System.err.println("Error finding repository calls in service: " + e.getMessage());
        }
    }

    /**
     * Extract entity name from repository class name or generics
     */
    private String extractEntityFromRepository(String repoClassName) {
        // Common pattern: UserRepository, ProductRepository, etc.
        if (repoClassName.endsWith("Repository")) {
            return repoClassName.substring(0, repoClassName.length() - "Repository".length());
        }

        // Try to extract from generics if present
        if (repoClassName.contains("<") && repoClassName.contains(">")) {
            int start = repoClassName.indexOf("<") + 1;
            int end = repoClassName.indexOf(",");
            if (end == -1) {
                end = repoClassName.indexOf(">");
            }
            if (start < end) {
                return repoClassName.substring(start, end).trim();
            }
        }

        return null;
    }

    /**
     * Get entity information
     */
    private ObjectNode getEntityInfo(String entityName) {
        try {
            File entityFile = findClassFile(entityName, null);
            if (entityFile == null) {
                return null;
            }

            ParseResult<CompilationUnit> parseResult = javaParser.parse(entityFile);
            if (!parseResult.isSuccessful() || !parseResult.getResult().isPresent()) {
                return null;
            }

            CompilationUnit cu = parseResult.getResult().get();

            ObjectNode entityInfo = objectMapper.createObjectNode();
            entityInfo.put("className", entityName);
            entityInfo.put("file", entityFile.getAbsolutePath());

            // Find @Table annotation for table name
            cu.findAll(ClassOrInterfaceDeclaration.class).stream()
                    .filter(c -> c.getAnnotationByName("Entity").isPresent())
                    .findFirst()
                    .ifPresent(entity -> {
                        entity.getAnnotationByName("Table").ifPresent(table -> {
                            // Extract table name
                            entityInfo.put("tableName", entityName.toLowerCase());
                        });

                        // Get key fields
                        ArrayNode fields = objectMapper.createArrayNode();
                        entity.getFields().stream()
                                .filter(f -> f.getAnnotationByName("Id").isPresent() ||
                                           f.getAnnotationByName("Column").isPresent())
                                .forEach(f -> fields.add(f.getVariable(0).getNameAsString()));

                        entityInfo.set("fields", fields);
                    });

            return entityInfo;

        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Build flow diagram for endpoint trace
     */
    private String buildEndpointFlowDiagram(String endpointPath, String httpMethod,
                                           ControllerEndpoint controller,
                                           ArrayNode services, ArrayNode repos,
                                           List<String> entities) {
        StringBuilder diagram = new StringBuilder();

        diagram.append("HTTP Request: ").append(httpMethod != null ? httpMethod : "ANY")
               .append(" ").append(endpointPath).append("\n");
        diagram.append("    ↓\n");
        diagram.append("Controller: ").append(controller.controllerClass)
               .append(".").append(controller.methodName).append("()\n");

        if (services.size() > 0) {
            diagram.append("    ↓\n");
            for (int i = 0; i < services.size(); i++) {
                JsonNode service = services.get(i);
                diagram.append("Service: ").append(service.get("className").asText())
                       .append(".").append(service.get("methodName").asText()).append("()\n");
            }
        }

        if (repos.size() > 0) {
            diagram.append("    ↓\n");
            for (int i = 0; i < repos.size(); i++) {
                JsonNode repo = repos.get(i);
                diagram.append("Repository: ").append(repo.get("className").asText()).append("\n");
            }
        }

        if (!entities.isEmpty()) {
            diagram.append("    ↓\n");
            for (String entity : entities) {
                diagram.append("Entity: ").append(entity).append("\n");
            }
            diagram.append("    ↓\n");
            diagram.append("Database");
        }

        return diagram.toString();
    }

    /**
     * Helper class to store controller endpoint information
     */
    private static class ControllerEndpoint {
        String controllerClass;
        String methodName;
        MethodDeclaration methodDeclaration;
        String file;
        int line;
        String returnType;
        List<String> annotations;
        List<String> parameters;
        String requestBody;
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
