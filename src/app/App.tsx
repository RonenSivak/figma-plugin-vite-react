import { useState, useEffect } from 'react'
import { Box, Card, Button, Text, Input, Loader } from '@wix/design-system'
import { UI_CHANNEL, setBootstrapCallback } from './App.network'
import { PLUGIN } from '../common/networks'

function App() {
  const [message, setMessage] = useState('')
  const [textToCreate, setTextToCreate] = useState('')
  const [response, setResponse] = useState('')
  const [clickInfo, setClickInfo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pongCount, setPongCount] = useState(0)
  const [isBootstrapped, setIsBootstrapped] = useState(false)

  // Wait for plugin bootstrap before showing UI
  useEffect(() => {    
    // Set bootstrap completion callback
    setBootstrapCallback((flag: boolean) => {
      setIsBootstrapped(flag);
    });

    // Listen for text click notifications from plugin
    UI_CHANNEL.registerMessageHandler("textClicked", (nodeId, text) => {
      setClickInfo(`user clicked on ${nodeId} with text "${text}"`)
    });
  }, [])

  const handlePing = async () => {
    try {
      setIsLoading(true)
      const newCount = pongCount + 1
      setPongCount(newCount)
      
      const result = await UI_CHANNEL.request(PLUGIN, "ping", [newCount])
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
      const result = await UI_CHANNEL.request(PLUGIN, "message", [message])
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
      const result = await UI_CHANNEL.request(PLUGIN, "createText", [textToCreate])
      setResponse(String(result))
      setTextToCreate('')
    } catch (error) {
      setResponse(`Error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state until plugin is bootstrapped
  if (!isBootstrapped) {
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
          <Text size="medium" weight="bold">Initializing Plugin...</Text>
          <Text size="small" secondary>Waiting for Figma plugin to load</Text>
        </Box>
      </Box>
    )
  }

  return (
    <Box 
      padding="SP6" 
      direction="vertical" 
      gap="SP4" 
      align="center"
      height="100vh"
      verticalAlign="middle"
    >
      <Text size="medium" weight="bold">🎯 Figma Plugin</Text>
      
      <Card>
        <Card.Content>
          <Box 
            direction="vertical" 
            gap="SP4" 
            width="350px"
            padding="SP4"
          >
            
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleSendMessage()}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextToCreate(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && !isLoading && handleCreateText()}
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
            
            {/* Simple Response Display */}
            {response && (
              <Box 
                padding="SP3" 
                backgroundColor="D80" 
                borderRadius="4px"
              >
                <Text size="small">{response}</Text>
              </Box>
            )}

            {/* Click Info Display */}
            {clickInfo && (
              <Box 
                padding="SP3" 
                backgroundColor="B10" 
                borderRadius="4px"
              >
                <Text size="small" weight="bold">Auto-detected click:</Text>
                <Text size="small">{clickInfo}</Text>
              </Box>
            )}
            
          </Box>
        </Card.Content>
      </Card>
    </Box>
  )
}

export default App
