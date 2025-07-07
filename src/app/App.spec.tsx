import { describe, it, beforeEach } from 'vitest'
import { AppTestDriver } from './App.driver'

describe('Figma Plugin - Minimal Unit Tests', () => {
  let driver: AppTestDriver

  beforeEach(() => {
    driver = new AppTestDriver().set.reset()
  })

  it('should render basic UI elements', async () => {
    const readyDriver = await driver.set.renderApp().set.makePluginReady()

    readyDriver.get.expectMainUI()
  })

  it('should handle ping communication', async () => {
    const readyDriver = await driver.set.loadReadyApp()

    const afterMock = readyDriver.set.mockRequestSuccess('pong response')
    const afterClick = await afterMock.when.clickPing()
    afterClick.get.expectPingRequest(1)
  })
})
