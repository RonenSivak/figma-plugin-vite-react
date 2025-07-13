// Plugin-side error handling for Figma's sandboxed environment
import type { StructuredError } from '../common/errors'
import { 
  convertToFigmaError, 
  createFigmaAPIError, 
  createSystemError, 
  withRetry 
} from '../common/errors'
import { createPluginLogger } from '../common/logger'

export class PluginErrorHandler {
  private logger = createPluginLogger()
  private errorCount = 0
  private maxErrors = 50 // Prevent infinite error loops

  constructor() {
    this.setupGlobalErrorHandling()
  }

  private setupGlobalErrorHandling() {
    // Global error handler for the plugin environment
    const originalError = console.error
    console.error = (...args: unknown[]) => {
      if (this.errorCount < this.maxErrors) {
        this.handleError(args[0] as Error, { source: 'console.error' })
        this.errorCount++
      }
      originalError.apply(console, args)
    }

    // Handle unhandled promise rejections
    if (typeof process !== 'undefined' && process.on) {
      process.on('unhandledRejection', (reason) => {
        this.handleError(reason as Error, { source: 'unhandledRejection' })
      })
    }
  }

  handleError(error: unknown, context?: Record<string, unknown>): StructuredError {
    const structuredError = convertToFigmaError(error, {
      environment: 'PLUGIN',
      ...context
    })

    this.logger.error('Plugin error occurred', structuredError, context)

    // Send error to UI if possible
    try {
      if (typeof figma !== 'undefined' && figma.ui) {
        figma.ui.postMessage({
          type: 'error',
          error: structuredError.toStructured(),
          context
        })
      }
    } catch (notificationError) {
      console.warn('Failed to send error to UI:', notificationError)
    }

    return structuredError.toStructured()
  }

  // Wrapper for Figma API calls with error handling
  async withFigmaAPI<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await withRetry(operation, {
        maxAttempts: 3,
        delay: 1000,
        shouldRetry: (error) => {
          // Retry on network-like errors, not on API validation errors
          const message = error instanceof Error ? error.message : String(error)
          return !message.includes('Invalid') && !message.includes('not found')
        }
      })
    } catch (error) {
      const figmaError = createFigmaAPIError(
        error instanceof Error ? error.message : String(error),
        { environment: 'PLUGIN', ...context }
      )
      this.handleError(figmaError, context)
      throw figmaError
    }
  }

  // Wrapper for general async operations
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      const structuredError = this.handleError(error, context)
      throw structuredError
    }
  }

  // Safe wrapper for synchronous operations
  withSafeExecution<T>(
    operation: () => T,
    fallback: T,
    context?: Record<string, unknown>
  ): T {
    try {
      return operation()
    } catch (error) {
      this.handleError(error, context)
      return fallback
    }
  }

  // Plugin-specific error handlers
  handleSelectionError(error: unknown, nodeId?: string) {
    return this.handleError(error, {
      source: 'selection',
      nodeId,
      action: 'selection_change'
    })
  }

  handleTextCreationError(error: unknown, text?: string) {
    return this.handleError(error, {
      source: 'text_creation',
      text,
      action: 'create_text'
    })
  }

  handleNetworkError(error: unknown, messageType?: string) {
    return this.handleError(error, {
      source: 'network',
      messageType,
      action: 'message_handling'
    })
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number
    recentErrors: StructuredError[]
  } {
    const stats = this.logger.getLogStats()
    return {
      totalErrors: stats.errorCount,
      recentErrors: this.logger.getLogs({ 
        level: 'ERROR', 
        limit: 10 
      }).map(log => log.error).filter(Boolean) as StructuredError[]
    }
  }

  // Reset error count (useful for testing)
  resetErrorCount() {
    this.errorCount = 0
  }
}

// Global instance for the plugin
export const pluginErrorHandler = new PluginErrorHandler()

// Utility functions for common plugin operations
export const safelyExecute = <T>(
  operation: () => T,
  fallback: T,
  context?: Record<string, unknown>
): T => {
  return pluginErrorHandler.withSafeExecution(operation, fallback, context)
}

export const safelyExecuteAsync = async <T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  return pluginErrorHandler.withErrorHandling(operation, context)
}

export const withFigmaAPI = async <T>(
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> => {
  return pluginErrorHandler.withFigmaAPI(operation, context)
}

// Plugin lifecycle error handlers
export const handlePluginBootstrap = (error: unknown) => {
  return pluginErrorHandler.handleError(error, {
    source: 'bootstrap',
    action: 'plugin_initialization'
  })
}

export const handleMessageError = (error: unknown, messageType: string) => {
  return pluginErrorHandler.handleNetworkError(error, messageType)
}

export const handleSelectionChange = (error: unknown, nodeId?: string) => {
  return pluginErrorHandler.handleSelectionError(error, nodeId)
}

export const handleTextCreation = (error: unknown, text?: string) => {
  return pluginErrorHandler.handleTextCreationError(error, text)
} 