import { describe, it, beforeEach } from 'vitest'
import { AppTestDriver } from '../test/App.test.driver'

describe('Figma Plugin App - User Scenarios', () => {
  let driver: AppTestDriver

  beforeEach(() => {
    driver = new AppTestDriver().set.reset()
  })

  describe('Application Startup', () => {
    it('shows loading screen while plugin initializes', () => {
      driver
        .set.renderApp()
        .get.expectLoadingState()
        .get.expectBootstrapCallbackSet()
    })

    it('transitions to main interface when plugin is ready', async () => {
      const readyDriver = await driver
        .set.renderApp()
        .set.makePluginReady()
      
      readyDriver.get.expectMainUI()
    })
  })

  describe('Basic Plugin Communication', () => {
    beforeEach(async () => {
      await driver.set.loadReadyApp()
    })

    it('user can ping the plugin', async () => {
      const result = await driver
        .set.mockRequestSuccess('pong')
        .when.clickPing()
      
      result.get.expectPingRequest(1)
    })

    it('user can send messages to plugin', async () => {
      const result = await driver
        .set.mockRequestSuccess('received')
        .when.sendMessage('Hello')
      
      result.get.expectMessageRequest('Hello')
    })
  })

  describe('Text Click Detection & Key Generation', () => {
    beforeEach(async () => {
      await driver.set.loadReadyApp()
    })

    it('detects when user clicks text in Figma and generates babel key', async () => {
      const afterClick = await driver.when.simulateTextClick('node1', 'Hello World')
      await afterClick.get.expectClickDetection('node1', 'Hello World')
      const afterGenerate = await afterClick.when.clickGenerateKey()
      await afterGenerate.get.expectGeneratedKey('babel.key.hello-world')
    })
  })

  describe('Error Scenarios', () => {
    beforeEach(async () => {
      await driver.set.loadReadyApp()
    })

    it('displays error when plugin communication fails', async () => {
      const result = await driver
        .set.mockRequestError(new Error('Network error'))
        .when.clickPing()
      
      await result.get.expectErrorMessage('Error: Network error')
    })
  })
}) 