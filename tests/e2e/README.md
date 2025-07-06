# E2E Test Framework for Figma Plugin

This directory contains end-to-end tests for the Figma plugin using Playwright with a clean, driver-based testing architecture.

## Architecture Overview

The e2e test framework follows a **driver pattern** that separates business logic from test implementation details, making tests human-readable and maintainable.

### Key Components

1. **`app.spec.ts`** - Clean, human-readable test scenarios
2. **`app.test.driver.ts`** - Test driver with get/set/when structure containing all mocking logic

## Driver Pattern Structure

The `E2eTestDriver` follows the same pattern as the unit test driver with three main sections:

### `get` - Element queries and assertions
- Element selectors (buttons, inputs, text)
- State assertions (visibility, values, disabled states)
- Response verification

### `when` - User interactions 
- Click actions
- Text input
- Combined workflows (sendMessage, createText)
- Loading state waits

### `set` - Setup, configuration, and mocking
- Mock installation for plugin API
- App navigation and bootstrap
- Plugin handshake simulation
- Complete app setup workflow

## How It Works

### Plugin API Mocking Strategy

The framework intercepts Figma plugin communication by:

1. **postMessage Interception**: Overrides `window.parent.postMessage()` to capture UI → Plugin messages
2. **Message Processing**: Parses plugin messages with `eventName` and `payload`
3. **Response Generation**: Generates appropriate mock responses for:
   - `ping` → `"Pong received! Count: {count}"`
   - `message` → `"Message received: "{message}""`
   - `createText` → `"Text node created: "{text}""`
4. **Response Simulation**: Dispatches `MessageEvent` back to UI to simulate plugin responses

### Bootstrap Sequence

The driver handles the complete Figma plugin bootstrap:

```typescript
// 1. Install mocks before page load
await driver.set.setupMocks()

// 2. Navigate to app
await driver.set.navigateToApp()

// 3. Wait for loading state and simulate plugin ready
await driver.set.waitForPluginReady()

// All-in-one helper:
await driver.set.bootstrapApp()
```

## Usage Examples

### Basic UI Test
```typescript
test('should render main app', async ({ page }) => {
  const driver = createE2eDriver(page)
  
  await driver.set.bootstrapApp()
  await driver.get.expectMainAppVisible()
})
```

### API Response Test
```typescript
test('should display ping responses', async ({ page }) => {
  const driver = createE2eDriver(page)
  
  await driver.set.bootstrapApp()
  
  // Test ping functionality
  await driver.when.clickPing()
  await driver.when.waitForLoading('Pinging...')
  await driver.get.expectResponse('Pong received! Count: 1')
  
  // Test counter increment
  await driver.when.clickPing()
  await driver.get.expectResponse('Pong received! Count: 2')
})
```

### User Workflow Test
```typescript
test('should handle message sending', async ({ page }) => {
  const driver = createE2eDriver(page)
  
  await driver.set.bootstrapApp()
  
  // Verify initial state
  await driver.get.expectButtonDisabled(driver.get.sendButton())
  
  // Send message and verify response
  await driver.when.sendMessage('Hello Figma Test!')
  await driver.when.waitForLoading('Sending...')
  await driver.get.expectResponse('Message received: "Hello Figma Test!"')
  
  // Verify cleanup
  await driver.get.expectInputEmpty(driver.get.messageInput())
  await driver.get.expectButtonDisabled(driver.get.sendButton())
})
```

## Running Tests

```bash
# Run all e2e tests
yarn test:e2e

# Run specific test file
yarn test:e2e tests/e2e/app.spec.ts

# Run with UI (headed mode)
yarn test:e2e --headed

# Run on specific browser
yarn test:e2e --project=chromium
```

## Key Benefits

1. **Human Readable**: Tests read like user scenarios
2. **Maintainable**: All complex mocking logic encapsulated in driver
3. **Reusable**: Driver methods can be composed for different test scenarios
4. **Consistent**: Follows same pattern as unit test driver
5. **Reliable**: Proper plugin API mocking ensures consistent test results

## Technical Implementation Details

### Mock Installation Timing
- Mocks are installed via `page.addInitScript()` before page navigation
- This ensures the mock is in place when the app initializes

### Message Flow Simulation
1. UI sends message via `postMessage({ pluginMessage: {...} })`
2. Mock intercepts and processes the message
3. Mock generates appropriate response after 100ms delay
4. Response dispatched via `MessageEvent` back to UI
5. UI receives response and updates state

### Cross-Browser Compatibility
Tests run across all major browsers:
- Chromium (Chrome, Edge)
- Firefox 
- WebKit (Safari)

This comprehensive framework provides reliable, maintainable e2e testing for Figma plugin development. 