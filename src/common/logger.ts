// Structured Logging System for Figma Plugin
// Supports local-first logging with optional cloud sync

import type { StructuredError } from './errors'
import { ErrorCategory, ErrorSeverity } from './errors'

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
} as const

export type LogLevel = typeof LogLevel[keyof typeof LogLevel]

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  environment: 'UI' | 'PLUGIN'
  category?: string
  data?: Record<string, unknown>
  error?: StructuredError
  stack?: string
  sessionId?: string
  userId?: string
  pluginVersion?: string
  figmaVersion?: string
}

export interface LoggerConfig {
  level: LogLevel
  environment: 'UI' | 'PLUGIN'
  enableLocalStorage: boolean
  maxLocalEntries: number
  enableCloudSync: boolean
  sessionId?: string
  userId?: string
  pluginVersion?: string
  sentryConfig?: {
    dsn: string
    environment: string
    enabled: boolean
  }
}

export class StructuredLogger {
  private config: LoggerConfig
  private localStorage: Storage | null = null
  private logBuffer: LogEntry[] = []
  private syncQueue: LogEntry[] = []
  private cloudSyncEnabled = false

  constructor(config: LoggerConfig) {
    this.config = config
    this.setupStorage()
    this.setupCloudSync()
  }

  private setupStorage() {
    if (this.config.enableLocalStorage) {
      try {
        // Try to access localStorage (available in UI process)
        this.localStorage = typeof window !== 'undefined' ? window.localStorage : null
        if (this.localStorage) {
          this.loadStoredLogs()
        }
             } catch (error) {
         console.warn('localStorage not available, using in-memory logging only', error)
       }
    }
  }

  private setupCloudSync() {
    if (this.config.enableCloudSync && this.config.sentryConfig?.enabled) {
      this.cloudSyncEnabled = true
      this.initializeSentry()
    }
  }

  private initializeSentry() {
    // Dynamic Sentry initialization (only when needed)
    if (typeof window !== 'undefined' && this.config.sentryConfig?.dsn) {
      // Will be implemented when network access is enabled
      console.info('Sentry integration ready for network-enabled mode')
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL]
    return levels.indexOf(level) >= levels.indexOf(this.config.level)
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: StructuredError
  ): LogEntry {
    return {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: this.config.environment,
      category: error?.category || data?.category as string,
      data,
      error,
      stack: error?.stack,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      pluginVersion: this.config.pluginVersion,
             figmaVersion: undefined // Figma version not available in plugin API
    }
  }

  private persistLog(entry: LogEntry) {
    // Add to in-memory buffer
    this.logBuffer.push(entry)
    
    // Limit buffer size
    if (this.logBuffer.length > this.config.maxLocalEntries) {
      this.logBuffer.shift()
    }

    // Persist to localStorage if available
    if (this.localStorage) {
      try {
        const stored = this.getStoredLogs()
        stored.push(entry)
        
        // Keep only recent entries
        if (stored.length > this.config.maxLocalEntries) {
          stored.splice(0, stored.length - this.config.maxLocalEntries)
        }
        
        this.localStorage.setItem('figma-plugin-logs', JSON.stringify(stored))
      } catch (error) {
        console.warn('Failed to persist log to localStorage:', error)
      }
    }

    // Queue for cloud sync if enabled
    if (this.cloudSyncEnabled) {
      this.syncQueue.push(entry)
      this.scheduleCloudSync()
    }
  }

  private loadStoredLogs() {
    if (!this.localStorage) return
    
    try {
      const stored = this.localStorage.getItem('figma-plugin-logs')
      if (stored) {
        this.logBuffer = JSON.parse(stored)
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error)
    }
  }

  private getStoredLogs(): LogEntry[] {
    if (!this.localStorage) return []
    
    try {
      const stored = this.localStorage.getItem('figma-plugin-logs')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to get stored logs:', error)
      return []
    }
  }

  private scheduleCloudSync() {
    // Debounced sync to avoid too many requests
    if (this.syncQueue.length > 0) {
      setTimeout(() => this.syncToCloud(), 5000)
    }
  }

  private async syncToCloud() {
    if (!this.cloudSyncEnabled || this.syncQueue.length === 0) return

    const logsToSync = [...this.syncQueue]
    this.syncQueue = []

    try {
      // This will be implemented when network access is enabled
      console.info(`Would sync ${logsToSync.length} log entries to cloud`)
      // await this.sendToSentry(logsToSync)
    } catch (error) {
      console.warn('Failed to sync logs to cloud:', error)
      // Re-queue failed logs
      this.syncQueue.unshift(...logsToSync)
    }
  }

  // Public logging methods
  debug(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, data)
      this.persistLog(entry)
      console.debug(`[${this.config.environment}] ${message}`, data)
    }
  }

  info(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, data)
      this.persistLog(entry)
      console.info(`[${this.config.environment}] ${message}`, data)
    }
  }

  warn(message: string, data?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, data)
      this.persistLog(entry)
      console.warn(`[${this.config.environment}] ${message}`, data)
    }
  }

  error(message: string, error?: Error | StructuredError, data?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.ERROR)) {
      let structuredError: StructuredError | undefined
      
      if (error instanceof Error) {
        structuredError = {
          id: this.generateLogId(),
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.MEDIUM,
          message: error.message,
          stack: error.stack,
          context: {
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            ...data
          },
          isRecoverable: true
        }
      } else if (error) {
        structuredError = error as StructuredError
      }

      const entry = this.createLogEntry(LogLevel.ERROR, message, data, structuredError)
      this.persistLog(entry)
      console.error(`[${this.config.environment}] ${message}`, error, data)
    }
  }

  fatal(message: string, error?: Error | StructuredError, data?: Record<string, unknown>) {
    if (this.shouldLog(LogLevel.FATAL)) {
      let structuredError: StructuredError | undefined
      
      if (error instanceof Error) {
        structuredError = {
          id: this.generateLogId(),
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.CRITICAL,
          message: error.message,
          stack: error.stack,
          context: {
            timestamp: new Date().toISOString(),
            environment: this.config.environment,
            ...data
          },
          isRecoverable: false
        }
      } else if (error) {
        structuredError = error as StructuredError
      }

      const entry = this.createLogEntry(LogLevel.FATAL, message, data, structuredError)
      this.persistLog(entry)
      console.error(`[${this.config.environment}] FATAL: ${message}`, error, data)
    }
  }

  // Utility methods
  getLogs(filters?: {
    level?: LogLevel
    category?: string
    since?: Date
    limit?: number
  }): LogEntry[] {
    let logs = [...this.logBuffer]
    
    if (filters?.level) {
      logs = logs.filter(log => log.level === filters.level)
    }
    
    if (filters?.category) {
      logs = logs.filter(log => log.category === filters.category)
    }
    
    if (filters?.since) {
      logs = logs.filter(log => new Date(log.timestamp) >= filters.since!)
    }
    
    if (filters?.limit) {
      logs = logs.slice(-filters.limit)
    }
    
    return logs
  }

  clearLogs() {
    this.logBuffer = []
    this.syncQueue = []
    if (this.localStorage) {
      this.localStorage.removeItem('figma-plugin-logs')
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logBuffer, null, 2)
  }

  getLogStats(): {
    totalLogs: number
    errorCount: number
    warningCount: number
    lastError?: LogEntry
  } {
    const errorLogs = this.logBuffer.filter(log => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL)
    const warningLogs = this.logBuffer.filter(log => log.level === LogLevel.WARN)
    
    return {
      totalLogs: this.logBuffer.length,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      lastError: errorLogs[errorLogs.length - 1]
    }
  }
}

// Default logger instances
export const createLogger = (config: LoggerConfig): StructuredLogger => {
  return new StructuredLogger(config)
}

// Pre-configured logger factories
export const createUILogger = (sessionId?: string): StructuredLogger => {
  return createLogger({
    level: LogLevel.INFO,
    environment: 'UI',
    enableLocalStorage: true,
    maxLocalEntries: 1000,
    enableCloudSync: false, // Will be enabled when network access is available
    sessionId,
    pluginVersion: '0.0.3' // From package.json
  })
}

export const createPluginLogger = (sessionId?: string): StructuredLogger => {
  return createLogger({
    level: LogLevel.INFO,
    environment: 'PLUGIN',
    enableLocalStorage: false, // Not available in plugin context
    maxLocalEntries: 500,
    enableCloudSync: false, // Will be enabled when network access is available
    sessionId,
    pluginVersion: '0.0.3' // From package.json
  })
} 