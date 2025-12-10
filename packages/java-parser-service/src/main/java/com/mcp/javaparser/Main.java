package com.mcp.javaparser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Paths;

/**
 * Main entry point for Java Parser Service.
 * Communicates with Node.js MCP servers via JSON over stdin/stdout.
 */
public class Main {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static Parser parser;

    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java -jar java-parser-service.jar <workspace-root>");
            System.exit(1);
        }

        String workspaceRoot = args[0];

        try {
            parser = new Parser(Paths.get(workspaceRoot));
            System.err.println("Java Parser Service started for workspace: " + workspaceRoot);

            // Read requests from stdin line by line
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            String line;

            while ((line = reader.readLine()) != null) {
                handleRequest(line);
            }
        } catch (Exception e) {
            System.err.println("Fatal error: " + e.getMessage());
            e.printStackTrace(System.err);
            System.exit(1);
        }
    }

    /**
     * Handle a single JSON request from stdin
     */
    private static void handleRequest(String requestJson) {
        int requestId = -1;

        try {
            JsonNode request = objectMapper.readTree(requestJson);
            requestId = request.get("requestId").asInt();
            String operation = request.get("operation").asText();
            JsonNode params = request.get("params");
            JsonNode config = request.get("config");

            // Update parser configuration
            if (config != null) {
                parser.updateConfig(config);
            }

            // Execute operation
            Object result = executeOperation(operation, params);

            // Send success response
            sendResponse(requestId, true, result, null);

        } catch (Exception e) {
            // Send error response
            String errorMessage = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            sendResponse(requestId, false, null, errorMessage);

            // Log error details to stderr
            System.err.println("Error processing request: " + errorMessage);
            e.printStackTrace(System.err);
        }
    }

    /**
     * Route operation to appropriate parser method
     */
    private static Object executeOperation(String operation, JsonNode params) throws Exception {
        switch (operation) {
            case "resolve_symbol":
                return parser.resolveSymbol(params);

            case "get_function_definition":
                return parser.getFunctionDefinition(params);

            case "get_dto_structure":
                return parser.getDtoStructure(params);

            case "find_execution_branches":
                return parser.findExecutionBranches(params);

            case "find_mockable_dependencies":
                return parser.findMockableDependencies(params);

            case "build_method_call_chain":
                return parser.buildMethodCallChain(params);

            case "trace_data_transformation":
                return parser.traceDataTransformation(params);

            case "find_all_usages":
                return parser.findAllUsages(params);

            case "trace_endpoint_to_repository":
                return parser.traceEndpointToRepository(params);

            case "find_entity_by_table":
                return parser.findEntityByTable(params);

            case "find_advice_adapters":
                return parser.findAdviceAdapters(params);

            case "find_filters_and_order":
                return parser.findFiltersAndOrder(params);

            case "analyze_controller_method":
                return parser.analyzeControllerMethod(params);

            case "find_controller_for_endpoint":
                return parser.findControllerForEndpoint(params);

            case "find_implementations":
                return parser.findImplementations(params);

            case "find_feature_flag_usage":
                return parser.findFeatureFlagUsage(params);

            default:
                throw new IllegalArgumentException("Unknown operation: " + operation);
        }
    }

    /**
     * Send JSON response to stdout
     */
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
            e.printStackTrace(System.err);
        }
    }
}
