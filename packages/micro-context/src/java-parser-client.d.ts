export interface JavaParserConfig {
    packageInclude: string;
    packageExclude: string;
    dtoPackages: string[];
    entityPackages: string[];
    maxDtoDepth: number;
    callChainMaxDepth: number;
    stopAtPackages: string[];
    featureFlagPatterns: string[];
}
export interface JavaParserRequest {
    operation: string;
    params: Record<string, any>;
}
export interface JavaParserResponse {
    success: boolean;
    data?: any;
    error?: {
        message: string;
        code: string;
        suggestions?: string[];
        context?: Record<string, any>;
    };
}
/**
 * Client for communicating with Java Parser Service via child process.
 * Handles JSON-RPC style communication over stdin/stdout.
 */
export declare class JavaParserClient {
    private javaProcess;
    private workspaceRoot;
    private config;
    private requestId;
    private pendingRequests;
    private isReady;
    private readyPromise;
    constructor(workspaceRoot: string, config?: Partial<JavaParserConfig>);
    private startJavaProcess;
    private waitForReady;
    /**
     * Send a request to the Java Parser Service
     */
    sendRequest(operation: string, params: any): Promise<any>;
    /**
     * Clean up resources
     */
    dispose(): void;
}
//# sourceMappingURL=java-parser-client.d.ts.map