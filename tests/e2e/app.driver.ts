import { expect, Page } from '@playwright/test'
import {
  createPostMessageInterceptor,
  MockResponseConfig,
} from './interceptPostMessage'

export class E2eTestDriver {
  constructor(private page: Page) {}

  get = {
    title: () => this.page.getByText('🎯 Figma Plugin'),
    pingButton: () => this.page.getByRole('button', { name: /ping/i }),

    expectMainAppVisible: async () => {
      await expect(this.get.title()).toBeVisible()
      return this
    },

    expectPingButtonEnabled: async () => {
      await expect(this.get.pingButton()).toBeEnabled()
      return this
    },

    expectResponse: async (expectedText: string) => {
      await expect(this.page.getByText(expectedText)).toBeVisible({
        timeout: 3000,
      })
      return this
    },
  }

  when = {
    clickPing: async () => {
      await this.get.pingButton().click()
      return this
    },
  }

  set = {
    setupBasicEnvironment: async () => {
      await this.page.goto('/')

      // Wait for loading state and simulate plugin ready
      await this.page.waitForSelector('text=Initializing Plugin...', {
        timeout: 5000,
      })
      await this.page.evaluate(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: {
              pluginId: 'test-plugin',
              pluginMessage: {
                messageId: 'ready-msg',
                fromSide: 'Plugin-side',
                eventName: 'ready',
                payload: [],
              },
            },
          })
        )
      })
      await this.page.waitForSelector('text=🎯 Figma Plugin', { timeout: 5000 })
      return this
    },

    setupWithInterceptor: async (mockResponses: MockResponseConfig) => {
      const interceptorScript = createPostMessageInterceptor({
        mockResponses,
        delay: 50,
        enableLogging: false,
      })
      await this.page.addInitScript(interceptorScript)
      await this.set.setupBasicEnvironment()
      return this
    },
  }
}

export const createE2eDriver = (page: Page) => new E2eTestDriver(page)
