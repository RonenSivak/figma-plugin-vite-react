# Figma Plugin MVP

A modern Figma plugin built with React, TypeScript, and Vite featuring dual-process architecture and type-safe communication.

## 🚀 Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Run tests
yarn test
yarn test:e2e
```

## 📚 Documentation

### 📖 Core Documentation
- [Architecture Overview](docs/architecture.md) - System architecture and communication patterns
- [Plugin Development Guide](docs/README.md) - Detailed development guide
- [E2E Testing Guide](tests/e2e/README.md) - End-to-end testing documentation

### 🔗 External Resources
- [Design & Technical Overview](https://docs.google.com/document/d/15GeqhS4ft8_qpvE7RqNwxz2CndqE_I-PmApOfrHnqXM/edit?usp=sharing)
- [Stack and Key Dependencies Structure](https://docs.google.com/document/d/13YsTk0c38RnntgZ35yGSdbk3HffeuUOjTvQ40oRFQwk/edit?usp=sharing)


## 🔧 Tech Stack

### Core Technologies
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Figma Plugin API** - Plugin functionality

### Testing
- **Vitest** - Unit testing framework
- **Playwright** - E2E testing
- **Testing Library** - React testing utilities

### Development Tools
- **ESLint** - Code linting
- **Wix Design System** - UI components
- **Monorepo Networker** - Type-safe messaging
- **npm-run-all** - Script orchestration

## 🎯 Key Features

### Plugin
- **Dual-Process Design** - UI and plugin run in separate environments
- **Type-Safe Communication** - Strongly typed message passing
- **Bootstrap Handshake** - Reliable initialization sequence
- **Event-Driven** - Reactive to Figma canvas events

### Development Experience
- **Hot Module Reload** - Instant feedback during development
- **Comprehensive Testing** - Unit and E2E test coverage
- **Test Drivers** - Reusable test utilities with GET/WHEN/SET pattern
- **Scalable Interceptor** - Mock message system for testing

## 🧪 Testing

### Unit Tests (Vitest)
```bash
yarn test             # Run in watch mode
yarn test:ui          # Run with UI
yarn test:coverage    # Run with coverage
```

**Test Files:**
- [`src/app/App.spec.tsx`](src/app/App.spec.tsx) - Main app unit tests
- [`src/app/App.driver.tsx`](src/app/App.driver.tsx) - Unit test driver

### E2E Tests (Playwright)
```bash
yarn test:e2e         # Run E2E tests
yarn test:e2e:ui      # Run with UI
yarn test:e2e:debug   # Run in debug mode
```

**Test Files:**
- [`tests/e2e/app.spec.ts`](tests/e2e/app.spec.ts) - E2E test cases
- [`tests/e2e/app.driver.ts`](tests/e2e/app.driver.ts) - E2E test driver
- [`tests/e2e/interceptPostMessage.ts`](tests/e2e/interceptPostMessage.ts) - Message interceptor

## 📦 Scripts

### Development
- `yarn dev` - Start development server
- `yarn dev:ui-only` - Run only UI dev server
- `yarn watch` - Watch mode for both UI and plugin

### Building
- `yarn build` - Build for production
- `yarn build:ui` - Build UI only
- `yarn build:plugin` - Build plugin only

### Testing
- `yarn test` - Run unit tests
- `yarn test:e2e` - Run E2E tests

### Linting and Formatting
- `yarn lint` - Check lint issues
- `yarn lint:fix` - Fix lint issues automatically
- `yarn format` - Format code with Prettier
- `yarn format:check` - Check if code is formatted correctly

## 🔗 Key Files

### Entry Points
- [`src/app/main.tsx`](src/app/main.tsx) - React app entry point
- [`src/plugin/index.ts`](src/plugin/index.ts) - Plugin entry point
- [`figma.manifest.ts`](figma.manifest.ts) - Figma manifest configuration

### Core Application
- [`src/app/App.tsx`](src/app/App.tsx) - Main React component
- [`src/app/App.network.ts`](src/app/App.network.ts) - UI message handling
- [`src/plugin/index.network.ts`](src/plugin/index.network.ts) - Plugin message handling
- [`src/common/networks.ts`](src/common/networks.ts) - Message type definitions

### Configuration
- [`package.json`](package.json) - Dependencies and scripts
- [`tsconfig.json`](tsconfig.json) - TypeScript configuration
- [`vite.config.ts`](vite.config.ts) - Vite configuration
- [`playwright.config.ts`](playwright.config.ts) - Playwright configuration
- [`vitest.config.ts`](vitest.config.ts) - Vitest configuration

## 🚦 Development Workflow

1. **Setup**: `yarn install`
2. **Development**: `yarn dev`
3. **Testing**: `yarn test` and `yarn test:e2e`
4. **Build**: `yarn build`
5. **Install in Figma**: Load `dist/manifest.json`


### Communication Flow
The plugin uses a **dual-process architecture** with type-safe messaging:

```
UI Process (React) ↔ Plugin Process (Figma) ↔ Figma API
```

### Message System
- **Bootstrap Handshake** - Ensures both sides are ready
- **Request-Response Pattern** - Structured communication
- **Event Notifications** - Canvas event handling
- **Type Safety** - Strongly typed message contracts

For detailed architecture information, see the [Architecture Overview](docs/architecture.md).