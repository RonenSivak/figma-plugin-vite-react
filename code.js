var p = Object.defineProperty;
var w = (i, e, t) => e in i ? p(i, e, { enumerable: true, configurable: true, writable: true, value: t }) : i[e] = t;
var u = (i, e, t) => (w(i, typeof e != "symbol" ? e + "" : e, t), t);
var l = (i, e, t) => new Promise((r, s) => {
  var a = (n) => {
    try {
      c(t.next(n));
    } catch (S) {
      s(S);
    }
  }, o = (n) => {
    try {
      c(t.throw(n));
    } catch (S) {
      s(S);
    }
  }, c = (n) => n.done ? r(n.value) : Promise.resolve(n.value).then(a, o);
  c((t = t.apply(i, e)).next());
});
class y extends Error {
  constructor(e) {
    super(e.payload[0]);
  }
}
function h() {
  const i = new Array(36);
  for (let e = 0; e < 36; e++)
    i[e] = Math.floor(Math.random() * 16);
  return i[14] = 4, i[19] = i[19] &= -5, i[19] = i[19] |= 8, i[8] = i[13] = i[18] = i[23] = "-", i.map((e) => e.toString(16)).join("");
}
const g = "__INTERNAL_SUCCESS_RESPONSE_EVENT", E = "__INTERNAL_ERROR_RESPONSE_EVENT";
class N {
  constructor(e) {
    u(this, "emitStrategies", /* @__PURE__ */ new Map());
    u(this, "receiveStrategies", /* @__PURE__ */ new Map());
    this.side = e;
  }
  /**
   * Register strategy for how this side receives messages from given other side.
   *
   *
   * @param side The network side from which messages will be received.
   * @param strategy The strategy for handling incoming messages from the specified side.
   * @returns This channel, so you can chain more things as needed
   */
  receivesFrom(e, t) {
    return this.receiveStrategies.set(e.name, t), this;
  }
  /**
   * Register strategy on how this side emits message to given other side.
   *
   * @param to The target network side to which messages will be emitted.
   * @param strategy Strategy for emitting a message.
   * @returns This channel, so you can chain more things as needed
   */
  emitsTo(e, t) {
    return this.emitStrategies.set(e.name, t), this;
  }
  /**
   * Finalizes and builds the Channel.
   * And starts listening with registered receiving strategies.
   *
   * @returns The channel
   */
  startListening() {
    return new R(
      this.side,
      this.emitStrategies,
      this.receiveStrategies
    );
  }
}
class R {
  constructor(e, t = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map()) {
    u(this, "messageHandlers", {});
    u(this, "subscriptionListeners", {});
    u(this, "pendingRequests", /* @__PURE__ */ new Map());
    u(this, "cleanupCallbacks", []);
    this.side = e, this.emitStrategies = t, this.receiveStrategies = r, r.forEach((s) => {
      const o = s((c, n) => this.receiveNetworkMessage(c, n));
      o && this.cleanupCallbacks.push(o);
    });
  }
  /**
   * Register a handler for an incoming message.
   * The handler is responsible of listening to incoming events, and possibly responding/returning a value to them.
   * @param eventName Name of the event to be listened
   * @param handler Handler that accepts incoming message and sender, then consumes them.
   */
  registerMessageHandler(e, t) {
    this.messageHandlers[e] = t;
  }
  getEmitStrategy(e) {
    const t = this.emitStrategies.get(e.name);
    if (!t) {
      const r = d.getCurrentSide();
      throw new Error(
        `No emit strategy is registered from ${r.name} to ${e.name}`
      );
    }
    return t;
  }
  receiveNetworkMessage(e, t) {
    return l(this, null, function* () {
      if (e.eventName === g) {
        this.receiveSuccessResponse(e);
        return;
      }
      if (e.eventName === E) {
        this.receiveErrorResponse(e);
        return;
      }
      this.invokeSubscribers(e), this.handleIncomingMessage(e, t);
    });
  }
  receiveSuccessResponse(e) {
    return l(this, null, function* () {
      var r;
      const { resolve: t } = (r = this.pendingRequests.get(e.messageId)) != null ? r : {};
      t && (this.pendingRequests.delete(e.messageId), t(e.payload[0]));
    });
  }
  receiveErrorResponse(e) {
    return l(this, null, function* () {
      var r;
      const { reject: t } = (r = this.pendingRequests.get(e.messageId)) != null ? r : {};
      t && (this.pendingRequests.delete(e.messageId), t(new y(e)));
    });
  }
  invokeSubscribers(e) {
    return l(this, null, function* () {
      var t;
      Object.values((t = this.subscriptionListeners[e.eventName]) != null ? t : {}).forEach(
        (r) => {
          r(
            ...e.payload,
            d.getSide(e.fromSide),
            e
          );
        }
      );
    });
  }
  handleIncomingMessage(e, t) {
    return l(this, null, function* () {
      const r = this.messageHandlers[e.eventName];
      if (r != null) {
        const s = d.getSide(e.fromSide);
        if (!s)
          throw new Error(
            `Message received from an unknown side: ${e.fromSide}`
          );
        const a = this.getEmitStrategy(s);
        try {
          const o = yield r(
            ...e.payload,
            d.getSide(e.fromSide),
            e
          );
          a != null && a(
            {
              messageId: e.messageId,
              fromSide: e.fromSide,
              eventName: g,
              payload: [o]
            },
            t
          );
        } catch (o) {
          a != null && a(
            {
              messageId: e.messageId,
              fromSide: e.fromSide,
              eventName: E,
              payload: [
                o instanceof Error ? o.message : "Failed to handle"
              ]
            },
            t
          );
        }
      }
    });
  }
  /**
   * Emits an event to a target side of the network with the specified event name and arguments.
   *
   * @param targetSide - The side of the network to which the event will be emitted.
   * @param eventName - The name of the event to emit.
   * @param emitArgs - The arguments for the event handler corresponding to the `eventName`.
   * @param emitMetadata - The metadata for the event emitter to use.
   *
   * @example
   *  // ./common/sides.ts
   *  const OTHER_SIDE = Networker.createSide("Other-side").listens<
   *    hello(arg1: string): void;
   *  >();
   *
   *  MY_CHANNEL.emit(OTHER_SIDE, "hello", ["world"]);
   */
  emit(e, t, r, ...[s]) {
    this.getEmitStrategy(e)(
      {
        messageId: h(),
        fromSide: d.getCurrentSide().name,
        eventName: t.toString(),
        payload: r
      },
      s
    );
  }
  /**
   * Sends a request to a target side of the network with the specified event name and arguments.
   * Returns a promise that resolves with the response from the target side.
   *
   * @param targetSide - The side of the network to which the request will be sent.
   * @param eventName - The name of the event to request.
   * @param eventArgs - The arguments for the event handler corresponding to the `eventName`.
   * @param emitMetadata - The metadata for the event emitter to use.
   *
   * @returns A promise that resolves with the return value of the event handler on the target side.
   *
   * @example
   *  // ./common/sides.ts
   *  const OTHER_SIDE = Networker.createSide("Other-side").listens<
   *    hello(arg1: string): void;
   *    updateItem(itemId: string, name: string): boolean;
   *  >();
   *
   *  MY_CHANNEL.request(OTHER_SIDE, "hello", ["world"]).then(() => {
   *    console.log("Other side received my request");
   *  });
   *  MY_CHANNEL.request(OTHER_SIDE, "updateItem", ["item-1", "My Item"]).then((success) => {
   *    console.log("Update success:", success);
   *  });
   */
  request(a, o, c) {
    return l(this, arguments, function* (e, t, r, ...[s]) {
      const n = this.getEmitStrategy(e), S = h();
      return new Promise((m, f) => {
        this.pendingRequests.set(S, { resolve: m, reject: f }), n(
          {
            messageId: S,
            fromSide: d.getCurrentSide().name,
            eventName: t.toString(),
            payload: r
          },
          s
        );
      });
    });
  }
  /**
   * Subscribes to an event with the specified event name and listener.
   * Returns an unsubscribe function to remove the listener.
   *
   * @param eventName - The name of the event to subscribe to.
   * @param eventListener - The listener function to handle the event when it is triggered.
   *
   * @returns A function to unsubscribe the listener from the event.
   *
   * @example
   *  // ./common/sides.ts
   *  const MY_SIDE = Networker.createSide("Other-side").listens<
   *    print(text: string): void;
   *  >();
   *
   * // ./my-side/network.ts
   *  const MY_CHANNEL = MY_SIDE.channelBuilder().beginListening();
   *
   *  const unsubscribe = MY_CHANNEL.subscribe("print", text => {
   *    console.log(text);
   *  });
   *  setTimeout(() => unsubscribe(), 5000);
   */
  subscribe(e, t) {
    var a, o;
    const r = h(), s = (o = (a = this.subscriptionListeners)[e]) != null ? o : a[e] = {};
    return s[r] = t, () => {
      delete this.subscriptionListeners[e][r];
    };
  }
}
class v {
  constructor(e) {
    this.name = e;
  }
  channelBuilder() {
    return new N(this);
  }
}
var d;
((i) => {
  const e = [];
  let t;
  function r() {
    if (t == null)
      throw new Error("Logical side is not initialized yet.");
    return t;
  }
  i.getCurrentSide = r;
  function s(c, n) {
    if (t != null)
      throw new Error("Logical side can be declared only once.");
    if (n.side !== c)
      throw new Error("Given side and channel side doesn't match");
    t = c;
  }
  i.initialize = s;
  function a(c) {
    return {
      listens: () => {
        const n = new v(c);
        return e.push(n), n;
      }
    };
  }
  i.createSide = a;
  function o(c) {
    for (let n of e)
      if (n.name === c)
        return n;
    return null;
  }
  i.getSide = o;
})(d || (d = {}));
const UI = d.createSide("UI-side").listens();
const PLUGIN = d.createSide("Plugin-side").listens();
const PLUGIN_CHANNEL = PLUGIN.channelBuilder().emitsTo(UI, (message) => {
  figma.ui.postMessage(message);
}).receivesFrom(UI, (next) => {
  const listener = (event) => next(event);
  figma.ui.on("message", listener);
  return () => figma.ui.off("message", listener);
}).startListening();
let selectionListenerActive = false;
let selectionChangeHandler = null;
const handleSelectionChange = () => {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    const node = selection[0];
    if (node.type === "TEXT") {
      console.log("Text node selected:", node.id, node.characters);
      PLUGIN_CHANNEL.emit(UI, "textClicked", [node.id, node.characters]);
    }
  }
};
const startSelectionListener = () => {
  console.log("Starting selection listener");
  if (!selectionListenerActive) {
    selectionChangeHandler = handleSelectionChange;
    figma.on("selectionchange", selectionChangeHandler);
    selectionListenerActive = true;
    return "Selection listener started";
  } else {
    return "Selection listener already active";
  }
};
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
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const textNode = figma.createText();
    textNode.characters = text;
    textNode.fontSize = 24;
    textNode.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    figma.currentPage.appendChild(textNode);
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
  PLUGIN_CHANNEL.emit(UI, "ready", []);
});
async function bootstrap() {
  d.initialize(PLUGIN, PLUGIN_CHANNEL);
  figma.showUI(__html__, {
    width: 800,
    height: 650,
    title: "Figma Plugin"
  });
  console.log("Bootstrapped @", d.getCurrentSide().name);
  PLUGIN_CHANNEL.emit(UI, "hello", ["Plugin initialized"]);
  startSelectionListener();
}
bootstrap();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21vbm9yZXBvLW5ldHdvcmtlci9kaXN0L21vbm9yZXBvLW5ldHdvcmtlci5qcyIsIi4uL3NyYy9jb21tb24vbmV0d29ya3MudHMiLCIuLi9zcmMvcGx1Z2luL2luZGV4Lm5ldHdvcmsudHMiLCIuLi9zcmMvcGx1Z2luL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBwID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xudmFyIHcgPSAoaSwgZSwgdCkgPT4gZSBpbiBpID8gcChpLCBlLCB7IGVudW1lcmFibGU6ICEwLCBjb25maWd1cmFibGU6ICEwLCB3cml0YWJsZTogITAsIHZhbHVlOiB0IH0pIDogaVtlXSA9IHQ7XG52YXIgdSA9IChpLCBlLCB0KSA9PiAodyhpLCB0eXBlb2YgZSAhPSBcInN5bWJvbFwiID8gZSArIFwiXCIgOiBlLCB0KSwgdCk7XG52YXIgbCA9IChpLCBlLCB0KSA9PiBuZXcgUHJvbWlzZSgociwgcykgPT4ge1xuICB2YXIgYSA9IChuKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGModC5uZXh0KG4pKTtcbiAgICB9IGNhdGNoIChTKSB7XG4gICAgICBzKFMpO1xuICAgIH1cbiAgfSwgbyA9IChuKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGModC50aHJvdyhuKSk7XG4gICAgfSBjYXRjaCAoUykge1xuICAgICAgcyhTKTtcbiAgICB9XG4gIH0sIGMgPSAobikgPT4gbi5kb25lID8gcihuLnZhbHVlKSA6IFByb21pc2UucmVzb2x2ZShuLnZhbHVlKS50aGVuKGEsIG8pO1xuICBjKCh0ID0gdC5hcHBseShpLCBlKSkubmV4dCgpKTtcbn0pO1xuY2xhc3MgeSBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoZSkge1xuICAgIHN1cGVyKGUucGF5bG9hZFswXSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGgoKSB7XG4gIGNvbnN0IGkgPSBuZXcgQXJyYXkoMzYpO1xuICBmb3IgKGxldCBlID0gMDsgZSA8IDM2OyBlKyspXG4gICAgaVtlXSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2KTtcbiAgcmV0dXJuIGlbMTRdID0gNCwgaVsxOV0gPSBpWzE5XSAmPSAtNSwgaVsxOV0gPSBpWzE5XSB8PSA4LCBpWzhdID0gaVsxM10gPSBpWzE4XSA9IGlbMjNdID0gXCItXCIsIGkubWFwKChlKSA9PiBlLnRvU3RyaW5nKDE2KSkuam9pbihcIlwiKTtcbn1cbmNvbnN0IGcgPSBcIl9fSU5URVJOQUxfU1VDQ0VTU19SRVNQT05TRV9FVkVOVFwiLCBFID0gXCJfX0lOVEVSTkFMX0VSUk9SX1JFU1BPTlNFX0VWRU5UXCI7XG5jbGFzcyBOIHtcbiAgY29uc3RydWN0b3IoZSkge1xuICAgIHUodGhpcywgXCJlbWl0U3RyYXRlZ2llc1wiLCAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpKTtcbiAgICB1KHRoaXMsIFwicmVjZWl2ZVN0cmF0ZWdpZXNcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG4gICAgdGhpcy5zaWRlID0gZTtcbiAgfVxuICAvKipcbiAgICogUmVnaXN0ZXIgc3RyYXRlZ3kgZm9yIGhvdyB0aGlzIHNpZGUgcmVjZWl2ZXMgbWVzc2FnZXMgZnJvbSBnaXZlbiBvdGhlciBzaWRlLlxuICAgKlxuICAgKlxuICAgKiBAcGFyYW0gc2lkZSBUaGUgbmV0d29yayBzaWRlIGZyb20gd2hpY2ggbWVzc2FnZXMgd2lsbCBiZSByZWNlaXZlZC5cbiAgICogQHBhcmFtIHN0cmF0ZWd5IFRoZSBzdHJhdGVneSBmb3IgaGFuZGxpbmcgaW5jb21pbmcgbWVzc2FnZXMgZnJvbSB0aGUgc3BlY2lmaWVkIHNpZGUuXG4gICAqIEByZXR1cm5zIFRoaXMgY2hhbm5lbCwgc28geW91IGNhbiBjaGFpbiBtb3JlIHRoaW5ncyBhcyBuZWVkZWRcbiAgICovXG4gIHJlY2VpdmVzRnJvbShlLCB0KSB7XG4gICAgcmV0dXJuIHRoaXMucmVjZWl2ZVN0cmF0ZWdpZXMuc2V0KGUubmFtZSwgdCksIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHN0cmF0ZWd5IG9uIGhvdyB0aGlzIHNpZGUgZW1pdHMgbWVzc2FnZSB0byBnaXZlbiBvdGhlciBzaWRlLlxuICAgKlxuICAgKiBAcGFyYW0gdG8gVGhlIHRhcmdldCBuZXR3b3JrIHNpZGUgdG8gd2hpY2ggbWVzc2FnZXMgd2lsbCBiZSBlbWl0dGVkLlxuICAgKiBAcGFyYW0gc3RyYXRlZ3kgU3RyYXRlZ3kgZm9yIGVtaXR0aW5nIGEgbWVzc2FnZS5cbiAgICogQHJldHVybnMgVGhpcyBjaGFubmVsLCBzbyB5b3UgY2FuIGNoYWluIG1vcmUgdGhpbmdzIGFzIG5lZWRlZFxuICAgKi9cbiAgZW1pdHNUbyhlLCB0KSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdFN0cmF0ZWdpZXMuc2V0KGUubmFtZSwgdCksIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIEZpbmFsaXplcyBhbmQgYnVpbGRzIHRoZSBDaGFubmVsLlxuICAgKiBBbmQgc3RhcnRzIGxpc3RlbmluZyB3aXRoIHJlZ2lzdGVyZWQgcmVjZWl2aW5nIHN0cmF0ZWdpZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjaGFubmVsXG4gICAqL1xuICBzdGFydExpc3RlbmluZygpIHtcbiAgICByZXR1cm4gbmV3IFIoXG4gICAgICB0aGlzLnNpZGUsXG4gICAgICB0aGlzLmVtaXRTdHJhdGVnaWVzLFxuICAgICAgdGhpcy5yZWNlaXZlU3RyYXRlZ2llc1xuICAgICk7XG4gIH1cbn1cbmNsYXNzIFIge1xuICBjb25zdHJ1Y3RvcihlLCB0ID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSwgciA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpIHtcbiAgICB1KHRoaXMsIFwibWVzc2FnZUhhbmRsZXJzXCIsIHt9KTtcbiAgICB1KHRoaXMsIFwic3Vic2NyaXB0aW9uTGlzdGVuZXJzXCIsIHt9KTtcbiAgICB1KHRoaXMsIFwicGVuZGluZ1JlcXVlc3RzXCIsIC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpO1xuICAgIHUodGhpcywgXCJjbGVhbnVwQ2FsbGJhY2tzXCIsIFtdKTtcbiAgICB0aGlzLnNpZGUgPSBlLCB0aGlzLmVtaXRTdHJhdGVnaWVzID0gdCwgdGhpcy5yZWNlaXZlU3RyYXRlZ2llcyA9IHIsIHIuZm9yRWFjaCgocykgPT4ge1xuICAgICAgY29uc3QgbyA9IHMoKGMsIG4pID0+IHRoaXMucmVjZWl2ZU5ldHdvcmtNZXNzYWdlKGMsIG4pKTtcbiAgICAgIG8gJiYgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2gobyk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3IgYW4gaW5jb21pbmcgbWVzc2FnZS5cbiAgICogVGhlIGhhbmRsZXIgaXMgcmVzcG9uc2libGUgb2YgbGlzdGVuaW5nIHRvIGluY29taW5nIGV2ZW50cywgYW5kIHBvc3NpYmx5IHJlc3BvbmRpbmcvcmV0dXJuaW5nIGEgdmFsdWUgdG8gdGhlbS5cbiAgICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudCB0byBiZSBsaXN0ZW5lZFxuICAgKiBAcGFyYW0gaGFuZGxlciBIYW5kbGVyIHRoYXQgYWNjZXB0cyBpbmNvbWluZyBtZXNzYWdlIGFuZCBzZW5kZXIsIHRoZW4gY29uc3VtZXMgdGhlbS5cbiAgICovXG4gIHJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoZSwgdCkge1xuICAgIHRoaXMubWVzc2FnZUhhbmRsZXJzW2VdID0gdDtcbiAgfVxuICBnZXRFbWl0U3RyYXRlZ3koZSkge1xuICAgIGNvbnN0IHQgPSB0aGlzLmVtaXRTdHJhdGVnaWVzLmdldChlLm5hbWUpO1xuICAgIGlmICghdCkge1xuICAgICAgY29uc3QgciA9IGQuZ2V0Q3VycmVudFNpZGUoKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE5vIGVtaXQgc3RyYXRlZ3kgaXMgcmVnaXN0ZXJlZCBmcm9tICR7ci5uYW1lfSB0byAke2UubmFtZX1gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbiAgfVxuICByZWNlaXZlTmV0d29ya01lc3NhZ2UoZSwgdCkge1xuICAgIHJldHVybiBsKHRoaXMsIG51bGwsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICBpZiAoZS5ldmVudE5hbWUgPT09IGcpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlU3VjY2Vzc1Jlc3BvbnNlKGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZS5ldmVudE5hbWUgPT09IEUpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlRXJyb3JSZXNwb25zZShlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5pbnZva2VTdWJzY3JpYmVycyhlKSwgdGhpcy5oYW5kbGVJbmNvbWluZ01lc3NhZ2UoZSwgdCk7XG4gICAgfSk7XG4gIH1cbiAgcmVjZWl2ZVN1Y2Nlc3NSZXNwb25zZShlKSB7XG4gICAgcmV0dXJuIGwodGhpcywgbnVsbCwgZnVuY3Rpb24qICgpIHtcbiAgICAgIHZhciByO1xuICAgICAgY29uc3QgeyByZXNvbHZlOiB0IH0gPSAociA9IHRoaXMucGVuZGluZ1JlcXVlc3RzLmdldChlLm1lc3NhZ2VJZCkpICE9IG51bGwgPyByIDoge307XG4gICAgICB0ICYmICh0aGlzLnBlbmRpbmdSZXF1ZXN0cy5kZWxldGUoZS5tZXNzYWdlSWQpLCB0KGUucGF5bG9hZFswXSkpO1xuICAgIH0pO1xuICB9XG4gIHJlY2VpdmVFcnJvclJlc3BvbnNlKGUpIHtcbiAgICByZXR1cm4gbCh0aGlzLCBudWxsLCBmdW5jdGlvbiogKCkge1xuICAgICAgdmFyIHI7XG4gICAgICBjb25zdCB7IHJlamVjdDogdCB9ID0gKHIgPSB0aGlzLnBlbmRpbmdSZXF1ZXN0cy5nZXQoZS5tZXNzYWdlSWQpKSAhPSBudWxsID8gciA6IHt9O1xuICAgICAgdCAmJiAodGhpcy5wZW5kaW5nUmVxdWVzdHMuZGVsZXRlKGUubWVzc2FnZUlkKSwgdChuZXcgeShlKSkpO1xuICAgIH0pO1xuICB9XG4gIGludm9rZVN1YnNjcmliZXJzKGUpIHtcbiAgICByZXR1cm4gbCh0aGlzLCBudWxsLCBmdW5jdGlvbiogKCkge1xuICAgICAgdmFyIHQ7XG4gICAgICBPYmplY3QudmFsdWVzKCh0ID0gdGhpcy5zdWJzY3JpcHRpb25MaXN0ZW5lcnNbZS5ldmVudE5hbWVdKSAhPSBudWxsID8gdCA6IHt9KS5mb3JFYWNoKFxuICAgICAgICAocikgPT4ge1xuICAgICAgICAgIHIoXG4gICAgICAgICAgICAuLi5lLnBheWxvYWQsXG4gICAgICAgICAgICBkLmdldFNpZGUoZS5mcm9tU2lkZSksXG4gICAgICAgICAgICBlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICBoYW5kbGVJbmNvbWluZ01lc3NhZ2UoZSwgdCkge1xuICAgIHJldHVybiBsKHRoaXMsIG51bGwsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICBjb25zdCByID0gdGhpcy5tZXNzYWdlSGFuZGxlcnNbZS5ldmVudE5hbWVdO1xuICAgICAgaWYgKHIgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBzID0gZC5nZXRTaWRlKGUuZnJvbVNpZGUpO1xuICAgICAgICBpZiAoIXMpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYE1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSBhbiB1bmtub3duIHNpZGU6ICR7ZS5mcm9tU2lkZX1gXG4gICAgICAgICAgKTtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuZ2V0RW1pdFN0cmF0ZWd5KHMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG8gPSB5aWVsZCByKFxuICAgICAgICAgICAgLi4uZS5wYXlsb2FkLFxuICAgICAgICAgICAgZC5nZXRTaWRlKGUuZnJvbVNpZGUpLFxuICAgICAgICAgICAgZVxuICAgICAgICAgICk7XG4gICAgICAgICAgYSAhPSBudWxsICYmIGEoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VJZDogZS5tZXNzYWdlSWQsXG4gICAgICAgICAgICAgIGZyb21TaWRlOiBlLmZyb21TaWRlLFxuICAgICAgICAgICAgICBldmVudE5hbWU6IGcsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IFtvXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChvKSB7XG4gICAgICAgICAgYSAhPSBudWxsICYmIGEoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VJZDogZS5tZXNzYWdlSWQsXG4gICAgICAgICAgICAgIGZyb21TaWRlOiBlLmZyb21TaWRlLFxuICAgICAgICAgICAgICBldmVudE5hbWU6IEUsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IFtcbiAgICAgICAgICAgICAgICBvIGluc3RhbmNlb2YgRXJyb3IgPyBvLm1lc3NhZ2UgOiBcIkZhaWxlZCB0byBoYW5kbGVcIlxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgdG8gYSB0YXJnZXQgc2lkZSBvZiB0aGUgbmV0d29yayB3aXRoIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZSBhbmQgYXJndW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gdGFyZ2V0U2lkZSAtIFRoZSBzaWRlIG9mIHRoZSBuZXR3b3JrIHRvIHdoaWNoIHRoZSBldmVudCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdC5cbiAgICogQHBhcmFtIGVtaXRBcmdzIC0gVGhlIGFyZ3VtZW50cyBmb3IgdGhlIGV2ZW50IGhhbmRsZXIgY29ycmVzcG9uZGluZyB0byB0aGUgYGV2ZW50TmFtZWAuXG4gICAqIEBwYXJhbSBlbWl0TWV0YWRhdGEgLSBUaGUgbWV0YWRhdGEgZm9yIHRoZSBldmVudCBlbWl0dGVyIHRvIHVzZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogIC8vIC4vY29tbW9uL3NpZGVzLnRzXG4gICAqICBjb25zdCBPVEhFUl9TSURFID0gTmV0d29ya2VyLmNyZWF0ZVNpZGUoXCJPdGhlci1zaWRlXCIpLmxpc3RlbnM8XG4gICAqICAgIGhlbGxvKGFyZzE6IHN0cmluZyk6IHZvaWQ7XG4gICAqICA+KCk7XG4gICAqXG4gICAqICBNWV9DSEFOTkVMLmVtaXQoT1RIRVJfU0lERSwgXCJoZWxsb1wiLCBbXCJ3b3JsZFwiXSk7XG4gICAqL1xuICBlbWl0KGUsIHQsIHIsIC4uLltzXSkge1xuICAgIHRoaXMuZ2V0RW1pdFN0cmF0ZWd5KGUpKFxuICAgICAge1xuICAgICAgICBtZXNzYWdlSWQ6IGgoKSxcbiAgICAgICAgZnJvbVNpZGU6IGQuZ2V0Q3VycmVudFNpZGUoKS5uYW1lLFxuICAgICAgICBldmVudE5hbWU6IHQudG9TdHJpbmcoKSxcbiAgICAgICAgcGF5bG9hZDogclxuICAgICAgfSxcbiAgICAgIHNcbiAgICApO1xuICB9XG4gIC8qKlxuICAgKiBTZW5kcyBhIHJlcXVlc3QgdG8gYSB0YXJnZXQgc2lkZSBvZiB0aGUgbmV0d29yayB3aXRoIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZSBhbmQgYXJndW1lbnRzLlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlIGZyb20gdGhlIHRhcmdldCBzaWRlLlxuICAgKlxuICAgKiBAcGFyYW0gdGFyZ2V0U2lkZSAtIFRoZSBzaWRlIG9mIHRoZSBuZXR3b3JrIHRvIHdoaWNoIHRoZSByZXF1ZXN0IHdpbGwgYmUgc2VudC5cbiAgICogQHBhcmFtIGV2ZW50TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudCB0byByZXF1ZXN0LlxuICAgKiBAcGFyYW0gZXZlbnRBcmdzIC0gVGhlIGFyZ3VtZW50cyBmb3IgdGhlIGV2ZW50IGhhbmRsZXIgY29ycmVzcG9uZGluZyB0byB0aGUgYGV2ZW50TmFtZWAuXG4gICAqIEBwYXJhbSBlbWl0TWV0YWRhdGEgLSBUaGUgbWV0YWRhdGEgZm9yIHRoZSBldmVudCBlbWl0dGVyIHRvIHVzZS5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSB0YXJnZXQgc2lkZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogIC8vIC4vY29tbW9uL3NpZGVzLnRzXG4gICAqICBjb25zdCBPVEhFUl9TSURFID0gTmV0d29ya2VyLmNyZWF0ZVNpZGUoXCJPdGhlci1zaWRlXCIpLmxpc3RlbnM8XG4gICAqICAgIGhlbGxvKGFyZzE6IHN0cmluZyk6IHZvaWQ7XG4gICAqICAgIHVwZGF0ZUl0ZW0oaXRlbUlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW47XG4gICAqICA+KCk7XG4gICAqXG4gICAqICBNWV9DSEFOTkVMLnJlcXVlc3QoT1RIRVJfU0lERSwgXCJoZWxsb1wiLCBbXCJ3b3JsZFwiXSkudGhlbigoKSA9PiB7XG4gICAqICAgIGNvbnNvbGUubG9nKFwiT3RoZXIgc2lkZSByZWNlaXZlZCBteSByZXF1ZXN0XCIpO1xuICAgKiAgfSk7XG4gICAqICBNWV9DSEFOTkVMLnJlcXVlc3QoT1RIRVJfU0lERSwgXCJ1cGRhdGVJdGVtXCIsIFtcIml0ZW0tMVwiLCBcIk15IEl0ZW1cIl0pLnRoZW4oKHN1Y2Nlc3MpID0+IHtcbiAgICogICAgY29uc29sZS5sb2coXCJVcGRhdGUgc3VjY2VzczpcIiwgc3VjY2Vzcyk7XG4gICAqICB9KTtcbiAgICovXG4gIHJlcXVlc3QoYSwgbywgYykge1xuICAgIHJldHVybiBsKHRoaXMsIGFyZ3VtZW50cywgZnVuY3Rpb24qIChlLCB0LCByLCAuLi5bc10pIHtcbiAgICAgIGNvbnN0IG4gPSB0aGlzLmdldEVtaXRTdHJhdGVneShlKSwgUyA9IGgoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgobSwgZikgPT4ge1xuICAgICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0cy5zZXQoUywgeyByZXNvbHZlOiBtLCByZWplY3Q6IGYgfSksIG4oXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZUlkOiBTLFxuICAgICAgICAgICAgZnJvbVNpZGU6IGQuZ2V0Q3VycmVudFNpZGUoKS5uYW1lLFxuICAgICAgICAgICAgZXZlbnROYW1lOiB0LnRvU3RyaW5nKCksXG4gICAgICAgICAgICBwYXlsb2FkOiByXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogU3Vic2NyaWJlcyB0byBhbiBldmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZSBhbmQgbGlzdGVuZXIuXG4gICAqIFJldHVybnMgYW4gdW5zdWJzY3JpYmUgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudCB0byBzdWJzY3JpYmUgdG8uXG4gICAqIEBwYXJhbSBldmVudExpc3RlbmVyIC0gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZXZlbnQgd2hlbiBpdCBpcyB0cmlnZ2VyZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gdW5zdWJzY3JpYmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgLy8gLi9jb21tb24vc2lkZXMudHNcbiAgICogIGNvbnN0IE1ZX1NJREUgPSBOZXR3b3JrZXIuY3JlYXRlU2lkZShcIk90aGVyLXNpZGVcIikubGlzdGVuczxcbiAgICogICAgcHJpbnQodGV4dDogc3RyaW5nKTogdm9pZDtcbiAgICogID4oKTtcbiAgICpcbiAgICogLy8gLi9teS1zaWRlL25ldHdvcmsudHNcbiAgICogIGNvbnN0IE1ZX0NIQU5ORUwgPSBNWV9TSURFLmNoYW5uZWxCdWlsZGVyKCkuYmVnaW5MaXN0ZW5pbmcoKTtcbiAgICpcbiAgICogIGNvbnN0IHVuc3Vic2NyaWJlID0gTVlfQ0hBTk5FTC5zdWJzY3JpYmUoXCJwcmludFwiLCB0ZXh0ID0+IHtcbiAgICogICAgY29uc29sZS5sb2codGV4dCk7XG4gICAqICB9KTtcbiAgICogIHNldFRpbWVvdXQoKCkgPT4gdW5zdWJzY3JpYmUoKSwgNTAwMCk7XG4gICAqL1xuICBzdWJzY3JpYmUoZSwgdCkge1xuICAgIHZhciBhLCBvO1xuICAgIGNvbnN0IHIgPSBoKCksIHMgPSAobyA9IChhID0gdGhpcy5zdWJzY3JpcHRpb25MaXN0ZW5lcnMpW2VdKSAhPSBudWxsID8gbyA6IGFbZV0gPSB7fTtcbiAgICByZXR1cm4gc1tyXSA9IHQsICgpID0+IHtcbiAgICAgIGRlbGV0ZSB0aGlzLnN1YnNjcmlwdGlvbkxpc3RlbmVyc1tlXVtyXTtcbiAgICB9O1xuICB9XG59XG5jbGFzcyB2IHtcbiAgY29uc3RydWN0b3IoZSkge1xuICAgIHRoaXMubmFtZSA9IGU7XG4gIH1cbiAgY2hhbm5lbEJ1aWxkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBOKHRoaXMpO1xuICB9XG59XG52YXIgZDtcbigoaSkgPT4ge1xuICBjb25zdCBlID0gW107XG4gIGxldCB0O1xuICBmdW5jdGlvbiByKCkge1xuICAgIGlmICh0ID09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb2dpY2FsIHNpZGUgaXMgbm90IGluaXRpYWxpemVkIHlldC5cIik7XG4gICAgcmV0dXJuIHQ7XG4gIH1cbiAgaS5nZXRDdXJyZW50U2lkZSA9IHI7XG4gIGZ1bmN0aW9uIHMoYywgbikge1xuICAgIGlmICh0ICE9IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb2dpY2FsIHNpZGUgY2FuIGJlIGRlY2xhcmVkIG9ubHkgb25jZS5cIik7XG4gICAgaWYgKG4uc2lkZSAhPT0gYylcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdpdmVuIHNpZGUgYW5kIGNoYW5uZWwgc2lkZSBkb2Vzbid0IG1hdGNoXCIpO1xuICAgIHQgPSBjO1xuICB9XG4gIGkuaW5pdGlhbGl6ZSA9IHM7XG4gIGZ1bmN0aW9uIGEoYykge1xuICAgIHJldHVybiB7XG4gICAgICBsaXN0ZW5zOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG4gPSBuZXcgdihjKTtcbiAgICAgICAgcmV0dXJuIGUucHVzaChuKSwgbjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGkuY3JlYXRlU2lkZSA9IGE7XG4gIGZ1bmN0aW9uIG8oYykge1xuICAgIGZvciAobGV0IG4gb2YgZSlcbiAgICAgIGlmIChuLm5hbWUgPT09IGMpXG4gICAgICAgIHJldHVybiBuO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGkuZ2V0U2lkZSA9IG87XG59KShkIHx8IChkID0ge30pKTtcbmV4cG9ydCB7XG4gIHkgYXMgTmV0d29ya0Vycm9yLFxuICBkIGFzIE5ldHdvcmtlclxufTtcbiIsImltcG9ydCB7IE5ldHdvcmtlciB9IGZyb20gJ21vbm9yZXBvLW5ldHdvcmtlcidcblxuZXhwb3J0IGNvbnN0IFVJID0gTmV0d29ya2VyLmNyZWF0ZVNpZGUoJ1VJLXNpZGUnKS5saXN0ZW5zPHtcbiAgcGluZygpOiAncG9uZydcbiAgcG9uZygpOiAncGluZydcbiAgaGVsbG8odGV4dDogc3RyaW5nKTogdm9pZFxuICByZWFkeSgpOiB2b2lkXG4gIHRleHRDbGlja2VkKG5vZGVJZDogc3RyaW5nLCB0ZXh0OiBzdHJpbmcpOiB2b2lkXG59PigpXG5cbmV4cG9ydCBjb25zdCBQTFVHSU4gPSBOZXR3b3JrZXIuY3JlYXRlU2lkZSgnUGx1Z2luLXNpZGUnKS5saXN0ZW5zPHtcbiAgcGluZyhjb3VudDogbnVtYmVyKTogc3RyaW5nXG4gIHBvbmcoKTogJ3BpbmcnXG4gIGhlbGxvKHRleHQ6IHN0cmluZyk6IHZvaWRcbiAgaGVsbG9BY2soKTogdm9pZFxuICBtZXNzYWdlKHRleHQ6IHN0cmluZyk6IHN0cmluZ1xuICBjcmVhdGVSZWN0KHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyKTogdm9pZFxuICBjcmVhdGVUZXh0KHRleHQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPlxuICBleHBvcnRTZWxlY3Rpb24oKTogUHJvbWlzZTxzdHJpbmc+XG59PigpXG4iLCJpbXBvcnQgeyBQTFVHSU4sIFVJIH0gZnJvbSAnLi4vY29tbW9uL25ldHdvcmtzJ1xuXG5leHBvcnQgY29uc3QgUExVR0lOX0NIQU5ORUwgPSBQTFVHSU4uY2hhbm5lbEJ1aWxkZXIoKVxuICAuZW1pdHNUbyhVSSwgbWVzc2FnZSA9PiB7XG4gICAgZmlnbWEudWkucG9zdE1lc3NhZ2UobWVzc2FnZSlcbiAgfSlcbiAgLnJlY2VpdmVzRnJvbShVSSwgbmV4dCA9PiB7XG4gICAgY29uc3QgbGlzdGVuZXI6IE1lc3NhZ2VFdmVudEhhbmRsZXIgPSBldmVudCA9PiBuZXh0KGV2ZW50KVxuICAgIGZpZ21hLnVpLm9uKCdtZXNzYWdlJywgbGlzdGVuZXIpXG4gICAgcmV0dXJuICgpID0+IGZpZ21hLnVpLm9mZignbWVzc2FnZScsIGxpc3RlbmVyKVxuICB9KVxuICAuc3RhcnRMaXN0ZW5pbmcoKVxuXG4vLyAtLS0tLS0tLS0tIFNlbGVjdGlvbiBtYW5hZ2VtZW50XG5sZXQgc2VsZWN0aW9uTGlzdGVuZXJBY3RpdmUgPSBmYWxzZVxubGV0IHNlbGVjdGlvbkNoYW5nZUhhbmRsZXI6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsXG5cbmNvbnN0IGhhbmRsZVNlbGVjdGlvbkNoYW5nZSA9ICgpID0+IHtcbiAgY29uc3Qgc2VsZWN0aW9uID0gZmlnbWEuY3VycmVudFBhZ2Uuc2VsZWN0aW9uXG5cbiAgaWYgKHNlbGVjdGlvbi5sZW5ndGggPT09IDEpIHtcbiAgICBjb25zdCBub2RlID0gc2VsZWN0aW9uWzBdXG5cbiAgICAvLyBDaGVjayBpZiB0aGUgc2VsZWN0ZWQgbm9kZSBpcyBhIHRleHQgbm9kZVxuICAgIGlmIChub2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgY29uc29sZS5sb2coJ1RleHQgbm9kZSBzZWxlY3RlZDonLCBub2RlLmlkLCBub2RlLmNoYXJhY3RlcnMpXG5cbiAgICAgIC8vIFNlbmQgbm90aWZpY2F0aW9uIHRvIFVJXG4gICAgICBQTFVHSU5fQ0hBTk5FTC5lbWl0KFVJLCAndGV4dENsaWNrZWQnLCBbbm9kZS5pZCwgbm9kZS5jaGFyYWN0ZXJzXSlcbiAgICB9XG4gIH1cbn1cblxuLy8gRXhwb3J0IGZ1bmN0aW9uIHRvIHN0YXJ0IHNlbGVjdGlvbiBsaXN0ZW5lciAoZm9yIGRpcmVjdCB1c2UpXG5leHBvcnQgY29uc3Qgc3RhcnRTZWxlY3Rpb25MaXN0ZW5lciA9ICgpOiBzdHJpbmcgPT4ge1xuICBjb25zb2xlLmxvZygnU3RhcnRpbmcgc2VsZWN0aW9uIGxpc3RlbmVyJylcblxuICBpZiAoIXNlbGVjdGlvbkxpc3RlbmVyQWN0aXZlKSB7XG4gICAgc2VsZWN0aW9uQ2hhbmdlSGFuZGxlciA9IGhhbmRsZVNlbGVjdGlvbkNoYW5nZVxuICAgIGZpZ21hLm9uKCdzZWxlY3Rpb25jaGFuZ2UnLCBzZWxlY3Rpb25DaGFuZ2VIYW5kbGVyKVxuICAgIHNlbGVjdGlvbkxpc3RlbmVyQWN0aXZlID0gdHJ1ZVxuICAgIHJldHVybiAnU2VsZWN0aW9uIGxpc3RlbmVyIHN0YXJ0ZWQnXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICdTZWxlY3Rpb24gbGlzdGVuZXIgYWxyZWFkeSBhY3RpdmUnXG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLSBNZXNzYWdlIGhhbmRsZXJzXG5cblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ3BpbmcnLCBjb3VudCA9PiB7XG4gIGNvbnNvbGUubG9nKCdQbHVnaW4gcmVjZWl2ZWQgcGluZyB3aXRoIGNvdW50OicsIGNvdW50LCAncmVzcG9uZGluZyB3aXRoIHBvbmcnKVxuICByZXR1cm4gYHBvbmc6ICR7Y291bnR9YFxufSlcblxuUExVR0lOX0NIQU5ORUwucmVnaXN0ZXJNZXNzYWdlSGFuZGxlcigncG9uZycsICgpID0+IHtcbiAgY29uc29sZS5sb2coJ1BsdWdpbiByZWNlaXZlZCBwb25nLCByZXNwb25kaW5nIHdpdGggcGluZycpXG4gIHJldHVybiAncGluZydcbn0pXG5cblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ21lc3NhZ2UnLCB0ZXh0ID0+IHtcbiAgY29uc29sZS5sb2coJ1BsdWdpbiByZWNlaXZlZCBtZXNzYWdlOicsIHRleHQpXG4gIHJldHVybiBgcmVjZWl2ZWQgJHt0ZXh0fSBmcm9tIHBsdWdpbmBcbn0pXG5cblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ2NyZWF0ZVRleHQnLCBhc3luYyB0ZXh0ID0+IHtcbiAgY29uc29sZS5sb2coJ1BsdWdpbiBjcmVhdGluZyB0ZXh0OicsIHRleHQpXG5cbiAgdHJ5IHtcbiAgICAvLyBMb2FkIHRoZSBkZWZhdWx0IGZvbnQgZmlyc3RcbiAgICBhd2FpdCBmaWdtYS5sb2FkRm9udEFzeW5jKHsgZmFtaWx5OiAnSW50ZXInLCBzdHlsZTogJ1JlZ3VsYXInIH0pXG5cbiAgICAvLyBDcmVhdGUgYSB0ZXh0IG5vZGUgaW4gRmlnbWFcbiAgICBjb25zdCB0ZXh0Tm9kZSA9IGZpZ21hLmNyZWF0ZVRleHQoKVxuICAgIHRleHROb2RlLmNoYXJhY3RlcnMgPSB0ZXh0XG4gICAgdGV4dE5vZGUuZm9udFNpemUgPSAyNFxuICAgIHRleHROb2RlLmZpbGxzID0gW3sgdHlwZTogJ1NPTElEJywgY29sb3I6IHsgcjogMCwgZzogMCwgYjogMCB9IH1dXG5cbiAgICAvLyBBZGQgdG8gY3VycmVudCBwYWdlXG4gICAgZmlnbWEuY3VycmVudFBhZ2UuYXBwZW5kQ2hpbGQodGV4dE5vZGUpXG5cbiAgICAvLyBQb3NpdGlvbiBpdCBpbiB0aGUgY2VudGVyIG9mIHRoZSB2aWV3cG9ydFxuICAgIHRleHROb2RlLnggPSBmaWdtYS52aWV3cG9ydC5jZW50ZXIueCAtIHRleHROb2RlLndpZHRoIC8gMlxuICAgIHRleHROb2RlLnkgPSBmaWdtYS52aWV3cG9ydC5jZW50ZXIueSAtIHRleHROb2RlLmhlaWdodCAvIDJcblxuICAgIHJldHVybiBgQ3JlYXRlZCB0ZXh0OiBcIiR7dGV4dH1cImBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyB0ZXh0OicsIGVycm9yKVxuICAgIHJldHVybiBgRXJyb3IgY3JlYXRpbmcgdGV4dDogJHtlcnJvcn1gXG4gIH1cbn0pXG5cblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ2hlbGxvJywgdGV4dCA9PiB7XG4gIGNvbnNvbGUubG9nKCdVSSBzaWRlIHNhaWQ6JywgdGV4dClcbn0pXG5cblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ2hlbGxvQWNrJywgKCkgPT4ge1xuICBjb25zb2xlLmxvZygnUmVjZWl2ZWQgaGVsbG8tYWNrIGZyb20gVUksIHNlbmRpbmcgcmVhZHkgc2lnbmFsJylcbiAgLy8gU3RlcCAzIG9mIGhhbmRzaGFrZTogU2VuZCByZWFkeSBzaWduYWwgdG8gVUlcbiAgUExVR0lOX0NIQU5ORUwuZW1pdChVSSwgJ3JlYWR5JywgW10pXG59KVxuIiwiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJAZmlnbWEvcGx1Z2luLXR5cGluZ3NcIiAvPlxuXG5pbXBvcnQgeyBQTFVHSU4sIFVJIH0gZnJvbSAnLi4vY29tbW9uL25ldHdvcmtzJ1xuaW1wb3J0IHsgUExVR0lOX0NIQU5ORUwsIHN0YXJ0U2VsZWN0aW9uTGlzdGVuZXIgfSBmcm9tICcuL2luZGV4Lm5ldHdvcmsnXG5pbXBvcnQgeyBOZXR3b3JrZXIgfSBmcm9tICdtb25vcmVwby1uZXR3b3JrZXInXG5cbmFzeW5jIGZ1bmN0aW9uIGJvb3RzdHJhcCgpIHtcbiAgTmV0d29ya2VyLmluaXRpYWxpemUoUExVR0lOLCBQTFVHSU5fQ0hBTk5FTClcblxuICBmaWdtYS5zaG93VUkoX19odG1sX18sIHtcbiAgICB3aWR0aDogODAwLFxuICAgIGhlaWdodDogNjUwLFxuICAgIHRpdGxlOiAnRmlnbWEgUGx1Z2luJyxcbiAgfSlcbiAgY29uc29sZS5sb2coJ0Jvb3RzdHJhcHBlZCBAJywgTmV0d29ya2VyLmdldEN1cnJlbnRTaWRlKCkubmFtZSlcbiAgUExVR0lOX0NIQU5ORUwuZW1pdChVSSwgJ2hlbGxvJywgWydQbHVnaW4gaW5pdGlhbGl6ZWQnXSlcblxuICBzdGFydFNlbGVjdGlvbkxpc3RlbmVyKClcbn1cblxuYm9vdHN0cmFwKClcbiJdLCJuYW1lcyI6WyJOZXR3b3JrZXIiXSwibWFwcGluZ3MiOiJBQUFBLElBQUksSUFBSSxPQUFPO0FBQ2YsSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLEVBQUUsWUFBWSxNQUFJLGNBQWMsTUFBSSxVQUFVLE1BQUksT0FBTyxFQUFDLENBQUUsSUFBSSxFQUFFLENBQUMsSUFBSTtBQUM3RyxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLEdBQUcsT0FBTyxLQUFLLFdBQVcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHO0FBQ2xFLElBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLElBQUksUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUN6QyxNQUFJLElBQUksQ0FBQyxNQUFNO0FBQ2IsUUFBSTtBQUNGLFFBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUFBLElBQ2IsU0FBUyxHQUFHO0FBQ1YsUUFBRSxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0YsR0FBRyxJQUFJLENBQUMsTUFBTTtBQUNaLFFBQUk7QUFDRixRQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFBQSxJQUNkLFNBQVMsR0FBRztBQUNWLFFBQUUsQ0FBQztBQUFBLElBQ0w7QUFBQSxFQUNGLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLElBQUksUUFBUSxRQUFRLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDO0FBQ3RF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
