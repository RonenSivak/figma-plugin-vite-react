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
import { AuthManager } from './components/AuthManager'

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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

    // Listen for auth status changes from plugin
    UI_CHANNEL.registerMessageHandler('authStatusChanged', (authenticated) => {
      setIsAuthenticated(authenticated)
    })
  }, [])

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
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateText = async () => {
    if (!textToCreate.trim()) return

    try {
      setIsLoading(true)
      const result = await UI_CHANNEL.request(PLUGIN, 'createText', [textToCreate])
      setResponse(String(result))
      setTextToCreate('')
    } catch (error) {
      setResponse(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAuthText = async () => {
    if (!textToCreate.trim()) return

    try {
      setIsLoading(true)
      const result = await UI_CHANNEL.request(PLUGIN, 'createTextAuth', [textToCreate])
      setResponse(String(result))
      setTextToCreate('')
    } catch (error) {
      setResponse(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthStateChange = (authenticated: boolean) => {
    setIsAuthenticated(authenticated)
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (event.key === 'Enter' && !isLoading) {
      action()
    }
  }

  // Show loading state until plugin is ready
  if (!pluginReady) {
    return (
      <Box
        padding="SP6"
        direction="vertical"
        gap="SP4"
        align="center"
        height="100vh"
        verticalAlign="middle"
      >
        <Box direction="vertical" gap="SP3" align="center">
          <Loader size="medium" />
          <Text size="medium" weight="bold">
            Initializing Plugin...
          </Text>
          <Text size="small" secondary>
            Waiting for Figma plugin to load
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <WixDesignSystemProvider features={{ newColorsBranding: true }}>
      <AuthManager onAuthStateChange={handleAuthStateChange} />
      <Box
        padding="SP6"
        direction="vertical"
        gap="SP4"
        align="center"
        height="100vh"
        verticalAlign="middle"
      >
       

        <Text size="medium" weight="bold">
          🎯 Figma Plugin
        </Text>

        <Card>
          
          
          <Card.Content>
            <Box direction="vertical" gap="SP4" width="350px" padding="SP4">

              {/* Ping Button */}
              <Button
                onClick={handlePing}
                disabled={isLoading}
                size="large"
                skin="premium"
                fullWidth
              >
                {isLoading ? 'Pinging...' : '🏓 Ping'}
              </Button>

              {/* Message Input */}
              <Input
                placeholder="Type message (e.g., 'Hi')"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMessage(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  handleKeyPress(e, handleSendMessage)
                }
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

              {/* Text Creation */}
              <Input
                placeholder="Enter text to create in Figma"
                value={textToCreate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTextToCreate(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                  handleKeyPress(e, handleCreateText)
                }
              />

              <Box direction="horizontal" gap="SP2">
                <Button
                  onClick={handleCreateText}
                  disabled={isLoading || !textToCreate.trim()}
                  size="large"
                  skin="standard"
                  fullWidth
                >
                  {isLoading ? 'Creating...' : '📝 Create Text'}
                </Button>
                <Button
                  onClick={handleCreateAuthText}
                  disabled={isLoading || !textToCreate.trim() || !isAuthenticated}
                  size="large"
                  skin="premium"
                  fullWidth
                  tooltip={!isAuthenticated ? 'Authentication required' : ''}
                >
                  {isLoading ? 'Creating...' : '🔐 Create (Auth)'}
                </Button>
              </Box>

              {/* Simple Response Display */}
              {response && (
                <Box padding="SP3" backgroundColor="D80" borderRadius="4px">
                  <Text size="small">{response}</Text>
                </Box>
              )}

              {/* Click Info Display with Generate Key */}
              {clickInfo && (
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
              )}
            </Box>
          </Card.Content>
        </Card>
      </Box>
    </WixDesignSystemProvider>
  )
}

export default App
