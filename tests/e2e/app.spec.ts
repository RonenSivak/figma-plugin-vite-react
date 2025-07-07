import { test } from '@playwright/test'
import { createE2eDriver } from './app.driver'

test.describe('Figma Plugin - Minimal E2E Tests', () => {
  test('should render basic UI elements', async ({ page }) => {
    const driver = createE2eDriver(page)

    await driver.set.setupBasicEnvironment()
    await driver.get.expectMainAppVisible()
    await driver.get.expectPingButtonEnabled()
  })

  test('should handle intercepted ping with custom response', async ({
    page,
  }) => {
    const driver = createE2eDriver(page)

    await driver.set.setupWithInterceptor({
      ping: () => 'ping',
    })

    await driver.when.clickPing()
    await driver.get.expectResponse('ping')
  })
})
