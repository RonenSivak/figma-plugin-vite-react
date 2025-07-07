/// <reference types="@figma/plugin-typings" />

import { PLUGIN, UI } from '../common/networks'
import { PLUGIN_CHANNEL, startSelectionListener } from './index.network'
import { Networker } from 'monorepo-networker'

async function bootstrap() {
  Networker.initialize(PLUGIN, PLUGIN_CHANNEL)

  figma.showUI(__html__, {
    width: 800,
    height: 650,
    title: 'Figma Plugin',
  })
  console.log('Bootstrapped @', Networker.getCurrentSide().name)
  PLUGIN_CHANNEL.emit(UI, 'hello', ['Plugin initialized'])

  startSelectionListener()
}

bootstrap()
