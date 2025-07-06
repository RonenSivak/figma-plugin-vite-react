import { PLUGIN, UI } from "../common/networks";

export const PLUGIN_CHANNEL = PLUGIN.channelBuilder()
  .emitsTo(UI, (message) => {
    figma.ui.postMessage(message);
  })
  .receivesFrom(UI, (next) => {
    const listener: MessageEventHandler = (event) => next(event);
    figma.ui.on("message", listener);
    return () => figma.ui.off("message", listener);
  })
  .startListening();

// ---------- Selection management
let selectionListenerActive = false;
let selectionChangeHandler: (() => void) | null = null;

const handleSelectionChange = () => {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 1) {
    const node = selection[0];
    
    // Check if the selected node is a text node
    if (node.type === 'TEXT') {
      console.log("Text node selected:", node.id, node.characters);
      
      // Send notification to UI
      PLUGIN_CHANNEL.emit(UI, "textClicked", [node.id, node.characters]);
    }
  }
}

// Export function to start selection listener (for direct use)
export const startSelectionListener = (): string => {
  console.log("Starting selection listener");
  
  if (!selectionListenerActive) {
    selectionChangeHandler = handleSelectionChange;
    figma.on("selectionchange", selectionChangeHandler);
    selectionListenerActive = true;
    return "Selection listener started";
  } else {
    return "Selection listener already active";
  }
}

// ---------- Message handlers

PLUGIN_CHANNEL.registerMessageHandler("ping", (count) => {
  console.log("Plugin received ping with count:", count, "responding with pong");
  return `pong: ${count}`;
});

PLUGIN_CHANNEL.registerMessageHandler("pong", () => {
  console.log("Plugin received pong, responding with ping");
  return "ping";
});

PLUGIN_CHANNEL.registerMessageHandler("message", (text) => {
  console.log("Plugin received message:", text);
  return `received ${text} from plugin`;
});

PLUGIN_CHANNEL.registerMessageHandler("createText", async (text) => {
  console.log("Plugin creating text:", text);
  
  try {
    // Load the default font first
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    
    // Create a text node in Figma
    const textNode = figma.createText();
    textNode.characters = text;
    textNode.fontSize = 24;
    textNode.fills = [{type: 'SOLID', color: {r: 0, g: 0, b: 0}}];
    
    // Add to current page
    figma.currentPage.appendChild(textNode);
    
    // Position it in the center of the viewport
    textNode.x = figma.viewport.center.x - textNode.width / 2;
    textNode.y = figma.viewport.center.y - textNode.height / 2;
    
    return `Created text: "${text}"`;
  } catch (error) {
    console.error("Error creating text:", error);
    return `Error creating text: ${error}`;
  }
});

PLUGIN_CHANNEL.registerMessageHandler("hello", (text) => {
  console.log("UI side said:", text);
});

PLUGIN_CHANNEL.registerMessageHandler("helloAck", () => {
  console.log("Received hello-ack from UI, sending ready signal");
  // Step 3 of handshake: Send ready signal to UI
  PLUGIN_CHANNEL.emit(UI, "ready", []);
});