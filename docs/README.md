# Figma Plugin Vite React

## What is this?

A Figma plugin that demonstrates modern plugin architecture with React UI and type-safe communication.

**Features:**
- Send messages between Figma and UI
- Create text in Figma canvas
- Detect text clicks in Figma
- Auto-initialization with loading screen

## Quick Start

```bash
# Install dependencies
yarn install

# Build the plugin
yarn build

# Run development server
yarn dev

# Install in Figma
# 1. Open Figma
# 2. Go to Plugins → Development → Import plugin from manifest
# 3. Select `dist/manifest.json`
# 4. Run the plugin
```

## Project Structure

```
src/
├── app/           # React UI (runs in iframe)
├── plugin/        # Plugin code (runs in Figma sandbox)  
└── common/        # Shared types and network definitions
```

## Making Changes

### Add a new message type:
1. Define it in `src/common/networks.ts`
2. Add handler in `src/plugin/index.network.ts`
3. Use it in `src/app/App.tsx`

### Modify the UI:
- Edit `src/app/App.tsx` (React component)

### Change plugin behavior:
- Edit `src/plugin/index.network.ts` (message handlers)

## How it works

The plugin has two parts that communicate via messages:
- **UI Process**: React app in browser iframe
- **Plugin Process**: JavaScript in Figma's sandbox

They use type-safe messaging to stay in sync.

## Architecture

For a deeper understanding of the system architecture and communication patterns, see [`architecture.md`](./architecture.md). 