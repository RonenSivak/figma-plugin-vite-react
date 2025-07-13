// Error Types and Utilities for Figma Plugin
// Supports both UI and Plugin processes with structured error handling

export const ErrorCategory = {
  NETWORK: 'NETWORK',
  UI: 'UI',
  PLUGIN: 'PLUGIN',
  FIGMA_API: 'FIGMA_API',
  VALIDATION: 'VALIDATION',
  SYSTEM: 'SYSTEM'
} as const

export type ErrorCategory = typeof ErrorCategory[keyof typeof ErrorCategory]

export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
} as const

export type ErrorSeverity = typeof ErrorSeverity[keyof typeof ErrorSeverity]

export interface ErrorContext {
  userId?: string
  sessionId?: string
  timestamp: string
  userAgent?: string
  figmaVersion?: string
  pluginVersion?: string
  environment: 'UI' | 'PLUGIN'
  action?: string
  componentStack?: string
  errorBoundary?: string
  additionalData?: Record<string, unknown>
}

export interface StructuredError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  message: string
  stack?: string
  context: ErrorContext
  originalError?: Error
  isRecoverable: boolean
  recoveryActions?: string[]
  userFriendlyMessage?: string
}

export class FigmaPluginError extends Error {
  public readonly id: string
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly context: ErrorContext
  public readonly isRecoverable: boolean
  public readonly recoveryActions?: string[]
  public readonly userFriendlyMessage?: string

  constructor(
    message: string,
    options: {
      category: ErrorCategory
      severity: ErrorSeverity
      context: Partial<ErrorContext>
      cause?: Error
      isRecoverable?: boolean
      recoveryActions?: string[]
      userFriendlyMessage?: string
    }
  ) {
    super(message)
    this.name = 'FigmaPluginError'
    this.id = generateErrorId()
    this.category = options.category
    this.severity = options.severity
    this.isRecoverable = options.isRecoverable ?? true
    this.recoveryActions = options.recoveryActions
    this.userFriendlyMessage = options.userFriendlyMessage
    this.context = {
      timestamp: new Date().toISOString(),
      environment: 'UI', // Default, will be overridden
      ...options.context
    }

    if (options.cause) {
      this.cause = options.cause
      this.stack = options.cause.stack
    }
  }

  toStructured(): StructuredError {
    return {
      id: this.id,
      category: this.category,
      severity: this.severity,
      message: this.message,
      stack: this.stack,
      context: this.context,
      originalError: this.cause as Error,
      isRecoverable: this.isRecoverable,
      recoveryActions: this.recoveryActions,
      userFriendlyMessage: this.userFriendlyMessage
    }
  }
}

// Error Factory Functions
export const createNetworkError = (message: string, context?: Partial<ErrorContext>) =>
  new FigmaPluginError(message, {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    context: context || {},
    isRecoverable: true,
    recoveryActions: ['Check your internet connection', 'Retry the operation'],
    userFriendlyMessage: 'Network connection issue. Please check your connection and try again.'
  })

export const createFigmaAPIError = (message: string, context?: Partial<ErrorContext>) =>
  new FigmaPluginError(message, {
    category: ErrorCategory.FIGMA_API,
    severity: ErrorSeverity.HIGH,
    context: context || {},
    isRecoverable: true,
    recoveryActions: ['Refresh the plugin', 'Check Figma permissions'],
    userFriendlyMessage: 'Figma API issue. Please refresh the plugin and try again.'
  })

export const createValidationError = (message: string, context?: Partial<ErrorContext>) =>
  new FigmaPluginError(message, {
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    context: context || {},
    isRecoverable: true,
    recoveryActions: ['Check your input', 'Correct the highlighted fields'],
    userFriendlyMessage: 'Please check your input and try again.'
  })

export const createSystemError = (message: string, context?: Partial<ErrorContext>) =>
  new FigmaPluginError(message, {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    context: context || {},
    isRecoverable: false,
    recoveryActions: ['Restart the plugin', 'Contact support'],
    userFriendlyMessage: 'A system error occurred. Please restart the plugin or contact support.'
  })

// Utility Functions
function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function isRecoverableError(error: unknown): boolean {
  if (error instanceof FigmaPluginError) {
    return error.isRecoverable
  }
  return true // Assume recoverable for unknown errors
}

export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (error instanceof FigmaPluginError) {
    return error.severity
  }
  return ErrorSeverity.MEDIUM
}

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof FigmaPluginError && error.userFriendlyMessage) {
    return error.userFriendlyMessage
  }
  return 'An unexpected error occurred. Please try again.'
}

// Error Conversion Utilities
export function convertToFigmaError(error: unknown, context?: Partial<ErrorContext>): FigmaPluginError {
  if (error instanceof FigmaPluginError) {
    return error
  }

  if (error instanceof Error) {
    return new FigmaPluginError(error.message, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      context: context || {},
      cause: error,
      isRecoverable: true
    })
  }

  return new FigmaPluginError(String(error), {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    context: context || {},
    isRecoverable: true
  })
}

// Error Retry Utilities
export interface RetryOptions {
  maxAttempts: number
  delay: number
  backoffMultiplier?: number
  shouldRetry?: (error: unknown) => boolean
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: unknown
  const { maxAttempts, delay, backoffMultiplier = 1.5, shouldRetry = isRecoverableError } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error
      }

      const currentDelay = delay * Math.pow(backoffMultiplier, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, currentDelay))
    }
  }

  throw lastError
} 