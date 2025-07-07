# Architecture Overview

## System Architecture

The plugin uses a **dual-process architecture** where the UI and plugin run in separate environments and communicate via type-safe messages.

```mermaid
graph TB
    subgraph "Figma Environment"
        subgraph "Plugin Process"
            P[Plugin Code<br/>main.ts]
            PN[Network Handler<br/>network.ts]
            P --> PN
        end

        subgraph "UI Process"
            U[React App<br/>App.tsx]
            UN[Network Handler<br/>network.ts]
            U --> UN
        end
    end

    subgraph "Shared"
        NT[Message Types<br/>types.ts]
    end

    PN <--> UN
    PN -.-> NT
    UN -.-> NT

    P --> FA[Figma API]
    U --> UI_LIB[UI Library]
```

## Communication Flow

### 1. Bootstrap Handshake

The plugin uses a 3-step handshake to ensure both sides are ready before showing the UI:

```mermaid
sequenceDiagram
    participant P as Plugin
    participant UI as UI

    Note over P,UI: Step 1: Plugin Ready
    P->>UI: initialize("System ready")

    Note over P,UI: Step 2: UI Acknowledges
    UI->>P: acknowledge()

    Note over P,UI: Step 3: Communication Established
    P->>UI: activate()
    UI->>UI: Show main interface
```

### 2. User Interactions

After bootstrap, all user interactions follow a request-response pattern:

```mermaid
sequenceDiagram
    participant UI as UI
    participant P as Plugin
    participant F as Figma API

    Note over UI,F: User performs action
    UI->>P: performAction(data)
    P->>F: figma.apiCall()
    F->>P: Operation completed
    P->>UI: "Action completed successfully"
    UI->>UI: Update interface
```

### 3. Figma Events

The plugin listens to Figma events and notifies the UI:

```mermaid
sequenceDiagram
    participant F as Figma API
    participant P as Plugin
    participant UI as UI

    Note over F,UI: User interacts with canvas
    F->>P: canvasEvent(eventData)
    P->>P: Process event
    P->>UI: notifyEvent(processedData)
    UI->>UI: Update display
```

## Key Components

### Plugin Process (`src/plugin/`)

- **Environment**: Figma's sandboxed JavaScript
- **Role**: Handles Figma API operations and events
- **Files**:
  - `main.ts` - Bootstrap and initialization
  - `network.ts` - Message handlers and API operations

### UI Process (`src/app/`)

- **Environment**: React app in iframe
- **Role**: Provides user interface and manages state
- **Files**:
  - `App.tsx` - React components and UI logic
  - `network.ts` - Network setup and message handling

### Network Layer (`src/common/`)

- **Purpose**: Type-safe communication between processes
- **Files**:
  - `types.ts` - Message type definitions and contracts

## Message Types

```typescript
// Plugin can receive these messages
PluginMessages<{
  executeCommand(params: CommandParams): Promise<Result>
  updateSettings(config: Settings): void
  requestData(query: DataQuery): Promise<Data>
}>()

// UI can receive these messages
UIMessages<{
  initialize(status: string): void
  activate(): void
  dataChanged(newData: Data): void
  eventNotification(event: Event): void
}>()
```

## Data Flow

```mermaid
flowchart LR
    subgraph "User Actions"
        A[Button Click] --> B[Send Command]
        C[Input Change] --> D[Update Data]
        E[Canvas Selection] --> F[Show Details]
    end

    subgraph "Processing"
        B --> G[Network Request]
        D --> H[API Operation]
        F --> I[Event Handler]
    end

    subgraph "Results"
        G --> J[Update UI]
        H --> K[Modify Canvas]
        I --> L[Display Info]
    end
```
