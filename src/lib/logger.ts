/**
 * Log levels for the application
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log entry interface
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /** Enable logging in production */
  enableInProduction?: boolean;
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Custom log handler */
  onLog?: (entry: LogEntry) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Default logger configuration
 */
let config: LoggerConfig = {
  enableInProduction: false,
  minLevel: LogLevel.DEBUG,
};

/**
 * Configure the logger
 */
export function configureLogger(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Level order for comparison
 */
const levelOrder: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Checks if a log entry should be output based on configuration
 */
function shouldLog(level: LogLevel): boolean {
  if (!isDevelopment && !config.enableInProduction) {
    return false;
  }

  const minLevel = config.minLevel || LogLevel.DEBUG;
  return levelOrder[level] >= levelOrder[minLevel];
}

/**
 * Creates a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Outputs a log entry to console
 */
function outputLog(entry: LogEntry): void {
  const prefix = entry.context ? `[${entry.context}]` : '[MMQ]';
  const formattedMessage = `${prefix} ${entry.message}`;

  if (config.onLog) {
    config.onLog(entry);
  }

  switch (entry.level) {
    case LogLevel.DEBUG:
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.debug(formattedMessage, entry.data || '');
      }
      break;
    case LogLevel.INFO:
      // eslint-disable-next-line no-console
      console.info(formattedMessage, entry.data || '');
      break;
    case LogLevel.WARN:
      // eslint-disable-next-line no-console
      console.warn(formattedMessage, entry.data || '');
      break;
    case LogLevel.ERROR:
      // eslint-disable-next-line no-console
      console.error(formattedMessage, entry.data || '');
      break;
  }
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private context?: string;

  constructor(context?: string) {
    this.context = context;
  }

  /**
   * Log a debug message
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (!shouldLog(LogLevel.DEBUG)) return;
    const entry = createLogEntry(LogLevel.DEBUG, message, this.context, data);
    outputLog(entry);
  }

  /**
   * Log an info message
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (!shouldLog(LogLevel.INFO)) return;
    const entry = createLogEntry(LogLevel.INFO, message, this.context, data);
    outputLog(entry);
  }

  /**
   * Log a warning message
   */
  warn(message: string, data?: Record<string, unknown>): void {
    if (!shouldLog(LogLevel.WARN)) return;
    const entry = createLogEntry(LogLevel.WARN, message, this.context, data);
    outputLog(entry);
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    if (!shouldLog(LogLevel.ERROR)) return;
    const errorData = {
      ...data,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
    };
    const entry = createLogEntry(LogLevel.ERROR, message, this.context, errorData);
    outputLog(entry);
  }

  /**
   * Create a child logger with a new context
   */
  child(childContext: string): Logger {
    const newContext = this.context ? `${this.context}:${childContext}` : childContext;
    return new Logger(newContext);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();

/**
 * Create a logger with a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}
