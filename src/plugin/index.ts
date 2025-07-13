/// <reference types="@figma/plugin-typings" />

import { PLUGIN, UI } from '../common/networks'
import { PLUGIN_CHANNEL, startSelectionListener } from './index.network'
import { Networker } from 'monorepo-networker'
import { handlePluginBootstrap, safelyExecuteAsync } from './errorHandler'

async function bootstrap() {
  try {
    // Initialize error handling first
    await safelyExecuteAsync(async () => {
      Networker.initialize(PLUGIN, PLUGIN_CHANNEL)
    }, { source: 'networker_init' })

    await safelyExecuteAsync(async () => {
      figma.showUI(__html__, {
        width: 800,
        height: 650,
        title: 'Figma Plugin',
      })
    }, { source: 'ui_init' })

    console.log('Bootstrapped @', Networker.getCurrentSide().name)
    
    await safelyExecuteAsync(async () => {
      PLUGIN_CHANNEL.emit(UI, 'hello', ['Plugin initialized'])
    }, { source: 'initial_message' })

    await safelyExecuteAsync(async () => {
      startSelectionListener()
    }, { source: 'selection_listener' })

    // Signal that bootstrap is complete
    PLUGIN_CHANNEL.emit(UI, 'ready', [])
  } catch (error) {
    handlePluginBootstrap(error)
    // Still try to show UI even if bootstrap fails partially
    try {
      figma.showUI(__html__, {
        width: 800,
        height: 650,
        title: 'Figma Plugin - Error Mode',
      })
    } catch (fallbackError) {
      console.error('Critical bootstrap failure:', fallbackError)
    }
  }
}

bootstrap()
