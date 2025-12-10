import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
export class JavaParserClient {
  private javaProcess: ChildProcess | null = null;
  private workspaceRoot: string;
  private config: JavaParserConfig;
  private requestId = 0;
  private pendingRequests: Map<
    number,
    { resolve: (value: any) => void; reject: (error: Error) => void }
  > = new Map();
  private isReady = false;
  private readyPromise: Promise<void>;

  constructor(workspaceRoot: string, config: Partial<JavaParserConfig> = {}) {
    this.workspaceRoot = workspaceRoot;
    this.config = {
      packageInclude: config.packageInclude || '',
      packageExclude: config.packageExclude || '',
      dtoPackages: config.dtoPackages || [],
      entityPackages: config.entityPackages || [],
      maxDtoDepth: config.maxDtoDepth || 10,
      callChainMaxDepth: config.callChainMaxDepth || 15,
      stopAtPackages: config.stopAtPackages || [
        'java.*',
        'javax.*',
        'org.springframework.*',
        'org.hibernate.*',
        'org.apache.*',
        'org.slf4j.*',
        'com.fasterxml.jackson.*',
      ],
      featureFlagPatterns: config.featureFlagPatterns || [
        'isFeatureEnabled',
        'isEnabled',
        'hasFeature',
        'getFeatureFlag',
        'getFlag',
      ],
    };
    this.readyPromise = this.startJavaProcess();
  }

  private async startJavaProcess(): Promise<void> {
    const jarPath = path.resolve(
      __dirname,
      '../../java-parser-service/target/java-parser-service-1.0.0.jar'
    );

    console.error(`Starting Java Parser Service from: ${jarPath}`);
    console.error(`Workspace root: ${this.workspaceRoot}`);

    this.javaProcess = spawn('java', ['-jar', jarPath, this.workspaceRoot], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Handle stdout (responses)
    const rl = readline.createInterface({
      input: this.javaProcess.stdout!,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      try {
        const response: JavaParserResponse & { requestId?: number } = JSON.parse(line);
        const requestId = response.requestId;

        if (requestId !== undefined && this.pendingRequests.has(requestId)) {
          const { resolve, reject } = this.pendingRequests.get(requestId)!;
          this.pendingRequests.delete(requestId);

          if (response.success) {
            resolve(response.data);
          } else {
            const error = new Error(response.error?.message || 'Unknown error');
            (error as any).code = response.error?.code;
            (error as any).suggestions = response.error?.suggestions;
            (error as any).context = response.error?.context;
            reject(error);
          }
        }
      } catch (error) {
        console.error('Failed to parse Java response:', line);
        console.error('Parse error:', error);
      }
    });

    // Handle stderr (logs and errors)
    this.javaProcess.stderr!.on('data', (data) => {
      const message = data.toString();
      console.error('[Java Parser Service]', message);

      // Check if service is ready
      if (message.includes('Java Parser Service started')) {
        this.isReady = true;
      }
    });

    // Handle process exit
    this.javaProcess.on('close', (code) => {
      console.error(`Java process exited with code ${code}`);
      // Reject all pending requests
      for (const { reject } of this.pendingRequests.values()) {
        reject(new Error('Java process terminated'));
      }
      this.pendingRequests.clear();
      this.isReady = false;
    });

    // Handle process errors
    this.javaProcess.on('error', (error) => {
      console.error('Java process error:', error);
      this.isReady = false;
    });

    // Wait for Java process to be ready (max 5 seconds)
    await this.waitForReady(5000);
  }

  private async waitForReady(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    while (!this.isReady && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!this.isReady) {
      throw new Error('Java Parser Service failed to start within timeout');
    }
  }

  /**
   * Send a request to the Java Parser Service
   */
  async sendRequest(operation: string, params: any): Promise<any> {
    await this.readyPromise;

    if (!this.javaProcess || this.javaProcess.killed) {
      throw new Error('Java process not running');
    }

    const requestId = ++this.requestId;

    const request = {
      requestId,
      operation,
      workspaceRoot: this.workspaceRoot,
      params,
      config: this.config,
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      const requestJson = JSON.stringify(request) + '\n';
      this.javaProcess!.stdin!.write(requestJson, (error) => {
        if (error) {
          this.pendingRequests.delete(requestId);
          reject(error);
        }
      });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout after 30 seconds'));
        }
      }, 30000);
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.javaProcess) {
      this.javaProcess.kill();
      this.javaProcess = null;
    }
    this.pendingRequests.clear();
    this.isReady = false;
  }
}
