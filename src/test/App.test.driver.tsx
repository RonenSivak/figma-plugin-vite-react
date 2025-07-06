import { vi, expect } from 'vitest'
import { render, screen, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import App from '../app/App'

// Mock setup - encapsulated in driver
vi.mock('../app/App.network', () => ({
  UI_CHANNEL: {
    request: vi.fn(),
    emit: vi.fn(),
    registerMessageHandler: vi.fn(),
  },
  setBootstrapCallback: vi.fn(),
}))

vi.mock('../common/networks', () => ({
  PLUGIN: 'PLUGIN',
  UI: 'UI',
}))

import { UI_CHANNEL, setBootstrapCallback } from '../app/App.network'

export class AppTestDriver {
  private user: UserEvent
  private mockRequest = vi.mocked(UI_CHANNEL.request)
  private mockSetBootstrapCallback = vi.mocked(setBootstrapCallback)

  constructor() {
    this.user = userEvent.setup()
  }

  // GET - Retrieve elements, state, and perform assertions
  get = {
    // Element Queries
    loadingText: () => screen.getByText('Initializing Plugin...'),
    waitingText: () => screen.getByText('Waiting for Figma plugin to load'),
    mainTitle: () => screen.getByText('🎯 Figma Plugin'),
    pingButton: () => screen.getByText('🏓 Ping'),
    sendButton: () => screen.getByText('📤 Send'),
    createTextButton: () => screen.getByText('📝 Create Text'),
    messageInput: () => screen.getByPlaceholderText('Type message (e.g., \'Hi\')'),
    textInput: () => screen.getByPlaceholderText('Enter text to create in Figma'),
    generateKeyButton: () => screen.getByText('🔑 Generate Key'),

    // State Checks
    hasElement: (text: string): boolean => {
      try {
        screen.getByText(text)
        return true
      } catch {
        return false
      }
    },

    // Assertions
    expectLoadingState: () => {
      expect(screen.getByText('Initializing Plugin...')).toBeInTheDocument()
      expect(screen.getByText('Waiting for Figma plugin to load')).toBeInTheDocument()
      return this
    },

    expectMainUI: () => {
      expect(screen.getByText('🎯 Figma Plugin')).toBeInTheDocument()
      expect(screen.getByText('🏓 Ping')).toBeInTheDocument()
      expect(screen.getByText('📤 Send')).toBeInTheDocument()
      expect(screen.getByText('📝 Create Text')).toBeInTheDocument()
      return this
    },

    expectBootstrapCallbackSet: () => {
      expect(this.mockSetBootstrapCallback).toHaveBeenCalledWith(expect.any(Function))
      return this
    },

    expectPingRequest: (count: number = 1) => {
      expect(this.mockRequest).toHaveBeenCalledWith('PLUGIN', 'ping', [count])
      return this
    },

    expectMessageRequest: (message: string) => {
      expect(this.mockRequest).toHaveBeenCalledWith('PLUGIN', 'message', [message])
      return this
    },

    expectErrorMessage: async (errorText: string) => {
      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorText}`)).toBeInTheDocument()
      })
      return this
    },

    expectClickDetection: async (nodeId: string, text: string) => {
      await waitFor(() => {
        expect(screen.getByText('Auto-detected click:')).toBeInTheDocument()
        expect(screen.getByText(`user clicked on ${nodeId} with text "${text}"`)).toBeInTheDocument()
      })
      return this
    },

    expectGeneratedKey: async (key: string) => {
      await waitFor(() => {
        expect(screen.getByText(key)).toBeInTheDocument()
      })
      return this
    },

    waitForElement: async (text: string) => {
      await waitFor(() => {
        expect(screen.getByText(text)).toBeInTheDocument()
      })
      return this
    }
  }

  // WHEN - Perform user actions and interactions
  when = {
    clickPing: async () => {
      const pingButton = this.get.pingButton()
      await this.user.click(pingButton)
      return this
    },

    typeMessage: async (message: string) => {
      const messageInput = this.get.messageInput()
      await this.user.type(messageInput, message)
      return this
    },

    clickSend: async () => {
      const sendButton = this.get.sendButton()
      await this.user.click(sendButton)
      return this
    },

    sendMessage: async (message: string) => {
      await this.when.typeMessage(message)
      await this.when.clickSend()
      return this
    },

    simulateTextClick: async (nodeId: string, text: string) => {
      const mockRegisterMessageHandler = vi.mocked(UI_CHANNEL.registerMessageHandler)
      const textClickHandler = mockRegisterMessageHandler.mock.calls.find(
        call => call[0] === 'textClicked'
      )?.[1] as unknown as (nodeId: string, text: string) => void
      
      if (textClickHandler) {
        textClickHandler(nodeId, text)
      }
      return this
    },

    clickGenerateKey: async () => {
      const generateButton = this.get.generateKeyButton()
      await this.user.click(generateButton)
      return this
    }
  }

  // SET - Configure mocks, setup, and test state
  set = {
    reset: () => {
      vi.clearAllMocks()
      return this
    },

    renderApp: () => {
      render(<App />)
      return this
    },

    makePluginReady: async () => {
      const bootstrapCallback = this.mockSetBootstrapCallback.mock.calls[0][0]
      bootstrapCallback(true)
      await waitFor(() => screen.getByText('🎯 Figma Plugin'))
      return this
    },

    loadReadyApp: async () => {
      this.set.renderApp()
      await this.set.makePluginReady()
      return this
    },

    mockRequestSuccess: (result: string) => {
      this.mockRequest.mockResolvedValue(result)
      return this
    },

    mockRequestError: (error: Error) => {
      this.mockRequest.mockRejectedValue(error)
      return this
    }
  }
} 