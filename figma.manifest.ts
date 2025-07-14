// https://www.figma.com/plugin-docs/manifest/
export default {
  name: 'Figma-Plugin-Vite-React',
  id: '1524395167968571993',
  api: '1.0.0',
  main: 'code.js',
  ui: 'index.html',
  capabilities: [],
  "documentAccess": "dynamic-page",
  "networkAccess": {
    "allowedDomains": ["*"],
    "reasoning": "This plugin needs to access the internet to get the OAuth tokens"
  },
  editorType: ['figma'],
}
