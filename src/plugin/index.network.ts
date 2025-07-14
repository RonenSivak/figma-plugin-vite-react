import { PLUGIN, UI } from '../common/networks'
import type { OAuthTokens } from '../common/oauth'
import { isTokenValid } from '../common/oauth'

export const PLUGIN_CHANNEL = PLUGIN.channelBuilder()
  .emitsTo(UI, message => {
    figma.ui.postMessage(message)
  })
  .receivesFrom(UI, next => {
    const listener: MessageEventHandler = event => next(event)
    figma.ui.on('message', listener)
    return () => figma.ui.off('message', listener)
  })
  .startListening()

// ---------- OAuth Token Management
const TOKEN_STORAGE_KEY = 'oauth_tokens'
const CODE_VERIFIER_STORAGE_KEY = 'oauth_code_verifier'

PLUGIN_CHANNEL.registerMessageHandler('checkAuthStatus', async () => {
  try {
    const tokenString = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY)
    if (!tokenString) {
      console.log('No tokens found in storage')
      return false
    }

    const tokens: OAuthTokens = JSON.parse(tokenString)
    const isValid = isTokenValid(tokens)
    
    console.log('Auth status check:', { hasToken: !!tokens.accessToken, isValid })
    return isValid
  } catch (error) {
    console.error('Error checking auth status:', error)
    return false
  }
})

PLUGIN_CHANNEL.registerMessageHandler('saveToken', async (tokenString: string) => {
  try {
    // Validate token format
    const tokens: OAuthTokens = JSON.parse(tokenString)
    if (!tokens.accessToken) {
      throw new Error('Invalid token format: missing access token')
    }

    await figma.clientStorage.setAsync(TOKEN_STORAGE_KEY, tokenString)
    console.log('Tokens saved successfully')
    
    // Notify UI of auth state change
    PLUGIN_CHANNEL.emit(UI, 'authStatusChanged', [true])
    
    return
  } catch (error) {
    console.error('Error saving token:', error)
    throw new Error('Failed to save authentication tokens')
  }
})

PLUGIN_CHANNEL.registerMessageHandler('getToken', async () => {
  try {
    const tokenString = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY)
    if (!tokenString) {
      return null
    }

    const tokens: OAuthTokens = JSON.parse(tokenString)
    
    // Check if token is still valid
    if (!isTokenValid(tokens)) {
      console.log('Token expired, clearing storage')
      await figma.clientStorage.deleteAsync(TOKEN_STORAGE_KEY)
      PLUGIN_CHANNEL.emit(UI, 'authStatusChanged', [false])
      return null
    }

    return tokenString
  } catch (error) {
    console.error('Error getting token:', error)
    return null
  }
})

PLUGIN_CHANNEL.registerMessageHandler('clearToken', async () => {
  try {
    await figma.clientStorage.deleteAsync(TOKEN_STORAGE_KEY)
    console.log('Tokens cleared successfully')
    
    // Notify UI of auth state change
    PLUGIN_CHANNEL.emit(UI, 'authStatusChanged', [false])
    
    return
  } catch (error) {
    console.error('Error clearing token:', error)
    throw new Error('Failed to clear authentication tokens')
  }
})

// ---------- OAuth Code Verifier Management
PLUGIN_CHANNEL.registerMessageHandler('saveCodeVerifier', async (codeVerifier: string) => {
  try {
    await figma.clientStorage.setAsync(CODE_VERIFIER_STORAGE_KEY, codeVerifier)
    console.log('Code verifier saved successfully')
    return
  } catch (error) {
    console.error('Error saving code verifier:', error)
    throw new Error('Failed to save code verifier')
  }
})

PLUGIN_CHANNEL.registerMessageHandler('getCodeVerifier', async () => {
  try {
    const codeVerifier = await figma.clientStorage.getAsync(CODE_VERIFIER_STORAGE_KEY)
    return codeVerifier
  } catch (error) {
    console.error('Error getting code verifier:', error)
    return null
  }
})

PLUGIN_CHANNEL.registerMessageHandler('clearCodeVerifier', async () => {
  try {
    await figma.clientStorage.deleteAsync(CODE_VERIFIER_STORAGE_KEY)
    console.log('Code verifier cleared successfully')
    return
  } catch (error) {
    console.error('Error clearing code verifier:', error)
    throw new Error('Failed to clear code verifier')
  }
})

// ---------- Selection management
let selectionListenerActive = false
let selectionChangeHandler: (() => void) | null = null

const handleSelectionChange = () => {
  const selection = figma.currentPage.selection

  if (selection.length === 1) {
    const node = selection[0]

    // Check if the selected node is a text node
    if (node.type === 'TEXT') {
      console.log('Text node selected:', node.id, node.characters)

      // Send notification to UI
      PLUGIN_CHANNEL.emit(UI, 'textClicked', [node.id, node.characters])
    }
  }
}

// Export function to start selection listener (for direct use)
export const startSelectionListener = (): string => {
  console.log('Starting selection listener')

  if (!selectionListenerActive) {
    selectionChangeHandler = handleSelectionChange
    figma.on('selectionchange', selectionChangeHandler)
    selectionListenerActive = true
    return 'Selection listener started'
  } else {
    return 'Selection listener already active'
  }
}

// ---------- Existing Message handlers

PLUGIN_CHANNEL.registerMessageHandler('ping', count => {
  console.log('Plugin received ping with count:', count, 'responding with pong')
  return `pong: ${count}`
})

PLUGIN_CHANNEL.registerMessageHandler('pong', () => {
  console.log('Plugin received pong, responding with ping')
  return 'ping'
})

PLUGIN_CHANNEL.registerMessageHandler('message', text => {
  console.log('Plugin received message:', text)
  return `received ${text} from plugin`
})

// Enhanced createText handler
PLUGIN_CHANNEL.registerMessageHandler('createText', async (text: string) => {
  console.log('Plugin creating text:', text)

  try {
    // Load the default font first
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })

    // Create a text node in Figma
    const textNode = figma.createText()
    textNode.characters = text
    textNode.fontSize = 24
    textNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]

    // Add to current page
    figma.currentPage.appendChild(textNode)

    // Position it in the center of the viewport
    textNode.x = figma.viewport.center.x - textNode.width / 2
    textNode.y = figma.viewport.center.y - textNode.height / 2

    return `Created text: "${text}"`
  } catch (error) {
    console.error('Error creating text:', error)
    return `Error creating text: ${error}`
  }
})

// Add a separate handler for authenticated text creation
PLUGIN_CHANNEL.registerMessageHandler('createTextAuth', async (text: string) => {
  console.log('Plugin creating authenticated text:', text)

  try {
    // Check authentication
    const tokenString = await figma.clientStorage.getAsync(TOKEN_STORAGE_KEY)
    if (!tokenString) {
      throw new Error('Authentication required for this action')
    }

    const tokens: OAuthTokens = JSON.parse(tokenString)
    if (!isTokenValid(tokens)) {
      await figma.clientStorage.deleteAsync(TOKEN_STORAGE_KEY)
      PLUGIN_CHANNEL.emit(UI, 'authStatusChanged', [false])
      throw new Error('Authentication expired. Please sign in again.')
    }

    // Load the default font first
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' })

    // Create a text node in Figma
    const textNode = figma.createText()
    textNode.characters = text
    textNode.fontSize = 24
    textNode.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }]

    // Add to current page
    figma.currentPage.appendChild(textNode)

    // Position it in the center of the viewport
    textNode.x = figma.viewport.center.x - textNode.width / 2
    textNode.y = figma.viewport.center.y - textNode.height / 2

    return `Created authenticated text: "${text}"`
  } catch (error) {
    console.error('Error creating authenticated text:', error)
    return `Error creating authenticated text: ${error}`
  }
})

PLUGIN_CHANNEL.registerMessageHandler('hello', text => {
  console.log('UI side said:', text)
})

PLUGIN_CHANNEL.registerMessageHandler('helloAck', () => {
  console.log('Received hello-ack from UI, sending ready signal')
  // Step 3 of handshake: Send ready signal to UI
  PLUGIN_CHANNEL.emit(UI, 'ready', [])
})
