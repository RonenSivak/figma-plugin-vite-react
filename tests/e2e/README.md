# Minimal E2E Tests with Scalable Interceptor

This directory contains minimal Playwright tests with a scalable interceptor system.

## Test Files

### `app.spec.ts`

Contains 2 minimal test cases:

- **Normal UI Test**: Basic UI element rendering and interaction
- **Interceptor Test**: Custom mock responses using the scalable interceptor

### `app.test.driver.ts`

Minimal test driver with essential methods:

- **GET**: Core element queries and assertions
- **WHEN**: Basic user interactions
- **SET**: Essential setup methods

### `interceptPostMessage.ts`

**Scalable interceptor** with `generateMockResponse` function:

- Configurable mock responses for any number of events
- Built-in error handling and logging
- Easy to extend with new event types (scalable architecture)

## Key Features

- **Minimal Tests**: Only essential test cases and driver methods
- **Scalable Interceptor**: Advanced `generateMockResponse` function for easy expansion
- **Clean Structure**: Simple GET/WHEN/SET pattern
- **Plugin Bootstrap**: Proper simulation of plugin ready state

## Scalable Interceptor Usage

```typescript
// Easy to add new mock responses
const customMocks = {
  ping: payload => `Pong! Count: ${payload?.[0] || 1}`,
  newEvent: payload => `Response: ${payload?.[0]}`,
  anotherEvent: () => 'Static response',
}

await driver.set.setupWithInterceptor(customMocks)
```

## Running Tests

```bash
npx playwright test
```

## Driver Structure

Minimal but expandable pattern:

```typescript
// GET - Essential queries and assertions
get = {
  coreElement: () => this.page.getByText('Element'),
  expectBasic: async () => {
    /* assertion */
  },
}

// WHEN - Basic interactions
when = {
  clickBasic: async () => {
    /* interaction */
  },
}

// SET - Essential setup
set = {
  setupBasic: async () => {
    /* setup */
  },
  setupWithInterceptor: async mocks => {
    /* scalable interceptor */
  },
}
```
