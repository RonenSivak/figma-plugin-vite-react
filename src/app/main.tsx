import { StrictMode } from 'react';
import { PLUGIN, UI } from "../common/networks.ts";
import { UI_CHANNEL } from "./App.network.ts";
import { Networker } from "monorepo-networker";
import { createRoot } from "react-dom/client";
import App from './App.tsx'
import { WixDesignSystemProvider } from '@wix/design-system';
import "@wix/design-system/styles.global.css";

async function bootstrap() {
  Networker.initialize(UI, UI_CHANNEL);

  UI_CHANNEL.emit(PLUGIN, "hello", ["Hey there, Figma!"]);

  const rootElement = document.getElementById("root") as HTMLElement;
  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <WixDesignSystemProvider features={{ newColorsBranding: true }}>
        <App />
      </WixDesignSystemProvider>
    </StrictMode>
  );
}

bootstrap();