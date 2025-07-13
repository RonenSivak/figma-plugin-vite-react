import React, { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Box, Text, Button, Card } from '@wix/design-system'
import type { StructuredError } from '../../common/errors'
import { convertToFigmaError, getUserFriendlyMessage } from '../../common/errors'
import { createUILogger } from '../../common/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error?: StructuredError
  errorId?: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: StructuredError, errorInfo: ErrorInfo) => void
  maxRetries?: number
  showDetails?: boolean
  level?: 'page' | 'component' | 'section'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private logger = createUILogger()

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error: convertToFigmaError(error, { environment: 'UI' }).toStructured(),
      errorId: `boundary_${Date.now()}`,
      retryCount: 0
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const structuredError = convertToFigmaError(error, {
      environment: 'UI',
      componentStack: errorInfo.componentStack || undefined,
      errorBoundary: this.props.level || 'component'
    })

    this.logger.error('Error caught by boundary', structuredError, {
      level: this.props.level,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    })

    if (this.props.onError) {
      this.props.onError(structuredError.toStructured(), errorInfo)
    }
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount < maxRetries) {
      this.logger.info('Retrying after error', {
        errorId: this.state.errorId,
        retryCount: this.state.retryCount + 1
      })
      
      this.setState(prevState => ({
        hasError: false,
        error: undefined,
        errorId: undefined,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  handleReset = () => {
    this.logger.info('Resetting error boundary', {
      errorId: this.state.errorId
    })
    
    this.setState({
      hasError: false,
      error: undefined,
      errorId: undefined,
      retryCount: 0
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const maxRetries = this.props.maxRetries || 3
      const canRetry = this.state.retryCount < maxRetries
      const userMessage = getUserFriendlyMessage(this.state.error)

      return (
        <Box padding="SP4" direction="vertical" gap="SP4" align="center">
          <Card>
            <Card.Content>
              <Box direction="vertical" gap="SP3" padding="SP4" align="center">
                <Text size="medium" weight="bold" skin="error">
                  ⚠️ Something went wrong
                </Text>
                
                <Text size="medium" align="center">
                  {userMessage}
                </Text>

                <Box direction="horizontal" gap="SP3">
                  {canRetry && (
                    <Button 
                      onClick={this.handleRetry}
                      skin="premium"
                      size="medium"
                    >
                      Try Again ({maxRetries - this.state.retryCount} left)
                    </Button>
                  )}
                  
                  <Button 
                    onClick={this.handleReset}
                    skin="standard"
                    size="medium"
                  >
                    Reset
                  </Button>
                </Box>

                {this.props.showDetails && this.state.error && (
                  <Box direction="vertical" gap="SP2" width="100%">
                    <Text size="small" weight="bold">Error Details:</Text>
                    <Box 
                      padding="SP2" 
                      backgroundColor="D80" 
                      borderRadius="4px"
                      width="100%"
                    >
                      <Text size="tiny" family="monospace">
                        ID: {this.state.errorId}
                      </Text>
                      <Text size="tiny" family="monospace">
                        Category: {this.state.error.category}
                      </Text>
                      <Text size="tiny" family="monospace">
                        Severity: {this.state.error.severity}
                      </Text>
                      {this.state.error.stack && (
                        <Text size="tiny" family="monospace">
                          Stack: {this.state.error.stack.split('\n')[0]}
                        </Text>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Card.Content>
          </Card>
        </Box>
      )
    }

    return this.props.children
  }
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{
  children: ReactNode
  onError?: (error: StructuredError, errorInfo: ErrorInfo) => void
}> = ({ children, onError }) => (
  <ErrorBoundary 
    level="page" 
    maxRetries={2}
    showDetails={false}
    onError={onError}
  >
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: StructuredError, errorInfo: ErrorInfo) => void
}> = ({ children, fallback, onError }) => (
  <ErrorBoundary 
    level="component" 
    maxRetries={3}
    showDetails={false}
    fallback={fallback}
    onError={onError}
  >
    {children}
  </ErrorBoundary>
)

export const SectionErrorBoundary: React.FC<{
  children: ReactNode
  onError?: (error: StructuredError, errorInfo: ErrorInfo) => void
}> = ({ children, onError }) => (
  <ErrorBoundary 
    level="section" 
    maxRetries={1}
    showDetails={true}
    onError={onError}
  >
    {children}
  </ErrorBoundary>
) 