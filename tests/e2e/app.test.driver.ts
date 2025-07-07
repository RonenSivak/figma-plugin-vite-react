import { expect, Page } from '@playwright/test'
import { createPostMessageInterceptor, defaultMockResponses, MockResponseConfig, InterceptPostMessageOptions } from './interceptPostMessage'

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
    postMessageInterceptor: async (config: Partial<InterceptPostMessageOptions>) => {
      // Listen to console messages for debugging
      this.page.on('console', msg => {
        console.log(`PAGE LOG: ${msg.type()}: ${msg.text()}`)
      })

      // Use default mock responses if none provided
      const options: InterceptPostMessageOptions = {
        mockResponses: defaultMockResponses,
        delay: 100,
        enableLogging: true,
        ...config
      }

      // Inject the configurable postMessage interceptor
      const interceptorScript = createPostMessageInterceptor(options)
      await this.page.addInitScript(interceptorScript)

      return this
    },

    setupMocks: async (mockResponses?: MockResponseConfig) => {
      return this.set.postMessageInterceptor({
        mockResponses: mockResponses || defaultMockResponses
      })
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