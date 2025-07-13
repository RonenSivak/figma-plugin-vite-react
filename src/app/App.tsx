import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  Button,
  Text,
  Input,
  Loader,
  WixDesignSystemProvider,
} from '@wix/design-system'
import { UI_CHANNEL, setBootstrapCallback } from './App.network'
import { PLUGIN } from '../common/networks'
import { PageErrorBoundary, ComponentErrorBoundary } from './components/ErrorBoundary'
import { createUILogger } from '../common/logger'
import { convertToFigmaError } from '../common/errors'
import type { StructuredError } from '../common/errors'
import type { ErrorInfo } from 'react'

const logger = createUILogger()

function App() {
  const [message, setMessage] = useState('')
  const [textToCreate, setTextToCreate] = useState('')
  const [response, setResponse] = useState('')
  const [clickInfo, setClickInfo] = useState('')
  const [clickedText, setClickedText] = useState('')
  const [generatedKey, setGeneratedKey] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pongCount, setPongCount] = useState(0)
  const [pluginReady, setPluginReady] = useState(false)

  // Global error handler for the app
  const handleGlobalError = (error: unknown) => {
    const structuredError = convertToFigmaError(error, { environment: 'UI' }).toStructured()
    logger.error('Global app error', structuredError)
    // Send error to plugin for centralized logging
    try {
      if (pluginReady) {
        UI_CHANNEL.emit(PLUGIN, 'error', [structuredError, { source: 'ui_global' }])
      }
    } catch (emitError) {
      console.warn('Failed to send error to plugin:', emitError)
    }
  }

  // Error boundary error handler
  const handleBoundaryError = (error: StructuredError, errorInfo: ErrorInfo) => {
    logger.error('Error boundary caught error', error, { errorInfo })
    // Send error to plugin for centralized logging
    try {
      if (pluginReady) {
        UI_CHANNEL.emit(PLUGIN, 'error', [error, { source: 'ui_boundary', errorInfo }])
      }
    } catch (emitError) {
      console.warn('Failed to send error to plugin:', emitError)
    }
  }

  // Wait for plugin bootstrap before showing UI
  useEffect(() => {
    // Set bootstrap completion callback
    setBootstrapCallback((flag: boolean) => {
      setPluginReady(flag)
    })

    // Listen for text click notifications from plugin
    UI_CHANNEL.registerMessageHandler('textClicked', (nodeId, text) => {
      setClickInfo(`user clicked on ${nodeId} with text "${text}"`)
      setClickedText(text)
      setGeneratedKey('') // Clear previous key
    })

    // Listen for error messages from plugin
    UI_CHANNEL.registerMessageHandler('error', (error, context) => {
      logger.error('Error from plugin', error, context)
      console.warn('Plugin error:', error, context)
    })
  }, [pluginReady])

  // Convert text to kebab-case and create babel key
  const generateKey = () => {
    if (!clickedText.trim()) return

    const kebabCase = clickedText
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens

    const key = `babel.key.${kebabCase}`
    setGeneratedKey(key)
  }

  const handlePing = async () => {
    try {
      setIsLoading(true)
      const newCount = pongCount + 1
      setPongCount(newCount)

      const result = await UI_CHANNEL.request(PLUGIN, 'ping', [newCount])
      setResponse(String(result))
    } catch (error) {
      setResponse(`Error: ${error}`)
      handleGlobalError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      setIsLoading(true)
      const result = await UI_CHANNEL.request(PLUGIN, 'message', [message])
      setResponse(String(result))
      setMessage('')
    } catch (error) {
      setResponse(`Error: ${error}`)
      handleGlobalError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateText = async () => {
    if (!textToCreate.trim()) return

    try {
      setIsLoading(true)
      const result = await UI_CHANNEL.request(PLUGIN, 'createText', [
        textToCreate,
      ])
      setResponse(String(result))
      setTextToCreate('')
    } catch (error) {
      setResponse(`Error: ${error}`)
      handleGlobalError(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key press for inputs
  const handleMessageKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && message.trim()) {
      handleSendMessage()
    }
  }

  const handleTextKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && textToCreate.trim()) {
      handleCreateText()
    }
  }

  // Show loading state until plugin is ready
  if (!pluginReady) {
    return (
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <PageErrorBoundary onError={handleBoundaryError}>
          <Box
            padding="SP6"
            direction="vertical"
            gap="SP4"
            align="center"
            height="100vh"
            verticalAlign="middle"
          >
            <ComponentErrorBoundary>
              <Box direction="vertical" gap="SP3" align="center">
                <Loader size="medium" />
                <Text size="medium" weight="bold">
                  Initializing Plugin...
                </Text>
                <Text size="small" secondary>
                  Waiting for Figma plugin to load
                </Text>
              </Box>
            </ComponentErrorBoundary>
          </Box>
        </PageErrorBoundary>
      </WixDesignSystemProvider>
    )
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <PageErrorBoundary onError={handleBoundaryError}>
        <Box
          padding="SP6"
          direction="vertical"
          gap="SP4"
          align="center"
          height="100vh"
          verticalAlign="middle"
        >
          <ComponentErrorBoundary>
            <Text size="medium" weight="bold">
              🎯 Figma Plugin
            </Text>
          </ComponentErrorBoundary>

          <ComponentErrorBoundary>
            <Card>
              <Card.Content>
                <Box direction="vertical" gap="SP4" width="350px" padding="SP4">
                  {/* Ping Button */}
                  <ComponentErrorBoundary>
                    <Button
                      onClick={handlePing}
                      disabled={isLoading}
                      size="large"
                      skin="premium"
                      fullWidth
                    >
                      {isLoading ? 'Pinging...' : '🏓 Ping'}
                    </Button>
                  </ComponentErrorBoundary>

                  {/* Message Input */}
                  <ComponentErrorBoundary>
                    <Input
                      placeholder="Type message (e.g., 'Hi')"
                      value={message}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMessage(e.target.value)
                      }
                      onKeyDown={handleMessageKeyPress}
                    />

                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !message.trim()}
                      size="large"
                      skin="dark"
                      fullWidth
                    >
                      {isLoading ? 'Sending...' : '📤 Send'}
                    </Button>
                  </ComponentErrorBoundary>

                  {/* Text Creation */}
                  <ComponentErrorBoundary>
                    <Input
                      placeholder="Enter text to create in Figma"
                      value={textToCreate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTextToCreate(e.target.value)
                      }
                      onKeyDown={handleTextKeyPress}
                    />

                    <Button
                      onClick={handleCreateText}
                      disabled={isLoading || !textToCreate.trim()}
                      size="large"
                      skin="standard"
                      fullWidth
                    >
                      {isLoading ? 'Creating...' : '📝 Create Text'}
                    </Button>
                  </ComponentErrorBoundary>

                  {/* Simple Response Display */}
                  {response && (
                    <ComponentErrorBoundary>
                      <Box padding="SP3" backgroundColor="D80" borderRadius="4px">
                        <Text size="small">{response}</Text>
                      </Box>
                    </ComponentErrorBoundary>
                  )}

                  {/* Click Info Display with Generate Key */}
                  {clickInfo && (
                    <ComponentErrorBoundary>
                      <Box
                        padding="SP3"
                        backgroundColor="B40"
                        borderRadius="4px"
                        direction="vertical"
                        gap="SP2"
                      >
                        <Text size="small" weight="bold">
                          Auto-detected click:
                        </Text>
                        <Text size="small">{clickInfo}</Text>

                        <Button
                          onClick={generateKey}
                          disabled={!clickedText.trim()}
                          size="small"
                          skin="light"
                          fullWidth
                        >
                          🔑 Generate Key
                        </Button>

                        {generatedKey && (
                          <Box
                            padding="SP2"
                            backgroundColor="G50"
                            borderRadius="4px"
                            gap="SP1"
                          >
                            <Text size="small" weight="bold">
                              Generated Key:
                            </Text>
                            <Text size="small" skin="standard">
                              {generatedKey}
                            </Text>
                          </Box>
                        )}
                      </Box>
                    </ComponentErrorBoundary>
                  )}
                </Box>
              </Card.Content>
            </Card>
          </ComponentErrorBoundary>
        </Box>
      </PageErrorBoundary>
    </WixDesignSystemProvider>
  )
}

export default App
