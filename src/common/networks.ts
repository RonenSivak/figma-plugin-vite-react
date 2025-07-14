import { Networker } from 'monorepo-networker'

export const UI = Networker.createSide('UI-side').listens<{
  ping(): 'pong'
  pong(): 'ping'
  hello(text: string): void
  ready(): void
  textClicked(nodeId: string, text: string): void
  authStatusChanged(isAuthenticated: boolean): void
}>()

export const PLUGIN = Networker.createSide('Plugin-side').listens<{
  ping(count: number): string
  pong(): 'ping'
  hello(text: string): void
  helloAck(): void
  message(text: string): string
  createRect(width: number, height: number): void
  createText(text: string): Promise<string>
  createTextAuth(text: string): Promise<string>
  exportSelection(): Promise<string>
  checkAuthStatus(): Promise<boolean>
  saveToken(token: string): Promise<void>
  getToken(): Promise<string | null>
  clearToken(): Promise<void>
  saveCodeVerifier(codeVerifier: string): Promise<void>
  getCodeVerifier(): Promise<string | null>
  clearCodeVerifier(): Promise<void>
}>()
