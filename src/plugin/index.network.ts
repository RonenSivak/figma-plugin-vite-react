import { PLUGIN, UI } from '../common/networks'
import { handleMessageError, safelyExecuteAsync } from './errorHandler'

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

// ---------- Selection tracking

export const startSelectionListener = () => {
  // Track selection changes
  figma.on('selectionchange', () => {
    const selection = figma.currentPage.selection
    if (selection.length > 0) {
      const selectedNode = selection[0]
      if (selectedNode.type === 'TEXT') {
        console.log('Text node selected:', selectedNode.characters)
        // Send click notification to UI
        PLUGIN_CHANNEL.emit(UI, 'textClicked', [selectedNode.id, selectedNode.characters])
      }
    }
  })
}

// ---------- Message handlers

PLUGIN_CHANNEL.registerMessageHandler('ping', async (count) => {
  return await safelyExecuteAsync(async () => {
    console.log('Plugin received ping with count:', count, 'responding with pong')
    return `pong: ${count}`
  }, { source: 'ping_handler', messageType: 'ping' })
})

PLUGIN_CHANNEL.registerMessageHandler('message', async (text) => {
  return await safelyExecuteAsync(async () => {
    console.log('Plugin received message:', text)
    return `received ${text} from plugin`
  }, { source: 'message_handler', messageType: 'message' })
})

PLUGIN_CHANNEL.registerMessageHandler('createText', async (text) => {
  return await safelyExecuteAsync(async () => {
    console.log('Plugin creating text:', text)

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
  }, { 
    source: 'create_text_handler', 
    messageType: 'createText',
    textContent: text 
  })
})

// Add error handler for UI messages
PLUGIN_CHANNEL.registerMessageHandler('error', async (error, context) => {
  console.log('Received error from UI:', error, context)
  // Log the error from UI side
  handleMessageError(error, 'ui_error')
  return 'Error logged'
})
