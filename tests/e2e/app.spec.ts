import { test } from '@playwright/test'
import { createE2eDriver } from './app.test.driver'

test.describe('Figma Plugin App - E2E Tests', () => {
  test.describe.configure({ mode: 'parallel' })

  test('should render the main app interface after plugin bootstraps', async ({ page }) => {
    const driver = createE2eDriver(page)
    
    await driver.set.bootstrapApp()
    await driver.get.expectMainAppVisible()
  })

  test('should display mocked API responses when pinging plugin', async ({ page }) => {
    const driver = createE2eDriver(page)
    
    await driver.set.bootstrapApp()
    
    // Test ping functionality with response verification
    await driver.when.clickPing()
    await driver.when.waitForLoading('Pinging...')
    await driver.get.expectResponse('Pong received! Count: 1')
    
    // Test ping again to verify counter increment
    await driver.when.clickPing()
    await driver.when.waitForLoading('Pinging...')
    await driver.get.expectResponse('Pong received! Count: 2')
  })

  test('should handle message sending with response display', async ({ page }) => {
    const driver = createE2eDriver(page)
    
    await driver.set.bootstrapApp()
    
    // Verify initial state
    await driver.get.expectButtonDisabled(driver.get.sendButton())
    
    // Send message and verify response
    await driver.when.sendMessage('Hello Figma Test!')
    await driver.when.waitForLoading('Sending...')
    await driver.get.expectResponse('Message received: "Hello Figma Test!"')
    
    // Verify input cleared and button disabled
    await driver.get.expectInputEmpty(driver.get.messageInput())
    await driver.get.expectButtonDisabled(driver.get.sendButton())
  })

  test('should handle text creation with response display', async ({ page }) => {
    const driver = createE2eDriver(page)
    
    await driver.set.bootstrapApp()
    
    // Verify initial state
    await driver.get.expectButtonDisabled(driver.get.createTextButton())
    
    // Create text and verify response
    await driver.when.createText('Sample Text Node')
    await driver.when.waitForLoading('Creating...')
    await driver.get.expectResponse('Text node created: "Sample Text Node"')
    
    // Verify input cleared and button disabled
    await driver.get.expectInputEmpty(driver.get.textInput())
    await driver.get.expectButtonDisabled(driver.get.createTextButton())
  })
}) 