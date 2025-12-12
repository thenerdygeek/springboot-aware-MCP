import * as fs from 'fs';
import * as path from 'path';

export interface ToolCallLog {
  timestamp: string;
  toolName: string;
  arguments: any;
  response?: any;
  error?: any;
  executionTimeMs: number;
  success: boolean;
}

export class MCPLogger {
  private logDir: string;
  private logFile: string;
  private enabled: boolean;

  constructor(serverName: string, workspaceRoot: string) {
    // Create logs directory in workspace root
    this.logDir = path.join(workspaceRoot, '.mcp-logs');
    this.logFile = path.join(this.logDir, `${serverName}-${this.getDateString()}.log`);

    // Check if logging is enabled (default: true)
    this.enabled = process.env.MCP_LOGGING !== 'false';

    if (this.enabled) {
      this.initializeLogDirectory();
    }
  }

  private initializeLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
      this.enabled = false;
    }
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  public logToolCall(
    toolName: string,
    args: any,
    result: { response?: any; error?: any; executionTimeMs: number }
  ): void {
    if (!this.enabled) return;

    const logEntry: ToolCallLog = {
      timestamp: this.formatTimestamp(),
      toolName,
      arguments: args,
      response: result.response,
      error: result.error,
      executionTimeMs: result.executionTimeMs,
      success: !result.error,
    };

    // Write to log file
    this.writeLog(logEntry);

    // Also write to console in development
    if (process.env.MCP_DEBUG === 'true') {
      this.consoleLog(logEntry);
    }
  }

  private writeLog(entry: ToolCallLog): void {
    try {
      // JSON format for easy parsing
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFile, logLine, 'utf8');

      // Also write human-readable format to separate file
      const readableLogFile = this.logFile.replace('.log', '-readable.log');
      const readableEntry = this.formatReadableLog(entry);
      fs.appendFileSync(readableLogFile, readableEntry + '\n', 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  private formatReadableLog(entry: ToolCallLog): string {
    const separator = '='.repeat(80);
    const status = entry.success ? '✅ SUCCESS' : '❌ ERROR';

    let log = `\n${separator}\n`;
    log += `[${entry.timestamp}] ${status} - ${entry.toolName}\n`;
    log += `Execution Time: ${entry.executionTimeMs}ms\n`;
    log += `${separator}\n`;

    log += `\n📥 ARGUMENTS:\n`;
    log += JSON.stringify(entry.arguments, null, 2) + '\n';

    if (entry.response) {
      log += `\n📤 RESPONSE:\n`;
      if (typeof entry.response === 'string') {
        // Truncate long responses
        const preview = entry.response.length > 500
          ? entry.response.substring(0, 500) + '... (truncated)'
          : entry.response;
        log += preview + '\n';
      } else {
        log += JSON.stringify(entry.response, null, 2) + '\n';
      }
    }

    if (entry.error) {
      log += `\n❌ ERROR:\n`;
      log += JSON.stringify(entry.error, null, 2) + '\n';
    }

    return log;
  }

  private consoleLog(entry: ToolCallLog): void {
    const status = entry.success ? '✅' : '❌';
    console.log(`\n${status} [${entry.timestamp}] ${entry.toolName} (${entry.executionTimeMs}ms)`);
    console.log('Arguments:', JSON.stringify(entry.arguments, null, 2));
    if (entry.error) {
      console.log('Error:', entry.error);
    }
  }

  public getLogFilePath(): string {
    return this.logFile;
  }

  public getLogStats(): { totalCalls: number; successRate: number } {
    if (!this.enabled || !fs.existsSync(this.logFile)) {
      return { totalCalls: 0, successRate: 0 };
    }

    try {
      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(l => l.trim());
      const entries: ToolCallLog[] = lines.map(l => JSON.parse(l));

      const totalCalls = entries.length;
      const successfulCalls = entries.filter(e => e.success).length;
      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;

      return { totalCalls, successRate };
    } catch (error) {
      console.error('Failed to read log stats:', error);
      return { totalCalls: 0, successRate: 0 };
    }
  }
}
