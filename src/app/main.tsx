import { StrictMode } from 'react'
import { PLUGIN, UI } from '../common/networks.ts'
import { UI_CHANNEL } from './App.network.ts'
import { Networker } from 'monorepo-networker'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@wix/design-system/styles.global.css'
import { getFigmaPluginSentryConfig } from '../common/sentry.ts'
import { initializeSentry } from '../common/sentry.ts'

async function bootstrap() {
  Networker.initialize(UI, UI_CHANNEL)
  initializeSentry(getFigmaPluginSentryConfig())
  UI_CHANNEL.emit(PLUGIN, 'hello', ['Hey there, Figma!'])

  const rootElement = document.getElementById('root') as HTMLElement
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

bootstrap()
