import { expect, Page } from '@playwright/test'

export class E2eTestDriver {
  constructor(private page: Page) {}

  // GET - Element queries and assertions
  get = {
    // Element Queries
    title: () => this.page.getByText('🎯 Figma Plugin'),
    pingButton: () => this.page.getByRole('button', { name: /ping/i }),
    sendButton: () => this.page.getByRole('button', { name: /send/i }),
    createTextButton: () => this.page.getByRole('button', { name: /create text/i }),
    messageInput: () => this.page.getByPlaceholder("Type message (e.g., 'Hi')"),
    textInput: () => this.page.getByPlaceholder('Enter text to create in Figma'),
    loadingText: () => this.page.getByText('Initializing Plugin...'),
    
    // Response Elements
    response: (text: string) => this.page.getByText(text),
    
    // Assertions
    expectMainAppVisible: async () => {
      await expect(this.get.title()).toBeVisible()
      return this
    },

    expectLoadingState: async () => {
      await expect(this.get.loadingText()).toBeVisible()
      return this
    },

    expectResponse: async (expectedText: string, timeout = 3000) => {
      await expect(this.get.response(expectedText)).toBeVisible({ timeout })
      return this
    },

    expectButtonEnabled: async (buttonLocator: ReturnType<typeof this.page.getByRole>) => {
      await expect(buttonLocator).toBeEnabled()
      return this
    },

    expectButtonDisabled: async (buttonLocator: ReturnType<typeof this.page.getByRole>) => {
      await expect(buttonLocator).toBeDisabled()
      return this
    },

    expectInputValue: async (inputLocator: ReturnType<typeof this.page.getByPlaceholder>, value: string) => {
      await expect(inputLocator).toHaveValue(value)
      return this
    },

    expectInputEmpty: async (inputLocator: ReturnType<typeof this.page.getByPlaceholder>) => {
      await expect(inputLocator).toHaveValue('')
      return this
    }
  }

  // WHEN - User interactions
  when = {
    clickPing: async () => {
      await this.get.pingButton().click()
      return this
    },

    typeMessage: async (message: string) => {
      await this.get.messageInput().fill(message)
      return this
    },

    sendMessage: async (message: string) => {
      await this.when.typeMessage(message)
      await this.get.sendButton().click()
      return this
    },

    typeText: async (text: string) => {
      await this.get.textInput().fill(text)
      return this
    },

    createText: async (text: string) => {
      await this.when.typeText(text)
      await this.get.createTextButton().click()
      return this
    },

    waitForLoading: async (loadingText: string) => {
      await expect(this.page.getByText(loadingText)).toBeVisible()
      return this
    }
  }

  // SET - Setup, configuration, and mocking
  set = {
    setupMocks: async () => {
      // Listen to console messages for debugging
      this.page.on('console', msg => {
        console.log(`PAGE LOG: ${msg.type()}: ${msg.text()}`)
      })

      // Mock the plugin API by intercepting postMessage communication
      await this.page.addInitScript(() => {
        // Store original console.log to help with debugging
        const originalLog = console.log

        // Mock parent.postMessage to intercept UI -> Plugin messages
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.parent.postMessage = (message: any) => {
          originalLog('Intercepted postMessage:', message)

          // Check if this is a plugin message
          if (message?.pluginMessage) {
            const pluginMessage = message.pluginMessage
            originalLog('Plugin message:', pluginMessage)

            // Simulate plugin response after a delay
            setTimeout(() => {
              const mockResponse = getMockResponse(pluginMessage)
              if (mockResponse) {
                originalLog('Sending mock response:', mockResponse)

                // Simulate plugin response by dispatching MessageEvent
                window.dispatchEvent(new MessageEvent('message', {
                  data: {
                    pluginId: 'mock-plugin',
                    pluginMessage: mockResponse
                  }
                }))
              }
            }, 100)
          }

          // Don't call original postMessage to avoid errors
        }

        // Function to generate mock responses based on the request
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function getMockResponse(pluginMessage: any) {
          const { eventName, payload, messageId } = pluginMessage

          originalLog(`Generating mock response for eventName: ${eventName}, payload:`, payload)

          switch (eventName) {
            case 'ping': {
              const count = payload?.[0] || 1
              const response = `Pong received! Count: ${count}`
              originalLog(`Generated ping response: ${response}`)
              return {
                messageId,
                fromSide: 'Plugin-side',
                eventName: '__INTERNAL_SUCCESS_RESPONSE_EVENT',
                payload: [response]
              }
            }

            case 'message': {
              const message = payload?.[0] || ''
              const response = `Message received: "${message}"`
              originalLog(`Generated message response: ${response}`)
              return {
                messageId,
                fromSide: 'Plugin-side',
                eventName: '__INTERNAL_SUCCESS_RESPONSE_EVENT',
                payload: [response]
              }
            }

            case 'createText': {
              const text = payload?.[0] || ''
              const response = `Text node created: "${text}"`
              originalLog(`Generated createText response: ${response}`)
              return {
                messageId,
                fromSide: 'Plugin-side',
                eventName: '__INTERNAL_SUCCESS_RESPONSE_EVENT',
                payload: [response]
              }
            }

            default:
              originalLog(`No mock response for eventName: ${eventName}`)
              return null
          }
        }

        originalLog('postMessage mock installed successfully')
      })

      return this
    },

    navigateToApp: async () => {
      await this.page.goto('/')
      return this
    },

    waitForPluginReady: async () => {
      // Wait for loading state to appear
      await this.get.expectLoadingState()

      // Simulate plugin ready signal
      await this.page.evaluate(() => {
        // Simulate the 'ready' message from plugin to complete bootstrap
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            pluginId: 'test-plugin',
            pluginMessage: {
              messageId: 'test-ready',
              fromSide: 'Plugin-side',
              eventName: 'ready',
              payload: []
            }
          }
        }))
      })

      // Wait for main app to be visible
      await this.get.expectMainAppVisible()
      return this
    },

    bootstrapApp: async () => {
      await this.set.setupMocks()
      await this.set.navigateToApp()
      await this.set.waitForPluginReady()
      return this
    }
  }
}

// Helper to create driver instance for tests
export const createE2eDriver = (page: Page) => new E2eTestDriver(page) 