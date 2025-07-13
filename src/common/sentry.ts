import * as Sentry from '@sentry/react'
import { createLogger } from './logger'
import type { StructuredError } from './errors'

// Sentry configuration interface
export interface SentryConfig {
  dsn: string
  environment: string
  enabled: boolean
  debug?: boolean
  tracesSampleRate?: number
  sessionTracker?: boolean
  beforeSend?: (event: Sentry.ErrorEvent, hint: Sentry.EventHint) => Sentry.ErrorEvent | null
}

// Default Sentry configuration
const defaultSentryConfig: SentryConfig = {
  dsn: '', // Will be set via environment variable or config
  environment: 'production',
  enabled: false,
  debug: false,
  tracesSampleRate: 0.1,
  sessionTracker: true,
  beforeSend: (event) => {
    // Filter out development errors or sensitive data
    if (event.environment === 'development') {
      return null
    }
    return event
  }
}

// Logger instance for Sentry operations
const logger = createLogger({
  level: 'INFO',
  environment: 'UI',
  enableLocalStorage: true,
  maxLocalEntries: 100,
  enableCloudSync: false
})

// Sentry initialization state
let sentryInitialized = false
let sentryConfig: SentryConfig | null = null

/**
 * Initialize Sentry with optional configuration
 * Will only initialize if DSN is provided and enabled is true
 */
export const initializeSentry = (config?: Partial<SentryConfig>): boolean => {
  const finalConfig = { ...defaultSentryConfig, ...config }
  
  // Don't initialize if already initialized
  if (sentryInitialized) {
    logger.warn('Sentry already initialized')
    return false
  }

  // Don't initialize if not enabled or no DSN
  if (!finalConfig.enabled || !finalConfig.dsn) {
    logger.info('Sentry not enabled or no DSN provided')
    return false
  }

  try {
    Sentry.init({
      dsn: finalConfig.dsn,
      environment: finalConfig.environment,
      debug: finalConfig.debug || false,
      tracesSampleRate: finalConfig.tracesSampleRate || 0.1,
      beforeSend: finalConfig.beforeSend,
      integrations: [
        Sentry.browserTracingIntegration(),
        ...(finalConfig.sessionTracker ? [Sentry.feedbackIntegration()] : []),
      ],
      // Additional configuration for Figma plugin environment
      beforeBreadcrumb: (breadcrumb) => {
        // Filter out potentially sensitive breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
          return null
        }
        return breadcrumb
      },
      // Custom tags for Figma plugin
      initialScope: {
        tags: {
          component: 'figma-plugin',
          runtime: 'figma-ui'
        }
      }
    })

    sentryInitialized = true
    sentryConfig = finalConfig
    
    logger.info('Sentry initialized successfully', {
      environment: finalConfig.environment,
      dsn: finalConfig.dsn.substring(0, 20) + '...' // Log partial DSN for debugging
    })
    
    return true
  } catch (error) {
    logger.error('Failed to initialize Sentry', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

/**
 * Send structured error to Sentry
 */
export const sendErrorToSentry = (error: StructuredError, context?: Record<string, unknown>): void => {
  if (!sentryInitialized) {
    logger.debug('Sentry not initialized, skipping error report')
    return
  }

  try {
    Sentry.withScope((scope) => {
      // Set error context
      scope.setTag('error_category', error.category)
      scope.setTag('error_severity', error.severity)
      scope.setLevel(getSentryLevel(error.severity))
      scope.setContext('error_details', {
        id: error.id,
        category: error.category,
        severity: error.severity,
        isRecoverable: error.isRecoverable,
        ...error.context
      })

      if (context) {
        scope.setContext('additional_context', context)
      }

      // Create error object for Sentry
      const sentryError = new Error(error.message)
      sentryError.name = `FigmaPluginError_${error.category}`
      sentryError.stack = error.stack

      Sentry.captureException(sentryError)
    })

    logger.debug('Error sent to Sentry', { errorId: error.id })
  } catch (sentryError) {
    logger.error('Failed to send error to Sentry', sentryError instanceof Error ? sentryError : new Error(String(sentryError)))
  }
}

/**
 * Send custom event to Sentry
 */
export const sendEventToSentry = (
  message: string,
  level: 'info' | 'warning' | 'error' | 'debug' = 'info',
  context?: Record<string, unknown>
): void => {
  if (!sentryInitialized) {
    logger.debug('Sentry not initialized, skipping event')
    return
  }

  try {
    Sentry.withScope((scope) => {
      scope.setLevel(level)
      if (context) {
        scope.setContext('event_context', context)
      }
      Sentry.captureMessage(message, level)
    })

    logger.debug('Event sent to Sentry', { message, level })
  } catch (error) {
    logger.error('Failed to send event to Sentry', error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Add user context to Sentry
 */
export const setSentryUser = (user: {
  id?: string
  email?: string
  username?: string
  [key: string]: unknown
}): void => {
  if (!sentryInitialized) {
    return
  }

  try {
    Sentry.setUser(user)
    logger.debug('User context set in Sentry', { userId: user.id })
  } catch (error) {
    logger.error('Failed to set user context in Sentry', error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Set custom tags in Sentry
 */
export const setSentryTags = (tags: Record<string, string>): void => {
  if (!sentryInitialized) {
    return
  }

  try {
    Sentry.setTags(tags)
    logger.debug('Tags set in Sentry', tags)
  } catch (error) {
    logger.error('Failed to set tags in Sentry', error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Get Sentry initialization status
 */
export const isSentryInitialized = (): boolean => {
  return sentryInitialized
}

/**
 * Get current Sentry configuration
 */
export const getSentryConfig = (): SentryConfig | null => {
  return sentryConfig
}

/**
 * Convert error severity to Sentry level
 */
const getSentryLevel = (severity: string): Sentry.SeverityLevel => {
  switch (severity.toUpperCase()) {
    case 'CRITICAL':
      return 'fatal'
    case 'HIGH':
      return 'error'
    case 'MEDIUM':
      return 'warning'
    case 'LOW':
      return 'info'
    default:
      return 'error'
  }
}

/**
 * Create Sentry-wrapped error boundary
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary

/**
 * Create Sentry profiler for performance monitoring
 */
export const SentryProfiler = Sentry.Profiler

/**
 * Environment-based configuration helper
 */
export const createSentryConfigFromEnv = (): Partial<SentryConfig> => {
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'production',
    enabled: process.env.SENTRY_ENABLED === 'true',
    debug: process.env.SENTRY_DEBUG === 'true',
    tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE 
      ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) 
      : 0.1
  }
}

/**
 * Plugin-specific Sentry configuration
 */
export const getFigmaPluginSentryConfig = (): Partial<SentryConfig> => {
  return {
    ...createSentryConfigFromEnv(),
    beforeSend: (event) => {
      // Filter out Figma-specific noise
      if (event.exception?.values?.[0]?.value?.includes('figma is not defined')) {
        return null
      }
      
      // Filter out development errors
      if (event.environment === 'development') {
        return null
      }
      
      return event
    }
  }
} 