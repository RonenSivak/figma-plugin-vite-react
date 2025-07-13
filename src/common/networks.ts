import { Networker } from 'monorepo-networker'

export const UI = Networker.createSide('UI-side').listens<{
  ping(): 'pong'
  pong(): 'ping'
  hello(text: string): void
  ready(): void
  textClicked(nodeId: string, text: string): void
  error(error: unknown, context?: unknown): void
}>()

export const PLUGIN = Networker.createSide('Plugin-side').listens<{
  ping(count: number): string
  pong(): 'ping'
  hello(text: string): void
  helloAck(): void
  message(text: string): string
  createRect(width: number, height: number): void
  createText(text: string): Promise<string>
  exportSelection(): Promise<string>
  error(error: unknown, context?: unknown): Promise<string>
}>()
