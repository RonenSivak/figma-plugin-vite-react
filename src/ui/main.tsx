import { StrictMode } from 'react';
import { PLUGIN, UI } from "../common/networks";
import { UI_CHANNEL } from "./App.network";
import { Networker } from "monorepo-networker";
import ReactDOM from "react-dom/client";
import App from './App.tsx'
import './styles/index.css'

async function bootstrap() {
  Networker.initialize(UI, UI_CHANNEL);

  UI_CHANNEL.emit(PLUGIN, "hello", ["Hey there, Figma!"]);

  const rootElement = document.getElementById("root") as HTMLElement;
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();