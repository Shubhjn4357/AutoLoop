export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: string;
}

export class Logger {
  private static log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error | unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error instanceof Error ? error.message : String(error || ""),
    };

    // In production, you would stream this to a service like Datadog/CloudWatch
    if (process.env.NODE_ENV !== "test") {
      console.log(JSON.stringify(entry));
    }
  }

  static info(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, context);
  }

  static warn(message: string, context?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, context);
  }

  static error(message: string, error?: Error | unknown, context?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  static debug(message: string, context?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      this.log(LogLevel.DEBUG, message, context);
    }
  }
}
