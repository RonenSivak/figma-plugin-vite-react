import { useState, useEffect, useRef } from 'react'
import { Box, Button, Text, Loader, Modal } from '@wix/design-system'
import { UI_CHANNEL } from '../App.network'
import { PLUGIN } from '../../common/networks'
import type {
  OAuthConfig,
  OAuthTokens,
} from '../../common/oauth'
import { generatePKCEPair } from '../../common/oauth'

interface AuthManagerProps {
  onAuthStateChange: (isAuthenticated: boolean) => void
  config?: OAuthConfig
}

const OAUTH_SERVER_URL = process.env.REACT_APP_OAUTH_SERVER_URL || 'http://localhost:3001'

export const AuthManager: React.FC<AuthManagerProps> = ({ 
  onAuthStateChange
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  // Notify parent of auth state changes
  useEffect(() => {
    onAuthStateChange(isAuthenticated)
  }, [isAuthenticated, onAuthStateChange])

  // Listen for OAuth success messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Accept messages from our OAuth server
      if (!event.origin.includes('localhost:3001') && event.origin !== 'https://www.figma.com') return
      
      if (event.data.pluginMessage?.type === 'oauth-success') {
        handleOAuthSuccess(event.data.pluginMessage.tokens)
      } else if (event.data.pluginMessage?.type === 'oauth-error') {
        setError(event.data.pluginMessage.error)
        setIsLoading(false)
        setShowOAuthModal(false)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const checkAuthStatus = async () => {
    try {
      const hasValidToken = await UI_CHANNEL.request(PLUGIN, 'checkAuthStatus', [])
      setIsAuthenticated(hasValidToken)
    } catch (error) {
      console.error('Error checking auth status:', error)
      setIsAuthenticated(false)
    }
  }

  const startOAuthFlow = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Generate PKCE pair
      const { codeVerifier, codeChallenge } = generatePKCEPair()
      
      // Store code verifier for later use
      await UI_CHANNEL.request(PLUGIN, 'saveCodeVerifier', [codeVerifier])
      
      // Create OAuth initialization URL
      const oauthInitUrl = `${OAUTH_SERVER_URL}/oauth/init?codeChallenge=${codeChallenge}&codeVerifier=${codeVerifier}`
      
      // Show the OAuth modal
      setShowOAuthModal(true)
      
      // Wait for iframe to load and set its source
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = oauthInitUrl
        }
      }, 100)
      
    } catch (error) {
      console.error('OAuth flow error:', error)
      setError(error instanceof Error ? error.message : 'Authentication failed')
      setIsLoading(false)
    }
  }

  const handleOAuthSuccess = async (receivedTokens: OAuthTokens) => {
    try {
      // Save tokens to plugin storage
      await UI_CHANNEL.request(PLUGIN, 'saveToken', [JSON.stringify(receivedTokens)])
      
      // Clear code verifier
      await UI_CHANNEL.request(PLUGIN, 'clearCodeVerifier', [])
      
      setIsAuthenticated(true)
      setError(null)
      setIsLoading(false)
      setShowOAuthModal(false)
      
      console.log('OAuth authentication successful')
    } catch (error) {
      console.error('Error saving tokens:', error)
      setError('Failed to save authentication tokens')
      setIsLoading(false)
      setShowOAuthModal(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await UI_CHANNEL.request(PLUGIN, 'clearToken', [])
      await UI_CHANNEL.request(PLUGIN, 'clearCodeVerifier', [])
      setIsAuthenticated(false)
      setError(null)
    } catch (error) {
      console.error('Error signing out:', error)
      setError('Failed to sign out')
    }
  }

  const handleCancelAuth = () => {
    setIsLoading(false)
    setShowOAuthModal(false)
    setError(null)
  }

  const refreshAuthStatus = async () => {
    setIsLoading(true)
    await checkAuthStatus()
    setIsLoading(false)
  }

  return (
    <>
      {/* Compact Header Bar */}
      <Box 
        direction="horizontal" 
        width="100%"
        align="center" 
        gap="SP2"
        padding="SP2"
        style={{ 
          justifyContent: 'space-between',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#fafafa',
          borderRadius: '8px 8px 0 0'
        }}
      >
        <Box direction="horizontal" align="center" gap="SP2">
          <Text size="small" weight="bold">
            🔐
          </Text>
          <Text size="small">
            {isAuthenticated ? (
              <span style={{ color: '#28a745' }}>✅ Authenticated</span>
            ) : (
              <span style={{ color: '#dc3545' }}>❌ Not signed in</span>
            )}
          </Text>
        </Box>

        <Box direction="horizontal" align="center" gap="SP1">
          {isLoading && <Loader size="tiny" />}
          
          {isAuthenticated ? (
            <Button
              onClick={handleSignOut}
              size="tiny"
              skin="light"
              disabled={isLoading}
            >
              Sign Out
            </Button>
          ) : (
            <Button
              onClick={startOAuthFlow}
              size="tiny"
              skin="premium"
              disabled={isLoading}
            >
              Sign In
            </Button>
          )}

          <Button
            onClick={refreshAuthStatus}
            size="tiny"
            skin="transparent"
            disabled={isLoading}
            title="Refresh auth status"
          >
            🔄
          </Button>
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Box padding="SP2" backgroundColor="R10" style={{ fontSize: '12px' }}>
          <Text size="tiny" skin="error">
            {error}
          </Text>
        </Box>
      )}

      {/* OAuth Modal */}
      <Modal
        isOpen={showOAuthModal}
        onRequestClose={handleCancelAuth}
        shouldCloseOnOverlayClick={true}
        contentLabel="OAuth Authentication"
      >
        <Box direction="vertical" gap="SP3" padding="SP4" style={{ backgroundColor: 'white', width: '500px', height: '450px' }}>
          <Box direction="horizontal" align="center" style={{ justifyContent: 'space-between' }}>
            <Text size="medium" weight="bold">
              🔐 Sign In
            </Text>
            <Button
              onClick={handleCancelAuth}
              size="tiny"
              skin="light"
            >
              ✕
            </Button>
          </Box>
          
          <Text size="small" secondary>
            Please complete the authentication process in the frame below:
          </Text>
          
          <Box style={{ 
            flex: 1, 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <iframe
              ref={iframeRef}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              title="OAuth Authentication"
            />
          </Box>
          
          {isLoading && (
            <Box direction="horizontal" gap="SP2" align="center" style={{ justifyContent: 'center' }}>
              <Loader size="small" />
              <Text size="small">Initializing authentication...</Text>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  )
} 