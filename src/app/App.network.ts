import { PLUGIN, UI } from "../common/networks";

// Bootstrap completion callback (will be set by App.tsx)
let onBootstrapComplete: ((flag: boolean) => void) | null = null;

export const UI_CHANNEL = UI.channelBuilder()
  .emitsTo(PLUGIN, (message) => {
    console.log("UI sending message to plugin:", message);
    parent.postMessage({ pluginMessage: message }, "*");
  })
  .receivesFrom(PLUGIN, (next) => {
    const listener = (event: MessageEvent) => {
      if (event.data?.pluginId == null) return;
      next(event.data.pluginMessage);
    };

    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  })
  .startListening();
// Function to set bootstrap completion callback
export const setBootstrapCallback = (callback: (flag: boolean) => void) => {
  onBootstrapComplete = callback;
};


UI_CHANNEL.registerMessageHandler("ping", () => {
  console.log("UI received ping, responding with pong");
  return "pong";
});

UI_CHANNEL.registerMessageHandler("pong", () => {
  console.log("UI received pong, responding with ping");
  return "ping";
});

UI_CHANNEL.registerMessageHandler("hello", (text) => {
  console.log("Received hello from plugin:", text);
  // Step 2 of handshake: Respond with hello-ack
  UI_CHANNEL.emit(PLUGIN, "helloAck", []);
});

UI_CHANNEL.registerMessageHandler("ready", () => {
  console.log("Received ready signal from plugin, bootstrap complete");
  if (onBootstrapComplete) {
    onBootstrapComplete(true);
  }
});