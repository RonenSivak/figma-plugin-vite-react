import { vi, expect } from 'vitest'
import { render, screen, waitFor } from '../test/test-utils'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock setup
vi.mock('../app/App.network', () => ({
  UI_CHANNEL: {
    request: vi.fn(),
    registerMessageHandler: vi.fn(),
  },
  setBootstrapCallback: vi.fn(),
}))

vi.mock('../common/networks', () => ({
  PLUGIN: { name: 'Plugin-side' },
  UI: {
    channelBuilder: () => ({
      emitsTo: () => ({ receivesFrom: () => ({ startListening: () => ({}) }) }),
    }),
  },
}))

import { UI_CHANNEL, setBootstrapCallback } from './App.network'
import { PLUGIN } from '../common/networks'

export class AppTestDriver {
  private user = userEvent.setup()
  private mockRequest = vi.mocked(UI_CHANNEL.request)
  private mockSetBootstrapCallback = vi.mocked(setBootstrapCallback)

  get = {
    mainTitle: () => screen.getByText('🎯 Figma Plugin'),
    pingButton: () => screen.getByText('🏓 Ping'),

    expectMainUI: () => {
      expect(this.get.mainTitle()).toBeInTheDocument()
      expect(this.get.pingButton()).toBeInTheDocument()
      return this
    },

    expectPingRequest: (count: number = 1) => {
      expect(this.mockRequest).toHaveBeenCalledWith(PLUGIN, 'ping', [count])
      return this
    },
  }

  when = {
    clickPing: async () => {
      await this.user.click(this.get.pingButton())
      return this
    },
  }

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
      await waitFor(() => this.get.mainTitle())
      return this
    },

    loadReadyApp: async () => {
      this.set.renderApp()
      return await this.set.makePluginReady()
    },

    mockRequestSuccess: (result: string) => {
      this.mockRequest.mockResolvedValue(result)
      return this
    },
  }
}
