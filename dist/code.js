var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
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
const ErrorCategory = {
  FIGMA_API: "FIGMA_API",
  SYSTEM: "SYSTEM"
};
const ErrorSeverity = {
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};
class FigmaPluginError extends Error {
  constructor(message, options) {
    var _a;
    super(message);
    __publicField(this, "id");
    __publicField(this, "category");
    __publicField(this, "severity");
    __publicField(this, "context");
    __publicField(this, "isRecoverable");
    __publicField(this, "recoveryActions");
    __publicField(this, "userFriendlyMessage");
    this.name = "FigmaPluginError";
    this.id = generateErrorId();
    this.category = options.category;
    this.severity = options.severity;
    this.isRecoverable = (_a = options.isRecoverable) != null ? _a : true;
    this.recoveryActions = options.recoveryActions;
    this.userFriendlyMessage = options.userFriendlyMessage;
    this.context = __spreadValues({
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      environment: "UI"
    }, options.context);
    if (options.cause) {
      this.cause = options.cause;
      this.stack = options.cause.stack;
    }
  }
  toStructured() {
    return {
      id: this.id,
      category: this.category,
      severity: this.severity,
      message: this.message,
      stack: this.stack,
      context: this.context,
      originalError: this.cause,
      isRecoverable: this.isRecoverable,
      recoveryActions: this.recoveryActions,
      userFriendlyMessage: this.userFriendlyMessage
    };
  }
}
const createFigmaAPIError = (message, context) => new FigmaPluginError(message, {
  category: ErrorCategory.FIGMA_API,
  severity: ErrorSeverity.HIGH,
  context: context || {},
  isRecoverable: true,
  recoveryActions: ["Refresh the plugin", "Check Figma permissions"],
  userFriendlyMessage: "Figma API issue. Please refresh the plugin and try again."
});
function generateErrorId() {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function isRecoverableError(error) {
  if (error instanceof FigmaPluginError) {
    return error.isRecoverable;
  }
  return true;
}
function convertToFigmaError(error, context) {
  if (error instanceof FigmaPluginError) {
    return error;
  }
  if (error instanceof Error) {
    return new FigmaPluginError(error.message, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      context: context || {},
      cause: error,
      isRecoverable: true
    });
  }
  return new FigmaPluginError(String(error), {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.MEDIUM,
    context: context || {},
    isRecoverable: true
  });
}
async function withRetry(operation, options) {
  let lastError;
  const { maxAttempts, delay, backoffMultiplier = 1.5, shouldRetry = isRecoverableError } = options;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      const currentDelay = delay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
    }
  }
  throw lastError;
}
const LogLevel = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  FATAL: "FATAL"
};
class StructuredLogger {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "localStorage", null);
    __publicField(this, "logBuffer", []);
    __publicField(this, "syncQueue", []);
    __publicField(this, "cloudSyncEnabled", false);
    this.config = config;
    this.setupStorage();
    this.setupCloudSync();
  }
  setupStorage() {
    if (this.config.enableLocalStorage) {
      try {
        this.localStorage = typeof window !== "undefined" ? window.localStorage : null;
        if (this.localStorage) {
          this.loadStoredLogs();
        }
      } catch (error) {
        console.warn("localStorage not available, using in-memory logging only", error);
      }
    }
  }
  setupCloudSync() {
    var _a;
    if (this.config.enableCloudSync && ((_a = this.config.sentryConfig) == null ? void 0 : _a.enabled)) {
      this.cloudSyncEnabled = true;
      this.initializeSentry();
    }
  }
  initializeSentry() {
    var _a;
    if (typeof window !== "undefined" && ((_a = this.config.sentryConfig) == null ? void 0 : _a.dsn)) {
      console.info("Sentry integration ready for network-enabled mode");
    }
  }
  shouldLog(level) {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  createLogEntry(level, message, data, error) {
    return {
      id: this.generateLogId(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      message,
      environment: this.config.environment,
      category: (error == null ? void 0 : error.category) || (data == null ? void 0 : data.category),
      data,
      error,
      stack: error == null ? void 0 : error.stack,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      pluginVersion: this.config.pluginVersion,
      figmaVersion: void 0
      // Figma version not available in plugin API
    };
  }
  persistLog(entry) {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.config.maxLocalEntries) {
      this.logBuffer.shift();
    }
    if (this.localStorage) {
      try {
        const stored = this.getStoredLogs();
        stored.push(entry);
        if (stored.length > this.config.maxLocalEntries) {
          stored.splice(0, stored.length - this.config.maxLocalEntries);
        }
        this.localStorage.setItem("figma-plugin-logs", JSON.stringify(stored));
      } catch (error) {
        console.warn("Failed to persist log to localStorage:", error);
      }
    }
    if (this.cloudSyncEnabled) {
      this.syncQueue.push(entry);
      this.scheduleCloudSync();
    }
  }
  loadStoredLogs() {
    if (!this.localStorage) return;
    try {
      const stored = this.localStorage.getItem("figma-plugin-logs");
      if (stored) {
        this.logBuffer = JSON.parse(stored);
      }
    } catch (error) {
      console.warn("Failed to load stored logs:", error);
    }
  }
  getStoredLogs() {
    if (!this.localStorage) return [];
    try {
      const stored = this.localStorage.getItem("figma-plugin-logs");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Failed to get stored logs:", error);
      return [];
    }
  }
  scheduleCloudSync() {
    if (this.syncQueue.length > 0) {
      setTimeout(() => this.syncToCloud(), 5e3);
    }
  }
  async syncToCloud() {
    if (!this.cloudSyncEnabled || this.syncQueue.length === 0) return;
    const logsToSync = [...this.syncQueue];
    this.syncQueue = [];
    try {
      console.info(`Would sync ${logsToSync.length} log entries to cloud`);
    } catch (error) {
      console.warn("Failed to sync logs to cloud:", error);
      this.syncQueue.unshift(...logsToSync);
    }
  }
  // Public logging methods
  debug(message, data) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
      this.persistLog(entry);
      console.debug(`[${this.config.environment}] ${message}`, data);
    }
  }
  info(message, data) {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, data);
      this.persistLog(entry);
      console.info(`[${this.config.environment}] ${message}`, data);
    }
  }
  warn(message, data) {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, data);
      this.persistLog(entry);
      console.warn(`[${this.config.environment}] ${message}`, data);
    }
  }
  error(message, error, data) {
    if (this.shouldLog(LogLevel.ERROR)) {
      let structuredError;
      if (error instanceof Error) {
        structuredError = {
          id: this.generateLogId(),
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.MEDIUM,
          message: error.message,
          stack: error.stack,
          context: __spreadValues({
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            environment: this.config.environment
          }, data),
          isRecoverable: true
        };
      } else if (error) {
        structuredError = error;
      }
      const entry = this.createLogEntry(LogLevel.ERROR, message, data, structuredError);
      this.persistLog(entry);
      console.error(`[${this.config.environment}] ${message}`, error, data);
    }
  }
  fatal(message, error, data) {
    if (this.shouldLog(LogLevel.FATAL)) {
      let structuredError;
      if (error instanceof Error) {
        structuredError = {
          id: this.generateLogId(),
          category: ErrorCategory.SYSTEM,
          severity: ErrorSeverity.CRITICAL,
          message: error.message,
          stack: error.stack,
          context: __spreadValues({
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            environment: this.config.environment
          }, data),
          isRecoverable: false
        };
      } else if (error) {
        structuredError = error;
      }
      const entry = this.createLogEntry(LogLevel.FATAL, message, data, structuredError);
      this.persistLog(entry);
      console.error(`[${this.config.environment}] FATAL: ${message}`, error, data);
    }
  }
  // Utility methods
  getLogs(filters) {
    let logs = [...this.logBuffer];
    if (filters == null ? void 0 : filters.level) {
      logs = logs.filter((log) => log.level === filters.level);
    }
    if (filters == null ? void 0 : filters.category) {
      logs = logs.filter((log) => log.category === filters.category);
    }
    if (filters == null ? void 0 : filters.since) {
      logs = logs.filter((log) => new Date(log.timestamp) >= filters.since);
    }
    if (filters == null ? void 0 : filters.limit) {
      logs = logs.slice(-filters.limit);
    }
    return logs;
  }
  clearLogs() {
    this.logBuffer = [];
    this.syncQueue = [];
    if (this.localStorage) {
      this.localStorage.removeItem("figma-plugin-logs");
    }
  }
  exportLogs() {
    return JSON.stringify(this.logBuffer, null, 2);
  }
  getLogStats() {
    const errorLogs = this.logBuffer.filter((log) => log.level === LogLevel.ERROR || log.level === LogLevel.FATAL);
    const warningLogs = this.logBuffer.filter((log) => log.level === LogLevel.WARN);
    return {
      totalLogs: this.logBuffer.length,
      errorCount: errorLogs.length,
      warningCount: warningLogs.length,
      lastError: errorLogs[errorLogs.length - 1]
    };
  }
}
const createLogger = (config) => {
  return new StructuredLogger(config);
};
const createPluginLogger = (sessionId) => {
  return createLogger({
    level: LogLevel.INFO,
    environment: "PLUGIN",
    enableLocalStorage: false,
    // Not available in plugin context
    maxLocalEntries: 500,
    enableCloudSync: false,
    // Will be enabled when network access is available
    sessionId,
    pluginVersion: "0.0.3"
    // From package.json
  });
};
class PluginErrorHandler {
  // Prevent infinite error loops
  constructor() {
    __publicField(this, "logger", createPluginLogger());
    __publicField(this, "errorCount", 0);
    __publicField(this, "maxErrors", 50);
    this.setupGlobalErrorHandling();
  }
  setupGlobalErrorHandling() {
    const originalError = console.error;
    console.error = (...args) => {
      if (this.errorCount < this.maxErrors) {
        this.handleError(args[0], { source: "console.error" });
        this.errorCount++;
      }
      originalError.apply(console, args);
    };
    if (typeof process !== "undefined" && process.on) {
      process.on("unhandledRejection", (reason) => {
        this.handleError(reason, { source: "unhandledRejection" });
      });
    }
  }
  handleError(error, context) {
    const structuredError = convertToFigmaError(error, __spreadValues({
      environment: "PLUGIN"
    }, context));
    this.logger.error("Plugin error occurred", structuredError, context);
    try {
      if (typeof figma !== "undefined" && figma.ui) {
        figma.ui.postMessage({
          type: "error",
          error: structuredError.toStructured(),
          context
        });
      }
    } catch (notificationError) {
      console.warn("Failed to send error to UI:", notificationError);
    }
    return structuredError.toStructured();
  }
  // Wrapper for Figma API calls with error handling
  async withFigmaAPI(operation, context) {
    try {
      return await withRetry(operation, {
        maxAttempts: 3,
        delay: 1e3,
        shouldRetry: (error) => {
          const message = error instanceof Error ? error.message : String(error);
          return !message.includes("Invalid") && !message.includes("not found");
        }
      });
    } catch (error) {
      const figmaError = createFigmaAPIError(
        error instanceof Error ? error.message : String(error),
        __spreadValues({ environment: "PLUGIN" }, context)
      );
      this.handleError(figmaError, context);
      throw figmaError;
    }
  }
  // Wrapper for general async operations
  async withErrorHandling(operation, context) {
    try {
      return await operation();
    } catch (error) {
      const structuredError = this.handleError(error, context);
      throw structuredError;
    }
  }
  // Safe wrapper for synchronous operations
  withSafeExecution(operation, fallback, context) {
    try {
      return operation();
    } catch (error) {
      this.handleError(error, context);
      return fallback;
    }
  }
  // Plugin-specific error handlers
  handleSelectionError(error, nodeId) {
    return this.handleError(error, {
      source: "selection",
      nodeId,
      action: "selection_change"
    });
  }
  handleTextCreationError(error, text) {
    return this.handleError(error, {
      source: "text_creation",
      text,
      action: "create_text"
    });
  }
  handleNetworkError(error, messageType) {
    return this.handleError(error, {
      source: "network",
      messageType,
      action: "message_handling"
    });
  }
  // Get error statistics
  getErrorStats() {
    const stats = this.logger.getLogStats();
    return {
      totalErrors: stats.errorCount,
      recentErrors: this.logger.getLogs({
        level: "ERROR",
        limit: 10
      }).map((log) => log.error).filter(Boolean)
    };
  }
  // Reset error count (useful for testing)
  resetErrorCount() {
    this.errorCount = 0;
  }
}
const pluginErrorHandler = new PluginErrorHandler();
const safelyExecuteAsync = async (operation, context) => {
  return pluginErrorHandler.withErrorHandling(operation, context);
};
const handlePluginBootstrap = (error) => {
  return pluginErrorHandler.handleError(error, {
    source: "bootstrap",
    action: "plugin_initialization"
  });
};
const handleMessageError = (error, messageType) => {
  return pluginErrorHandler.handleNetworkError(error, messageType);
};
const PLUGIN_CHANNEL = PLUGIN.channelBuilder().emitsTo(UI, (message) => {
  figma.ui.postMessage(message);
}).receivesFrom(UI, (next) => {
  const listener = (event) => next(event);
  figma.ui.on("message", listener);
  return () => figma.ui.off("message", listener);
}).startListening();
const startSelectionListener = () => {
  figma.on("selectionchange", () => {
    const selection = figma.currentPage.selection;
    if (selection.length > 0) {
      const selectedNode = selection[0];
      if (selectedNode.type === "TEXT") {
        console.log("Text node selected:", selectedNode.characters);
        PLUGIN_CHANNEL.emit(UI, "textClicked", [selectedNode.id, selectedNode.characters]);
      }
    }
  });
};
PLUGIN_CHANNEL.registerMessageHandler("ping", async (count) => {
  return await safelyExecuteAsync(async () => {
    console.log("Plugin received ping with count:", count, "responding with pong");
    return `pong: ${count}`;
  }, { source: "ping_handler", messageType: "ping" });
});
PLUGIN_CHANNEL.registerMessageHandler("message", async (text) => {
  return await safelyExecuteAsync(async () => {
    console.log("Plugin received message:", text);
    return `received ${text} from plugin`;
  }, { source: "message_handler", messageType: "message" });
});
PLUGIN_CHANNEL.registerMessageHandler("createText", async (text) => {
  return await safelyExecuteAsync(async () => {
    console.log("Plugin creating text:", text);
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    const textNode = figma.createText();
    textNode.characters = text;
    textNode.fontSize = 24;
    textNode.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
    figma.currentPage.appendChild(textNode);
    textNode.x = figma.viewport.center.x - textNode.width / 2;
    textNode.y = figma.viewport.center.y - textNode.height / 2;
    return `Created text: "${text}"`;
  }, {
    source: "create_text_handler",
    messageType: "createText",
    textContent: text
  });
});
PLUGIN_CHANNEL.registerMessageHandler("error", async (error, context) => {
  console.log("Received error from UI:", error, context);
  handleMessageError(error, "ui_error");
  return "Error logged";
});
async function bootstrap() {
  try {
    await safelyExecuteAsync(async () => {
      d.initialize(PLUGIN, PLUGIN_CHANNEL);
    }, { source: "networker_init" });
    await safelyExecuteAsync(async () => {
      figma.showUI(__html__, {
        width: 800,
        height: 650,
        title: "Figma Plugin"
      });
    }, { source: "ui_init" });
    console.log("Bootstrapped @", d.getCurrentSide().name);
    await safelyExecuteAsync(async () => {
      PLUGIN_CHANNEL.emit(UI, "hello", ["Plugin initialized"]);
    }, { source: "initial_message" });
    await safelyExecuteAsync(async () => {
      startSelectionListener();
    }, { source: "selection_listener" });
    PLUGIN_CHANNEL.emit(UI, "ready", []);
  } catch (error) {
    handlePluginBootstrap(error);
    try {
      figma.showUI(__html__, {
        width: 800,
        height: 650,
        title: "Figma Plugin - Error Mode"
      });
    } catch (fallbackError) {
      console.error("Critical bootstrap failure:", fallbackError);
    }
  }
}
bootstrap();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL21vbm9yZXBvLW5ldHdvcmtlci9kaXN0L21vbm9yZXBvLW5ldHdvcmtlci5qcyIsIi4uL3NyYy9jb21tb24vbmV0d29ya3MudHMiLCIuLi9zcmMvY29tbW9uL2Vycm9ycy50cyIsIi4uL3NyYy9jb21tb24vbG9nZ2VyLnRzIiwiLi4vc3JjL3BsdWdpbi9lcnJvckhhbmRsZXIudHMiLCIuLi9zcmMvcGx1Z2luL2luZGV4Lm5ldHdvcmsudHMiLCIuLi9zcmMvcGx1Z2luL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbInZhciBwID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xudmFyIHcgPSAoaSwgZSwgdCkgPT4gZSBpbiBpID8gcChpLCBlLCB7IGVudW1lcmFibGU6ICEwLCBjb25maWd1cmFibGU6ICEwLCB3cml0YWJsZTogITAsIHZhbHVlOiB0IH0pIDogaVtlXSA9IHQ7XG52YXIgdSA9IChpLCBlLCB0KSA9PiAodyhpLCB0eXBlb2YgZSAhPSBcInN5bWJvbFwiID8gZSArIFwiXCIgOiBlLCB0KSwgdCk7XG52YXIgbCA9IChpLCBlLCB0KSA9PiBuZXcgUHJvbWlzZSgociwgcykgPT4ge1xuICB2YXIgYSA9IChuKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGModC5uZXh0KG4pKTtcbiAgICB9IGNhdGNoIChTKSB7XG4gICAgICBzKFMpO1xuICAgIH1cbiAgfSwgbyA9IChuKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGModC50aHJvdyhuKSk7XG4gICAgfSBjYXRjaCAoUykge1xuICAgICAgcyhTKTtcbiAgICB9XG4gIH0sIGMgPSAobikgPT4gbi5kb25lID8gcihuLnZhbHVlKSA6IFByb21pc2UucmVzb2x2ZShuLnZhbHVlKS50aGVuKGEsIG8pO1xuICBjKCh0ID0gdC5hcHBseShpLCBlKSkubmV4dCgpKTtcbn0pO1xuY2xhc3MgeSBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoZSkge1xuICAgIHN1cGVyKGUucGF5bG9hZFswXSk7XG4gIH1cbn1cbmZ1bmN0aW9uIGgoKSB7XG4gIGNvbnN0IGkgPSBuZXcgQXJyYXkoMzYpO1xuICBmb3IgKGxldCBlID0gMDsgZSA8IDM2OyBlKyspXG4gICAgaVtlXSA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDE2KTtcbiAgcmV0dXJuIGlbMTRdID0gNCwgaVsxOV0gPSBpWzE5XSAmPSAtNSwgaVsxOV0gPSBpWzE5XSB8PSA4LCBpWzhdID0gaVsxM10gPSBpWzE4XSA9IGlbMjNdID0gXCItXCIsIGkubWFwKChlKSA9PiBlLnRvU3RyaW5nKDE2KSkuam9pbihcIlwiKTtcbn1cbmNvbnN0IGcgPSBcIl9fSU5URVJOQUxfU1VDQ0VTU19SRVNQT05TRV9FVkVOVFwiLCBFID0gXCJfX0lOVEVSTkFMX0VSUk9SX1JFU1BPTlNFX0VWRU5UXCI7XG5jbGFzcyBOIHtcbiAgY29uc3RydWN0b3IoZSkge1xuICAgIHUodGhpcywgXCJlbWl0U3RyYXRlZ2llc1wiLCAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpKTtcbiAgICB1KHRoaXMsIFwicmVjZWl2ZVN0cmF0ZWdpZXNcIiwgLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSk7XG4gICAgdGhpcy5zaWRlID0gZTtcbiAgfVxuICAvKipcbiAgICogUmVnaXN0ZXIgc3RyYXRlZ3kgZm9yIGhvdyB0aGlzIHNpZGUgcmVjZWl2ZXMgbWVzc2FnZXMgZnJvbSBnaXZlbiBvdGhlciBzaWRlLlxuICAgKlxuICAgKlxuICAgKiBAcGFyYW0gc2lkZSBUaGUgbmV0d29yayBzaWRlIGZyb20gd2hpY2ggbWVzc2FnZXMgd2lsbCBiZSByZWNlaXZlZC5cbiAgICogQHBhcmFtIHN0cmF0ZWd5IFRoZSBzdHJhdGVneSBmb3IgaGFuZGxpbmcgaW5jb21pbmcgbWVzc2FnZXMgZnJvbSB0aGUgc3BlY2lmaWVkIHNpZGUuXG4gICAqIEByZXR1cm5zIFRoaXMgY2hhbm5lbCwgc28geW91IGNhbiBjaGFpbiBtb3JlIHRoaW5ncyBhcyBuZWVkZWRcbiAgICovXG4gIHJlY2VpdmVzRnJvbShlLCB0KSB7XG4gICAgcmV0dXJuIHRoaXMucmVjZWl2ZVN0cmF0ZWdpZXMuc2V0KGUubmFtZSwgdCksIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHN0cmF0ZWd5IG9uIGhvdyB0aGlzIHNpZGUgZW1pdHMgbWVzc2FnZSB0byBnaXZlbiBvdGhlciBzaWRlLlxuICAgKlxuICAgKiBAcGFyYW0gdG8gVGhlIHRhcmdldCBuZXR3b3JrIHNpZGUgdG8gd2hpY2ggbWVzc2FnZXMgd2lsbCBiZSBlbWl0dGVkLlxuICAgKiBAcGFyYW0gc3RyYXRlZ3kgU3RyYXRlZ3kgZm9yIGVtaXR0aW5nIGEgbWVzc2FnZS5cbiAgICogQHJldHVybnMgVGhpcyBjaGFubmVsLCBzbyB5b3UgY2FuIGNoYWluIG1vcmUgdGhpbmdzIGFzIG5lZWRlZFxuICAgKi9cbiAgZW1pdHNUbyhlLCB0KSB7XG4gICAgcmV0dXJuIHRoaXMuZW1pdFN0cmF0ZWdpZXMuc2V0KGUubmFtZSwgdCksIHRoaXM7XG4gIH1cbiAgLyoqXG4gICAqIEZpbmFsaXplcyBhbmQgYnVpbGRzIHRoZSBDaGFubmVsLlxuICAgKiBBbmQgc3RhcnRzIGxpc3RlbmluZyB3aXRoIHJlZ2lzdGVyZWQgcmVjZWl2aW5nIHN0cmF0ZWdpZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBjaGFubmVsXG4gICAqL1xuICBzdGFydExpc3RlbmluZygpIHtcbiAgICByZXR1cm4gbmV3IFIoXG4gICAgICB0aGlzLnNpZGUsXG4gICAgICB0aGlzLmVtaXRTdHJhdGVnaWVzLFxuICAgICAgdGhpcy5yZWNlaXZlU3RyYXRlZ2llc1xuICAgICk7XG4gIH1cbn1cbmNsYXNzIFIge1xuICBjb25zdHJ1Y3RvcihlLCB0ID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKSwgciA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpIHtcbiAgICB1KHRoaXMsIFwibWVzc2FnZUhhbmRsZXJzXCIsIHt9KTtcbiAgICB1KHRoaXMsIFwic3Vic2NyaXB0aW9uTGlzdGVuZXJzXCIsIHt9KTtcbiAgICB1KHRoaXMsIFwicGVuZGluZ1JlcXVlc3RzXCIsIC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCkpO1xuICAgIHUodGhpcywgXCJjbGVhbnVwQ2FsbGJhY2tzXCIsIFtdKTtcbiAgICB0aGlzLnNpZGUgPSBlLCB0aGlzLmVtaXRTdHJhdGVnaWVzID0gdCwgdGhpcy5yZWNlaXZlU3RyYXRlZ2llcyA9IHIsIHIuZm9yRWFjaCgocykgPT4ge1xuICAgICAgY29uc3QgbyA9IHMoKGMsIG4pID0+IHRoaXMucmVjZWl2ZU5ldHdvcmtNZXNzYWdlKGMsIG4pKTtcbiAgICAgIG8gJiYgdGhpcy5jbGVhbnVwQ2FsbGJhY2tzLnB1c2gobyk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgaGFuZGxlciBmb3IgYW4gaW5jb21pbmcgbWVzc2FnZS5cbiAgICogVGhlIGhhbmRsZXIgaXMgcmVzcG9uc2libGUgb2YgbGlzdGVuaW5nIHRvIGluY29taW5nIGV2ZW50cywgYW5kIHBvc3NpYmx5IHJlc3BvbmRpbmcvcmV0dXJuaW5nIGEgdmFsdWUgdG8gdGhlbS5cbiAgICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudCB0byBiZSBsaXN0ZW5lZFxuICAgKiBAcGFyYW0gaGFuZGxlciBIYW5kbGVyIHRoYXQgYWNjZXB0cyBpbmNvbWluZyBtZXNzYWdlIGFuZCBzZW5kZXIsIHRoZW4gY29uc3VtZXMgdGhlbS5cbiAgICovXG4gIHJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoZSwgdCkge1xuICAgIHRoaXMubWVzc2FnZUhhbmRsZXJzW2VdID0gdDtcbiAgfVxuICBnZXRFbWl0U3RyYXRlZ3koZSkge1xuICAgIGNvbnN0IHQgPSB0aGlzLmVtaXRTdHJhdGVnaWVzLmdldChlLm5hbWUpO1xuICAgIGlmICghdCkge1xuICAgICAgY29uc3QgciA9IGQuZ2V0Q3VycmVudFNpZGUoKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgYE5vIGVtaXQgc3RyYXRlZ3kgaXMgcmVnaXN0ZXJlZCBmcm9tICR7ci5uYW1lfSB0byAke2UubmFtZX1gXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbiAgfVxuICByZWNlaXZlTmV0d29ya01lc3NhZ2UoZSwgdCkge1xuICAgIHJldHVybiBsKHRoaXMsIG51bGwsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICBpZiAoZS5ldmVudE5hbWUgPT09IGcpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlU3VjY2Vzc1Jlc3BvbnNlKGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoZS5ldmVudE5hbWUgPT09IEUpIHtcbiAgICAgICAgdGhpcy5yZWNlaXZlRXJyb3JSZXNwb25zZShlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdGhpcy5pbnZva2VTdWJzY3JpYmVycyhlKSwgdGhpcy5oYW5kbGVJbmNvbWluZ01lc3NhZ2UoZSwgdCk7XG4gICAgfSk7XG4gIH1cbiAgcmVjZWl2ZVN1Y2Nlc3NSZXNwb25zZShlKSB7XG4gICAgcmV0dXJuIGwodGhpcywgbnVsbCwgZnVuY3Rpb24qICgpIHtcbiAgICAgIHZhciByO1xuICAgICAgY29uc3QgeyByZXNvbHZlOiB0IH0gPSAociA9IHRoaXMucGVuZGluZ1JlcXVlc3RzLmdldChlLm1lc3NhZ2VJZCkpICE9IG51bGwgPyByIDoge307XG4gICAgICB0ICYmICh0aGlzLnBlbmRpbmdSZXF1ZXN0cy5kZWxldGUoZS5tZXNzYWdlSWQpLCB0KGUucGF5bG9hZFswXSkpO1xuICAgIH0pO1xuICB9XG4gIHJlY2VpdmVFcnJvclJlc3BvbnNlKGUpIHtcbiAgICByZXR1cm4gbCh0aGlzLCBudWxsLCBmdW5jdGlvbiogKCkge1xuICAgICAgdmFyIHI7XG4gICAgICBjb25zdCB7IHJlamVjdDogdCB9ID0gKHIgPSB0aGlzLnBlbmRpbmdSZXF1ZXN0cy5nZXQoZS5tZXNzYWdlSWQpKSAhPSBudWxsID8gciA6IHt9O1xuICAgICAgdCAmJiAodGhpcy5wZW5kaW5nUmVxdWVzdHMuZGVsZXRlKGUubWVzc2FnZUlkKSwgdChuZXcgeShlKSkpO1xuICAgIH0pO1xuICB9XG4gIGludm9rZVN1YnNjcmliZXJzKGUpIHtcbiAgICByZXR1cm4gbCh0aGlzLCBudWxsLCBmdW5jdGlvbiogKCkge1xuICAgICAgdmFyIHQ7XG4gICAgICBPYmplY3QudmFsdWVzKCh0ID0gdGhpcy5zdWJzY3JpcHRpb25MaXN0ZW5lcnNbZS5ldmVudE5hbWVdKSAhPSBudWxsID8gdCA6IHt9KS5mb3JFYWNoKFxuICAgICAgICAocikgPT4ge1xuICAgICAgICAgIHIoXG4gICAgICAgICAgICAuLi5lLnBheWxvYWQsXG4gICAgICAgICAgICBkLmdldFNpZGUoZS5mcm9tU2lkZSksXG4gICAgICAgICAgICBlXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICBoYW5kbGVJbmNvbWluZ01lc3NhZ2UoZSwgdCkge1xuICAgIHJldHVybiBsKHRoaXMsIG51bGwsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICBjb25zdCByID0gdGhpcy5tZXNzYWdlSGFuZGxlcnNbZS5ldmVudE5hbWVdO1xuICAgICAgaWYgKHIgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBzID0gZC5nZXRTaWRlKGUuZnJvbVNpZGUpO1xuICAgICAgICBpZiAoIXMpXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgYE1lc3NhZ2UgcmVjZWl2ZWQgZnJvbSBhbiB1bmtub3duIHNpZGU6ICR7ZS5mcm9tU2lkZX1gXG4gICAgICAgICAgKTtcbiAgICAgICAgY29uc3QgYSA9IHRoaXMuZ2V0RW1pdFN0cmF0ZWd5KHMpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IG8gPSB5aWVsZCByKFxuICAgICAgICAgICAgLi4uZS5wYXlsb2FkLFxuICAgICAgICAgICAgZC5nZXRTaWRlKGUuZnJvbVNpZGUpLFxuICAgICAgICAgICAgZVxuICAgICAgICAgICk7XG4gICAgICAgICAgYSAhPSBudWxsICYmIGEoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VJZDogZS5tZXNzYWdlSWQsXG4gICAgICAgICAgICAgIGZyb21TaWRlOiBlLmZyb21TaWRlLFxuICAgICAgICAgICAgICBldmVudE5hbWU6IGcsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IFtvXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRcbiAgICAgICAgICApO1xuICAgICAgICB9IGNhdGNoIChvKSB7XG4gICAgICAgICAgYSAhPSBudWxsICYmIGEoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG1lc3NhZ2VJZDogZS5tZXNzYWdlSWQsXG4gICAgICAgICAgICAgIGZyb21TaWRlOiBlLmZyb21TaWRlLFxuICAgICAgICAgICAgICBldmVudE5hbWU6IEUsXG4gICAgICAgICAgICAgIHBheWxvYWQ6IFtcbiAgICAgICAgICAgICAgICBvIGluc3RhbmNlb2YgRXJyb3IgPyBvLm1lc3NhZ2UgOiBcIkZhaWxlZCB0byBoYW5kbGVcIlxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogRW1pdHMgYW4gZXZlbnQgdG8gYSB0YXJnZXQgc2lkZSBvZiB0aGUgbmV0d29yayB3aXRoIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZSBhbmQgYXJndW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gdGFyZ2V0U2lkZSAtIFRoZSBzaWRlIG9mIHRoZSBuZXR3b3JrIHRvIHdoaWNoIHRoZSBldmVudCB3aWxsIGJlIGVtaXR0ZWQuXG4gICAqIEBwYXJhbSBldmVudE5hbWUgLSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgdG8gZW1pdC5cbiAgICogQHBhcmFtIGVtaXRBcmdzIC0gVGhlIGFyZ3VtZW50cyBmb3IgdGhlIGV2ZW50IGhhbmRsZXIgY29ycmVzcG9uZGluZyB0byB0aGUgYGV2ZW50TmFtZWAuXG4gICAqIEBwYXJhbSBlbWl0TWV0YWRhdGEgLSBUaGUgbWV0YWRhdGEgZm9yIHRoZSBldmVudCBlbWl0dGVyIHRvIHVzZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogIC8vIC4vY29tbW9uL3NpZGVzLnRzXG4gICAqICBjb25zdCBPVEhFUl9TSURFID0gTmV0d29ya2VyLmNyZWF0ZVNpZGUoXCJPdGhlci1zaWRlXCIpLmxpc3RlbnM8XG4gICAqICAgIGhlbGxvKGFyZzE6IHN0cmluZyk6IHZvaWQ7XG4gICAqICA+KCk7XG4gICAqXG4gICAqICBNWV9DSEFOTkVMLmVtaXQoT1RIRVJfU0lERSwgXCJoZWxsb1wiLCBbXCJ3b3JsZFwiXSk7XG4gICAqL1xuICBlbWl0KGUsIHQsIHIsIC4uLltzXSkge1xuICAgIHRoaXMuZ2V0RW1pdFN0cmF0ZWd5KGUpKFxuICAgICAge1xuICAgICAgICBtZXNzYWdlSWQ6IGgoKSxcbiAgICAgICAgZnJvbVNpZGU6IGQuZ2V0Q3VycmVudFNpZGUoKS5uYW1lLFxuICAgICAgICBldmVudE5hbWU6IHQudG9TdHJpbmcoKSxcbiAgICAgICAgcGF5bG9hZDogclxuICAgICAgfSxcbiAgICAgIHNcbiAgICApO1xuICB9XG4gIC8qKlxuICAgKiBTZW5kcyBhIHJlcXVlc3QgdG8gYSB0YXJnZXQgc2lkZSBvZiB0aGUgbmV0d29yayB3aXRoIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZSBhbmQgYXJndW1lbnRzLlxuICAgKiBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdpdGggdGhlIHJlc3BvbnNlIGZyb20gdGhlIHRhcmdldCBzaWRlLlxuICAgKlxuICAgKiBAcGFyYW0gdGFyZ2V0U2lkZSAtIFRoZSBzaWRlIG9mIHRoZSBuZXR3b3JrIHRvIHdoaWNoIHRoZSByZXF1ZXN0IHdpbGwgYmUgc2VudC5cbiAgICogQHBhcmFtIGV2ZW50TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudCB0byByZXF1ZXN0LlxuICAgKiBAcGFyYW0gZXZlbnRBcmdzIC0gVGhlIGFyZ3VtZW50cyBmb3IgdGhlIGV2ZW50IGhhbmRsZXIgY29ycmVzcG9uZGluZyB0byB0aGUgYGV2ZW50TmFtZWAuXG4gICAqIEBwYXJhbSBlbWl0TWV0YWRhdGEgLSBUaGUgbWV0YWRhdGEgZm9yIHRoZSBldmVudCBlbWl0dGVyIHRvIHVzZS5cbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgcmV0dXJuIHZhbHVlIG9mIHRoZSBldmVudCBoYW5kbGVyIG9uIHRoZSB0YXJnZXQgc2lkZS5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogIC8vIC4vY29tbW9uL3NpZGVzLnRzXG4gICAqICBjb25zdCBPVEhFUl9TSURFID0gTmV0d29ya2VyLmNyZWF0ZVNpZGUoXCJPdGhlci1zaWRlXCIpLmxpc3RlbnM8XG4gICAqICAgIGhlbGxvKGFyZzE6IHN0cmluZyk6IHZvaWQ7XG4gICAqICAgIHVwZGF0ZUl0ZW0oaXRlbUlkOiBzdHJpbmcsIG5hbWU6IHN0cmluZyk6IGJvb2xlYW47XG4gICAqICA+KCk7XG4gICAqXG4gICAqICBNWV9DSEFOTkVMLnJlcXVlc3QoT1RIRVJfU0lERSwgXCJoZWxsb1wiLCBbXCJ3b3JsZFwiXSkudGhlbigoKSA9PiB7XG4gICAqICAgIGNvbnNvbGUubG9nKFwiT3RoZXIgc2lkZSByZWNlaXZlZCBteSByZXF1ZXN0XCIpO1xuICAgKiAgfSk7XG4gICAqICBNWV9DSEFOTkVMLnJlcXVlc3QoT1RIRVJfU0lERSwgXCJ1cGRhdGVJdGVtXCIsIFtcIml0ZW0tMVwiLCBcIk15IEl0ZW1cIl0pLnRoZW4oKHN1Y2Nlc3MpID0+IHtcbiAgICogICAgY29uc29sZS5sb2coXCJVcGRhdGUgc3VjY2VzczpcIiwgc3VjY2Vzcyk7XG4gICAqICB9KTtcbiAgICovXG4gIHJlcXVlc3QoYSwgbywgYykge1xuICAgIHJldHVybiBsKHRoaXMsIGFyZ3VtZW50cywgZnVuY3Rpb24qIChlLCB0LCByLCAuLi5bc10pIHtcbiAgICAgIGNvbnN0IG4gPSB0aGlzLmdldEVtaXRTdHJhdGVneShlKSwgUyA9IGgoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgobSwgZikgPT4ge1xuICAgICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0cy5zZXQoUywgeyByZXNvbHZlOiBtLCByZWplY3Q6IGYgfSksIG4oXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZUlkOiBTLFxuICAgICAgICAgICAgZnJvbVNpZGU6IGQuZ2V0Q3VycmVudFNpZGUoKS5uYW1lLFxuICAgICAgICAgICAgZXZlbnROYW1lOiB0LnRvU3RyaW5nKCksXG4gICAgICAgICAgICBwYXlsb2FkOiByXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICAvKipcbiAgICogU3Vic2NyaWJlcyB0byBhbiBldmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgZXZlbnQgbmFtZSBhbmQgbGlzdGVuZXIuXG4gICAqIFJldHVybnMgYW4gdW5zdWJzY3JpYmUgZnVuY3Rpb24gdG8gcmVtb3ZlIHRoZSBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIGV2ZW50TmFtZSAtIFRoZSBuYW1lIG9mIHRoZSBldmVudCB0byBzdWJzY3JpYmUgdG8uXG4gICAqIEBwYXJhbSBldmVudExpc3RlbmVyIC0gVGhlIGxpc3RlbmVyIGZ1bmN0aW9uIHRvIGhhbmRsZSB0aGUgZXZlbnQgd2hlbiBpdCBpcyB0cmlnZ2VyZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZnVuY3Rpb24gdG8gdW5zdWJzY3JpYmUgdGhlIGxpc3RlbmVyIGZyb20gdGhlIGV2ZW50LlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiAgLy8gLi9jb21tb24vc2lkZXMudHNcbiAgICogIGNvbnN0IE1ZX1NJREUgPSBOZXR3b3JrZXIuY3JlYXRlU2lkZShcIk90aGVyLXNpZGVcIikubGlzdGVuczxcbiAgICogICAgcHJpbnQodGV4dDogc3RyaW5nKTogdm9pZDtcbiAgICogID4oKTtcbiAgICpcbiAgICogLy8gLi9teS1zaWRlL25ldHdvcmsudHNcbiAgICogIGNvbnN0IE1ZX0NIQU5ORUwgPSBNWV9TSURFLmNoYW5uZWxCdWlsZGVyKCkuYmVnaW5MaXN0ZW5pbmcoKTtcbiAgICpcbiAgICogIGNvbnN0IHVuc3Vic2NyaWJlID0gTVlfQ0hBTk5FTC5zdWJzY3JpYmUoXCJwcmludFwiLCB0ZXh0ID0+IHtcbiAgICogICAgY29uc29sZS5sb2codGV4dCk7XG4gICAqICB9KTtcbiAgICogIHNldFRpbWVvdXQoKCkgPT4gdW5zdWJzY3JpYmUoKSwgNTAwMCk7XG4gICAqL1xuICBzdWJzY3JpYmUoZSwgdCkge1xuICAgIHZhciBhLCBvO1xuICAgIGNvbnN0IHIgPSBoKCksIHMgPSAobyA9IChhID0gdGhpcy5zdWJzY3JpcHRpb25MaXN0ZW5lcnMpW2VdKSAhPSBudWxsID8gbyA6IGFbZV0gPSB7fTtcbiAgICByZXR1cm4gc1tyXSA9IHQsICgpID0+IHtcbiAgICAgIGRlbGV0ZSB0aGlzLnN1YnNjcmlwdGlvbkxpc3RlbmVyc1tlXVtyXTtcbiAgICB9O1xuICB9XG59XG5jbGFzcyB2IHtcbiAgY29uc3RydWN0b3IoZSkge1xuICAgIHRoaXMubmFtZSA9IGU7XG4gIH1cbiAgY2hhbm5lbEJ1aWxkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBOKHRoaXMpO1xuICB9XG59XG52YXIgZDtcbigoaSkgPT4ge1xuICBjb25zdCBlID0gW107XG4gIGxldCB0O1xuICBmdW5jdGlvbiByKCkge1xuICAgIGlmICh0ID09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb2dpY2FsIHNpZGUgaXMgbm90IGluaXRpYWxpemVkIHlldC5cIik7XG4gICAgcmV0dXJuIHQ7XG4gIH1cbiAgaS5nZXRDdXJyZW50U2lkZSA9IHI7XG4gIGZ1bmN0aW9uIHMoYywgbikge1xuICAgIGlmICh0ICE9IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJMb2dpY2FsIHNpZGUgY2FuIGJlIGRlY2xhcmVkIG9ubHkgb25jZS5cIik7XG4gICAgaWYgKG4uc2lkZSAhPT0gYylcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkdpdmVuIHNpZGUgYW5kIGNoYW5uZWwgc2lkZSBkb2Vzbid0IG1hdGNoXCIpO1xuICAgIHQgPSBjO1xuICB9XG4gIGkuaW5pdGlhbGl6ZSA9IHM7XG4gIGZ1bmN0aW9uIGEoYykge1xuICAgIHJldHVybiB7XG4gICAgICBsaXN0ZW5zOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG4gPSBuZXcgdihjKTtcbiAgICAgICAgcmV0dXJuIGUucHVzaChuKSwgbjtcbiAgICAgIH1cbiAgICB9O1xuICB9XG4gIGkuY3JlYXRlU2lkZSA9IGE7XG4gIGZ1bmN0aW9uIG8oYykge1xuICAgIGZvciAobGV0IG4gb2YgZSlcbiAgICAgIGlmIChuLm5hbWUgPT09IGMpXG4gICAgICAgIHJldHVybiBuO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGkuZ2V0U2lkZSA9IG87XG59KShkIHx8IChkID0ge30pKTtcbmV4cG9ydCB7XG4gIHkgYXMgTmV0d29ya0Vycm9yLFxuICBkIGFzIE5ldHdvcmtlclxufTtcbiIsImltcG9ydCB7IE5ldHdvcmtlciB9IGZyb20gJ21vbm9yZXBvLW5ldHdvcmtlcidcblxuZXhwb3J0IGNvbnN0IFVJID0gTmV0d29ya2VyLmNyZWF0ZVNpZGUoJ1VJLXNpZGUnKS5saXN0ZW5zPHtcbiAgcGluZygpOiAncG9uZydcbiAgcG9uZygpOiAncGluZydcbiAgaGVsbG8odGV4dDogc3RyaW5nKTogdm9pZFxuICByZWFkeSgpOiB2b2lkXG4gIHRleHRDbGlja2VkKG5vZGVJZDogc3RyaW5nLCB0ZXh0OiBzdHJpbmcpOiB2b2lkXG4gIGVycm9yKGVycm9yOiB1bmtub3duLCBjb250ZXh0PzogdW5rbm93bik6IHZvaWRcbn0+KClcblxuZXhwb3J0IGNvbnN0IFBMVUdJTiA9IE5ldHdvcmtlci5jcmVhdGVTaWRlKCdQbHVnaW4tc2lkZScpLmxpc3RlbnM8e1xuICBwaW5nKGNvdW50OiBudW1iZXIpOiBzdHJpbmdcbiAgcG9uZygpOiAncGluZydcbiAgaGVsbG8odGV4dDogc3RyaW5nKTogdm9pZFxuICBoZWxsb0FjaygpOiB2b2lkXG4gIG1lc3NhZ2UodGV4dDogc3RyaW5nKTogc3RyaW5nXG4gIGNyZWF0ZVJlY3Qod2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpOiB2b2lkXG4gIGNyZWF0ZVRleHQodGV4dDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+XG4gIGV4cG9ydFNlbGVjdGlvbigpOiBQcm9taXNlPHN0cmluZz5cbiAgZXJyb3IoZXJyb3I6IHVua25vd24sIGNvbnRleHQ/OiB1bmtub3duKTogUHJvbWlzZTxzdHJpbmc+XG59PigpXG4iLCIvLyBFcnJvciBUeXBlcyBhbmQgVXRpbGl0aWVzIGZvciBGaWdtYSBQbHVnaW5cbi8vIFN1cHBvcnRzIGJvdGggVUkgYW5kIFBsdWdpbiBwcm9jZXNzZXMgd2l0aCBzdHJ1Y3R1cmVkIGVycm9yIGhhbmRsaW5nXG5cbmV4cG9ydCBjb25zdCBFcnJvckNhdGVnb3J5ID0ge1xuICBORVRXT1JLOiAnTkVUV09SSycsXG4gIFVJOiAnVUknLFxuICBQTFVHSU46ICdQTFVHSU4nLFxuICBGSUdNQV9BUEk6ICdGSUdNQV9BUEknLFxuICBWQUxJREFUSU9OOiAnVkFMSURBVElPTicsXG4gIFNZU1RFTTogJ1NZU1RFTSdcbn0gYXMgY29uc3RcblxuZXhwb3J0IHR5cGUgRXJyb3JDYXRlZ29yeSA9IHR5cGVvZiBFcnJvckNhdGVnb3J5W2tleW9mIHR5cGVvZiBFcnJvckNhdGVnb3J5XVxuXG5leHBvcnQgY29uc3QgRXJyb3JTZXZlcml0eSA9IHtcbiAgTE9XOiAnTE9XJyxcbiAgTUVESVVNOiAnTUVESVVNJyxcbiAgSElHSDogJ0hJR0gnLFxuICBDUklUSUNBTDogJ0NSSVRJQ0FMJ1xufSBhcyBjb25zdFxuXG5leHBvcnQgdHlwZSBFcnJvclNldmVyaXR5ID0gdHlwZW9mIEVycm9yU2V2ZXJpdHlba2V5b2YgdHlwZW9mIEVycm9yU2V2ZXJpdHldXG5cbmV4cG9ydCBpbnRlcmZhY2UgRXJyb3JDb250ZXh0IHtcbiAgdXNlcklkPzogc3RyaW5nXG4gIHNlc3Npb25JZD86IHN0cmluZ1xuICB0aW1lc3RhbXA6IHN0cmluZ1xuICB1c2VyQWdlbnQ/OiBzdHJpbmdcbiAgZmlnbWFWZXJzaW9uPzogc3RyaW5nXG4gIHBsdWdpblZlcnNpb24/OiBzdHJpbmdcbiAgZW52aXJvbm1lbnQ6ICdVSScgfCAnUExVR0lOJ1xuICBhY3Rpb24/OiBzdHJpbmdcbiAgY29tcG9uZW50U3RhY2s/OiBzdHJpbmdcbiAgZXJyb3JCb3VuZGFyeT86IHN0cmluZ1xuICBhZGRpdGlvbmFsRGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RydWN0dXJlZEVycm9yIHtcbiAgaWQ6IHN0cmluZ1xuICBjYXRlZ29yeTogRXJyb3JDYXRlZ29yeVxuICBzZXZlcml0eTogRXJyb3JTZXZlcml0eVxuICBtZXNzYWdlOiBzdHJpbmdcbiAgc3RhY2s/OiBzdHJpbmdcbiAgY29udGV4dDogRXJyb3JDb250ZXh0XG4gIG9yaWdpbmFsRXJyb3I/OiBFcnJvclxuICBpc1JlY292ZXJhYmxlOiBib29sZWFuXG4gIHJlY292ZXJ5QWN0aW9ucz86IHN0cmluZ1tdXG4gIHVzZXJGcmllbmRseU1lc3NhZ2U/OiBzdHJpbmdcbn1cblxuZXhwb3J0IGNsYXNzIEZpZ21hUGx1Z2luRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nXG4gIHB1YmxpYyByZWFkb25seSBjYXRlZ29yeTogRXJyb3JDYXRlZ29yeVxuICBwdWJsaWMgcmVhZG9ubHkgc2V2ZXJpdHk6IEVycm9yU2V2ZXJpdHlcbiAgcHVibGljIHJlYWRvbmx5IGNvbnRleHQ6IEVycm9yQ29udGV4dFxuICBwdWJsaWMgcmVhZG9ubHkgaXNSZWNvdmVyYWJsZTogYm9vbGVhblxuICBwdWJsaWMgcmVhZG9ubHkgcmVjb3ZlcnlBY3Rpb25zPzogc3RyaW5nW11cbiAgcHVibGljIHJlYWRvbmx5IHVzZXJGcmllbmRseU1lc3NhZ2U/OiBzdHJpbmdcblxuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgb3B0aW9uczoge1xuICAgICAgY2F0ZWdvcnk6IEVycm9yQ2F0ZWdvcnlcbiAgICAgIHNldmVyaXR5OiBFcnJvclNldmVyaXR5XG4gICAgICBjb250ZXh0OiBQYXJ0aWFsPEVycm9yQ29udGV4dD5cbiAgICAgIGNhdXNlPzogRXJyb3JcbiAgICAgIGlzUmVjb3ZlcmFibGU/OiBib29sZWFuXG4gICAgICByZWNvdmVyeUFjdGlvbnM/OiBzdHJpbmdbXVxuICAgICAgdXNlckZyaWVuZGx5TWVzc2FnZT86IHN0cmluZ1xuICAgIH1cbiAgKSB7XG4gICAgc3VwZXIobWVzc2FnZSlcbiAgICB0aGlzLm5hbWUgPSAnRmlnbWFQbHVnaW5FcnJvcidcbiAgICB0aGlzLmlkID0gZ2VuZXJhdGVFcnJvcklkKClcbiAgICB0aGlzLmNhdGVnb3J5ID0gb3B0aW9ucy5jYXRlZ29yeVxuICAgIHRoaXMuc2V2ZXJpdHkgPSBvcHRpb25zLnNldmVyaXR5XG4gICAgdGhpcy5pc1JlY292ZXJhYmxlID0gb3B0aW9ucy5pc1JlY292ZXJhYmxlID8/IHRydWVcbiAgICB0aGlzLnJlY292ZXJ5QWN0aW9ucyA9IG9wdGlvbnMucmVjb3ZlcnlBY3Rpb25zXG4gICAgdGhpcy51c2VyRnJpZW5kbHlNZXNzYWdlID0gb3B0aW9ucy51c2VyRnJpZW5kbHlNZXNzYWdlXG4gICAgdGhpcy5jb250ZXh0ID0ge1xuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBlbnZpcm9ubWVudDogJ1VJJywgLy8gRGVmYXVsdCwgd2lsbCBiZSBvdmVycmlkZGVuXG4gICAgICAuLi5vcHRpb25zLmNvbnRleHRcbiAgICB9XG5cbiAgICBpZiAob3B0aW9ucy5jYXVzZSkge1xuICAgICAgdGhpcy5jYXVzZSA9IG9wdGlvbnMuY2F1c2VcbiAgICAgIHRoaXMuc3RhY2sgPSBvcHRpb25zLmNhdXNlLnN0YWNrXG4gICAgfVxuICB9XG5cbiAgdG9TdHJ1Y3R1cmVkKCk6IFN0cnVjdHVyZWRFcnJvciB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgY2F0ZWdvcnk6IHRoaXMuY2F0ZWdvcnksXG4gICAgICBzZXZlcml0eTogdGhpcy5zZXZlcml0eSxcbiAgICAgIG1lc3NhZ2U6IHRoaXMubWVzc2FnZSxcbiAgICAgIHN0YWNrOiB0aGlzLnN0YWNrLFxuICAgICAgY29udGV4dDogdGhpcy5jb250ZXh0LFxuICAgICAgb3JpZ2luYWxFcnJvcjogdGhpcy5jYXVzZSBhcyBFcnJvcixcbiAgICAgIGlzUmVjb3ZlcmFibGU6IHRoaXMuaXNSZWNvdmVyYWJsZSxcbiAgICAgIHJlY292ZXJ5QWN0aW9uczogdGhpcy5yZWNvdmVyeUFjdGlvbnMsXG4gICAgICB1c2VyRnJpZW5kbHlNZXNzYWdlOiB0aGlzLnVzZXJGcmllbmRseU1lc3NhZ2VcbiAgICB9XG4gIH1cbn1cblxuLy8gRXJyb3IgRmFjdG9yeSBGdW5jdGlvbnNcbmV4cG9ydCBjb25zdCBjcmVhdGVOZXR3b3JrRXJyb3IgPSAobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUGFydGlhbDxFcnJvckNvbnRleHQ+KSA9PlxuICBuZXcgRmlnbWFQbHVnaW5FcnJvcihtZXNzYWdlLCB7XG4gICAgY2F0ZWdvcnk6IEVycm9yQ2F0ZWdvcnkuTkVUV09SSyxcbiAgICBzZXZlcml0eTogRXJyb3JTZXZlcml0eS5NRURJVU0sXG4gICAgY29udGV4dDogY29udGV4dCB8fCB7fSxcbiAgICBpc1JlY292ZXJhYmxlOiB0cnVlLFxuICAgIHJlY292ZXJ5QWN0aW9uczogWydDaGVjayB5b3VyIGludGVybmV0IGNvbm5lY3Rpb24nLCAnUmV0cnkgdGhlIG9wZXJhdGlvbiddLFxuICAgIHVzZXJGcmllbmRseU1lc3NhZ2U6ICdOZXR3b3JrIGNvbm5lY3Rpb24gaXNzdWUuIFBsZWFzZSBjaGVjayB5b3VyIGNvbm5lY3Rpb24gYW5kIHRyeSBhZ2Fpbi4nXG4gIH0pXG5cbmV4cG9ydCBjb25zdCBjcmVhdGVGaWdtYUFQSUVycm9yID0gKG1lc3NhZ2U6IHN0cmluZywgY29udGV4dD86IFBhcnRpYWw8RXJyb3JDb250ZXh0PikgPT5cbiAgbmV3IEZpZ21hUGx1Z2luRXJyb3IobWVzc2FnZSwge1xuICAgIGNhdGVnb3J5OiBFcnJvckNhdGVnb3J5LkZJR01BX0FQSSxcbiAgICBzZXZlcml0eTogRXJyb3JTZXZlcml0eS5ISUdILFxuICAgIGNvbnRleHQ6IGNvbnRleHQgfHwge30sXG4gICAgaXNSZWNvdmVyYWJsZTogdHJ1ZSxcbiAgICByZWNvdmVyeUFjdGlvbnM6IFsnUmVmcmVzaCB0aGUgcGx1Z2luJywgJ0NoZWNrIEZpZ21hIHBlcm1pc3Npb25zJ10sXG4gICAgdXNlckZyaWVuZGx5TWVzc2FnZTogJ0ZpZ21hIEFQSSBpc3N1ZS4gUGxlYXNlIHJlZnJlc2ggdGhlIHBsdWdpbiBhbmQgdHJ5IGFnYWluLidcbiAgfSlcblxuZXhwb3J0IGNvbnN0IGNyZWF0ZVZhbGlkYXRpb25FcnJvciA9IChtZXNzYWdlOiBzdHJpbmcsIGNvbnRleHQ/OiBQYXJ0aWFsPEVycm9yQ29udGV4dD4pID0+XG4gIG5ldyBGaWdtYVBsdWdpbkVycm9yKG1lc3NhZ2UsIHtcbiAgICBjYXRlZ29yeTogRXJyb3JDYXRlZ29yeS5WQUxJREFUSU9OLFxuICAgIHNldmVyaXR5OiBFcnJvclNldmVyaXR5LkxPVyxcbiAgICBjb250ZXh0OiBjb250ZXh0IHx8IHt9LFxuICAgIGlzUmVjb3ZlcmFibGU6IHRydWUsXG4gICAgcmVjb3ZlcnlBY3Rpb25zOiBbJ0NoZWNrIHlvdXIgaW5wdXQnLCAnQ29ycmVjdCB0aGUgaGlnaGxpZ2h0ZWQgZmllbGRzJ10sXG4gICAgdXNlckZyaWVuZGx5TWVzc2FnZTogJ1BsZWFzZSBjaGVjayB5b3VyIGlucHV0IGFuZCB0cnkgYWdhaW4uJ1xuICB9KVxuXG5leHBvcnQgY29uc3QgY3JlYXRlU3lzdGVtRXJyb3IgPSAobWVzc2FnZTogc3RyaW5nLCBjb250ZXh0PzogUGFydGlhbDxFcnJvckNvbnRleHQ+KSA9PlxuICBuZXcgRmlnbWFQbHVnaW5FcnJvcihtZXNzYWdlLCB7XG4gICAgY2F0ZWdvcnk6IEVycm9yQ2F0ZWdvcnkuU1lTVEVNLFxuICAgIHNldmVyaXR5OiBFcnJvclNldmVyaXR5LkNSSVRJQ0FMLFxuICAgIGNvbnRleHQ6IGNvbnRleHQgfHwge30sXG4gICAgaXNSZWNvdmVyYWJsZTogZmFsc2UsXG4gICAgcmVjb3ZlcnlBY3Rpb25zOiBbJ1Jlc3RhcnQgdGhlIHBsdWdpbicsICdDb250YWN0IHN1cHBvcnQnXSxcbiAgICB1c2VyRnJpZW5kbHlNZXNzYWdlOiAnQSBzeXN0ZW0gZXJyb3Igb2NjdXJyZWQuIFBsZWFzZSByZXN0YXJ0IHRoZSBwbHVnaW4gb3IgY29udGFjdCBzdXBwb3J0LidcbiAgfSlcblxuLy8gVXRpbGl0eSBGdW5jdGlvbnNcbmZ1bmN0aW9uIGdlbmVyYXRlRXJyb3JJZCgpOiBzdHJpbmcge1xuICByZXR1cm4gYGVycm9yXyR7RGF0ZS5ub3coKX1fJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNSZWNvdmVyYWJsZUVycm9yKGVycm9yOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEZpZ21hUGx1Z2luRXJyb3IpIHtcbiAgICByZXR1cm4gZXJyb3IuaXNSZWNvdmVyYWJsZVxuICB9XG4gIHJldHVybiB0cnVlIC8vIEFzc3VtZSByZWNvdmVyYWJsZSBmb3IgdW5rbm93biBlcnJvcnNcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yU2V2ZXJpdHkoZXJyb3I6IHVua25vd24pOiBFcnJvclNldmVyaXR5IHtcbiAgaWYgKGVycm9yIGluc3RhbmNlb2YgRmlnbWFQbHVnaW5FcnJvcikge1xuICAgIHJldHVybiBlcnJvci5zZXZlcml0eVxuICB9XG4gIHJldHVybiBFcnJvclNldmVyaXR5Lk1FRElVTVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VXNlckZyaWVuZGx5TWVzc2FnZShlcnJvcjogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEZpZ21hUGx1Z2luRXJyb3IgJiYgZXJyb3IudXNlckZyaWVuZGx5TWVzc2FnZSkge1xuICAgIHJldHVybiBlcnJvci51c2VyRnJpZW5kbHlNZXNzYWdlXG4gIH1cbiAgcmV0dXJuICdBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkLiBQbGVhc2UgdHJ5IGFnYWluLidcbn1cblxuLy8gRXJyb3IgQ29udmVyc2lvbiBVdGlsaXRpZXNcbmV4cG9ydCBmdW5jdGlvbiBjb252ZXJ0VG9GaWdtYUVycm9yKGVycm9yOiB1bmtub3duLCBjb250ZXh0PzogUGFydGlhbDxFcnJvckNvbnRleHQ+KTogRmlnbWFQbHVnaW5FcnJvciB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEZpZ21hUGx1Z2luRXJyb3IpIHtcbiAgICByZXR1cm4gZXJyb3JcbiAgfVxuXG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgcmV0dXJuIG5ldyBGaWdtYVBsdWdpbkVycm9yKGVycm9yLm1lc3NhZ2UsIHtcbiAgICAgIGNhdGVnb3J5OiBFcnJvckNhdGVnb3J5LlNZU1RFTSxcbiAgICAgIHNldmVyaXR5OiBFcnJvclNldmVyaXR5Lk1FRElVTSxcbiAgICAgIGNvbnRleHQ6IGNvbnRleHQgfHwge30sXG4gICAgICBjYXVzZTogZXJyb3IsXG4gICAgICBpc1JlY292ZXJhYmxlOiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBuZXcgRmlnbWFQbHVnaW5FcnJvcihTdHJpbmcoZXJyb3IpLCB7XG4gICAgY2F0ZWdvcnk6IEVycm9yQ2F0ZWdvcnkuU1lTVEVNLFxuICAgIHNldmVyaXR5OiBFcnJvclNldmVyaXR5Lk1FRElVTSxcbiAgICBjb250ZXh0OiBjb250ZXh0IHx8IHt9LFxuICAgIGlzUmVjb3ZlcmFibGU6IHRydWVcbiAgfSlcbn1cblxuLy8gRXJyb3IgUmV0cnkgVXRpbGl0aWVzXG5leHBvcnQgaW50ZXJmYWNlIFJldHJ5T3B0aW9ucyB7XG4gIG1heEF0dGVtcHRzOiBudW1iZXJcbiAgZGVsYXk6IG51bWJlclxuICBiYWNrb2ZmTXVsdGlwbGllcj86IG51bWJlclxuICBzaG91bGRSZXRyeT86IChlcnJvcjogdW5rbm93bikgPT4gYm9vbGVhblxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2l0aFJldHJ5PFQ+KFxuICBvcGVyYXRpb246ICgpID0+IFByb21pc2U8VD4sXG4gIG9wdGlvbnM6IFJldHJ5T3B0aW9uc1xuKTogUHJvbWlzZTxUPiB7XG4gIGxldCBsYXN0RXJyb3I6IHVua25vd25cbiAgY29uc3QgeyBtYXhBdHRlbXB0cywgZGVsYXksIGJhY2tvZmZNdWx0aXBsaWVyID0gMS41LCBzaG91bGRSZXRyeSA9IGlzUmVjb3ZlcmFibGVFcnJvciB9ID0gb3B0aW9uc1xuXG4gIGZvciAobGV0IGF0dGVtcHQgPSAxOyBhdHRlbXB0IDw9IG1heEF0dGVtcHRzOyBhdHRlbXB0KyspIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG9wZXJhdGlvbigpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxhc3RFcnJvciA9IGVycm9yXG4gICAgICBcbiAgICAgIGlmIChhdHRlbXB0ID09PSBtYXhBdHRlbXB0cyB8fCAhc2hvdWxkUmV0cnkoZXJyb3IpKSB7XG4gICAgICAgIHRocm93IGVycm9yXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGN1cnJlbnREZWxheSA9IGRlbGF5ICogTWF0aC5wb3coYmFja29mZk11bHRpcGxpZXIsIGF0dGVtcHQgLSAxKVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIGN1cnJlbnREZWxheSkpXG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbGFzdEVycm9yXG59ICIsIi8vIFN0cnVjdHVyZWQgTG9nZ2luZyBTeXN0ZW0gZm9yIEZpZ21hIFBsdWdpblxuLy8gU3VwcG9ydHMgbG9jYWwtZmlyc3QgbG9nZ2luZyB3aXRoIG9wdGlvbmFsIGNsb3VkIHN5bmNcblxuaW1wb3J0IHR5cGUgeyBTdHJ1Y3R1cmVkRXJyb3IgfSBmcm9tICcuL2Vycm9ycydcbmltcG9ydCB7IEVycm9yQ2F0ZWdvcnksIEVycm9yU2V2ZXJpdHkgfSBmcm9tICcuL2Vycm9ycydcblxuZXhwb3J0IGNvbnN0IExvZ0xldmVsID0ge1xuICBERUJVRzogJ0RFQlVHJyxcbiAgSU5GTzogJ0lORk8nLFxuICBXQVJOOiAnV0FSTicsXG4gIEVSUk9SOiAnRVJST1InLFxuICBGQVRBTDogJ0ZBVEFMJ1xufSBhcyBjb25zdFxuXG5leHBvcnQgdHlwZSBMb2dMZXZlbCA9IHR5cGVvZiBMb2dMZXZlbFtrZXlvZiB0eXBlb2YgTG9nTGV2ZWxdXG5cbmV4cG9ydCBpbnRlcmZhY2UgTG9nRW50cnkge1xuICBpZDogc3RyaW5nXG4gIHRpbWVzdGFtcDogc3RyaW5nXG4gIGxldmVsOiBMb2dMZXZlbFxuICBtZXNzYWdlOiBzdHJpbmdcbiAgZW52aXJvbm1lbnQ6ICdVSScgfCAnUExVR0lOJ1xuICBjYXRlZ29yeT86IHN0cmluZ1xuICBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgZXJyb3I/OiBTdHJ1Y3R1cmVkRXJyb3JcbiAgc3RhY2s/OiBzdHJpbmdcbiAgc2Vzc2lvbklkPzogc3RyaW5nXG4gIHVzZXJJZD86IHN0cmluZ1xuICBwbHVnaW5WZXJzaW9uPzogc3RyaW5nXG4gIGZpZ21hVmVyc2lvbj86IHN0cmluZ1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExvZ2dlckNvbmZpZyB7XG4gIGxldmVsOiBMb2dMZXZlbFxuICBlbnZpcm9ubWVudDogJ1VJJyB8ICdQTFVHSU4nXG4gIGVuYWJsZUxvY2FsU3RvcmFnZTogYm9vbGVhblxuICBtYXhMb2NhbEVudHJpZXM6IG51bWJlclxuICBlbmFibGVDbG91ZFN5bmM6IGJvb2xlYW5cbiAgc2Vzc2lvbklkPzogc3RyaW5nXG4gIHVzZXJJZD86IHN0cmluZ1xuICBwbHVnaW5WZXJzaW9uPzogc3RyaW5nXG4gIHNlbnRyeUNvbmZpZz86IHtcbiAgICBkc246IHN0cmluZ1xuICAgIGVudmlyb25tZW50OiBzdHJpbmdcbiAgICBlbmFibGVkOiBib29sZWFuXG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0cnVjdHVyZWRMb2dnZXIge1xuICBwcml2YXRlIGNvbmZpZzogTG9nZ2VyQ29uZmlnXG4gIHByaXZhdGUgbG9jYWxTdG9yYWdlOiBTdG9yYWdlIHwgbnVsbCA9IG51bGxcbiAgcHJpdmF0ZSBsb2dCdWZmZXI6IExvZ0VudHJ5W10gPSBbXVxuICBwcml2YXRlIHN5bmNRdWV1ZTogTG9nRW50cnlbXSA9IFtdXG4gIHByaXZhdGUgY2xvdWRTeW5jRW5hYmxlZCA9IGZhbHNlXG5cbiAgY29uc3RydWN0b3IoY29uZmlnOiBMb2dnZXJDb25maWcpIHtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZ1xuICAgIHRoaXMuc2V0dXBTdG9yYWdlKClcbiAgICB0aGlzLnNldHVwQ2xvdWRTeW5jKClcbiAgfVxuXG4gIHByaXZhdGUgc2V0dXBTdG9yYWdlKCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5lbmFibGVMb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFRyeSB0byBhY2Nlc3MgbG9jYWxTdG9yYWdlIChhdmFpbGFibGUgaW4gVUkgcHJvY2VzcylcbiAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2UgPSB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdy5sb2NhbFN0b3JhZ2UgOiBudWxsXG4gICAgICAgIGlmICh0aGlzLmxvY2FsU3RvcmFnZSkge1xuICAgICAgICAgIHRoaXMubG9hZFN0b3JlZExvZ3MoKVxuICAgICAgICB9XG4gICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgIGNvbnNvbGUud2FybignbG9jYWxTdG9yYWdlIG5vdCBhdmFpbGFibGUsIHVzaW5nIGluLW1lbW9yeSBsb2dnaW5nIG9ubHknLCBlcnJvcilcbiAgICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzZXR1cENsb3VkU3luYygpIHtcbiAgICBpZiAodGhpcy5jb25maWcuZW5hYmxlQ2xvdWRTeW5jICYmIHRoaXMuY29uZmlnLnNlbnRyeUNvbmZpZz8uZW5hYmxlZCkge1xuICAgICAgdGhpcy5jbG91ZFN5bmNFbmFibGVkID0gdHJ1ZVxuICAgICAgdGhpcy5pbml0aWFsaXplU2VudHJ5KClcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGluaXRpYWxpemVTZW50cnkoKSB7XG4gICAgLy8gRHluYW1pYyBTZW50cnkgaW5pdGlhbGl6YXRpb24gKG9ubHkgd2hlbiBuZWVkZWQpXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuY29uZmlnLnNlbnRyeUNvbmZpZz8uZHNuKSB7XG4gICAgICAvLyBXaWxsIGJlIGltcGxlbWVudGVkIHdoZW4gbmV0d29yayBhY2Nlc3MgaXMgZW5hYmxlZFxuICAgICAgY29uc29sZS5pbmZvKCdTZW50cnkgaW50ZWdyYXRpb24gcmVhZHkgZm9yIG5ldHdvcmstZW5hYmxlZCBtb2RlJylcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNob3VsZExvZyhsZXZlbDogTG9nTGV2ZWwpOiBib29sZWFuIHtcbiAgICBjb25zdCBsZXZlbHMgPSBbTG9nTGV2ZWwuREVCVUcsIExvZ0xldmVsLklORk8sIExvZ0xldmVsLldBUk4sIExvZ0xldmVsLkVSUk9SLCBMb2dMZXZlbC5GQVRBTF1cbiAgICByZXR1cm4gbGV2ZWxzLmluZGV4T2YobGV2ZWwpID49IGxldmVscy5pbmRleE9mKHRoaXMuY29uZmlnLmxldmVsKVxuICB9XG5cbiAgcHJpdmF0ZSBnZW5lcmF0ZUxvZ0lkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGBsb2dfJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cigyLCA5KX1gXG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUxvZ0VudHJ5KFxuICAgIGxldmVsOiBMb2dMZXZlbCxcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+LFxuICAgIGVycm9yPzogU3RydWN0dXJlZEVycm9yXG4gICk6IExvZ0VudHJ5IHtcbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHRoaXMuZ2VuZXJhdGVMb2dJZCgpLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICBsZXZlbCxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBlbnZpcm9ubWVudDogdGhpcy5jb25maWcuZW52aXJvbm1lbnQsXG4gICAgICBjYXRlZ29yeTogZXJyb3I/LmNhdGVnb3J5IHx8IGRhdGE/LmNhdGVnb3J5IGFzIHN0cmluZyxcbiAgICAgIGRhdGEsXG4gICAgICBlcnJvcixcbiAgICAgIHN0YWNrOiBlcnJvcj8uc3RhY2ssXG4gICAgICBzZXNzaW9uSWQ6IHRoaXMuY29uZmlnLnNlc3Npb25JZCxcbiAgICAgIHVzZXJJZDogdGhpcy5jb25maWcudXNlcklkLFxuICAgICAgcGx1Z2luVmVyc2lvbjogdGhpcy5jb25maWcucGx1Z2luVmVyc2lvbixcbiAgICAgICAgICAgICBmaWdtYVZlcnNpb246IHVuZGVmaW5lZCAvLyBGaWdtYSB2ZXJzaW9uIG5vdCBhdmFpbGFibGUgaW4gcGx1Z2luIEFQSVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdExvZyhlbnRyeTogTG9nRW50cnkpIHtcbiAgICAvLyBBZGQgdG8gaW4tbWVtb3J5IGJ1ZmZlclxuICAgIHRoaXMubG9nQnVmZmVyLnB1c2goZW50cnkpXG4gICAgXG4gICAgLy8gTGltaXQgYnVmZmVyIHNpemVcbiAgICBpZiAodGhpcy5sb2dCdWZmZXIubGVuZ3RoID4gdGhpcy5jb25maWcubWF4TG9jYWxFbnRyaWVzKSB7XG4gICAgICB0aGlzLmxvZ0J1ZmZlci5zaGlmdCgpXG4gICAgfVxuXG4gICAgLy8gUGVyc2lzdCB0byBsb2NhbFN0b3JhZ2UgaWYgYXZhaWxhYmxlXG4gICAgaWYgKHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBzdG9yZWQgPSB0aGlzLmdldFN0b3JlZExvZ3MoKVxuICAgICAgICBzdG9yZWQucHVzaChlbnRyeSlcbiAgICAgICAgXG4gICAgICAgIC8vIEtlZXAgb25seSByZWNlbnQgZW50cmllc1xuICAgICAgICBpZiAoc3RvcmVkLmxlbmd0aCA+IHRoaXMuY29uZmlnLm1heExvY2FsRW50cmllcykge1xuICAgICAgICAgIHN0b3JlZC5zcGxpY2UoMCwgc3RvcmVkLmxlbmd0aCAtIHRoaXMuY29uZmlnLm1heExvY2FsRW50cmllcylcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgdGhpcy5sb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnZmlnbWEtcGx1Z2luLWxvZ3MnLCBKU09OLnN0cmluZ2lmeShzdG9yZWQpKVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gcGVyc2lzdCBsb2cgdG8gbG9jYWxTdG9yYWdlOicsIGVycm9yKVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFF1ZXVlIGZvciBjbG91ZCBzeW5jIGlmIGVuYWJsZWRcbiAgICBpZiAodGhpcy5jbG91ZFN5bmNFbmFibGVkKSB7XG4gICAgICB0aGlzLnN5bmNRdWV1ZS5wdXNoKGVudHJ5KVxuICAgICAgdGhpcy5zY2hlZHVsZUNsb3VkU3luYygpXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBsb2FkU3RvcmVkTG9ncygpIHtcbiAgICBpZiAoIXRoaXMubG9jYWxTdG9yYWdlKSByZXR1cm5cbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RvcmVkID0gdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZmlnbWEtcGx1Z2luLWxvZ3MnKVxuICAgICAgaWYgKHN0b3JlZCkge1xuICAgICAgICB0aGlzLmxvZ0J1ZmZlciA9IEpTT04ucGFyc2Uoc3RvcmVkKVxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBsb2FkIHN0b3JlZCBsb2dzOicsIGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0U3RvcmVkTG9ncygpOiBMb2dFbnRyeVtdIHtcbiAgICBpZiAoIXRoaXMubG9jYWxTdG9yYWdlKSByZXR1cm4gW11cbiAgICBcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RvcmVkID0gdGhpcy5sb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZmlnbWEtcGx1Z2luLWxvZ3MnKVxuICAgICAgcmV0dXJuIHN0b3JlZCA/IEpTT04ucGFyc2Uoc3RvcmVkKSA6IFtdXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCBzdG9yZWQgbG9nczonLCBlcnJvcilcbiAgICAgIHJldHVybiBbXVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVDbG91ZFN5bmMoKSB7XG4gICAgLy8gRGVib3VuY2VkIHN5bmMgdG8gYXZvaWQgdG9vIG1hbnkgcmVxdWVzdHNcbiAgICBpZiAodGhpcy5zeW5jUXVldWUubGVuZ3RoID4gMCkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnN5bmNUb0Nsb3VkKCksIDUwMDApXG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzeW5jVG9DbG91ZCgpIHtcbiAgICBpZiAoIXRoaXMuY2xvdWRTeW5jRW5hYmxlZCB8fCB0aGlzLnN5bmNRdWV1ZS5sZW5ndGggPT09IDApIHJldHVyblxuXG4gICAgY29uc3QgbG9nc1RvU3luYyA9IFsuLi50aGlzLnN5bmNRdWV1ZV1cbiAgICB0aGlzLnN5bmNRdWV1ZSA9IFtdXG5cbiAgICB0cnkge1xuICAgICAgLy8gVGhpcyB3aWxsIGJlIGltcGxlbWVudGVkIHdoZW4gbmV0d29yayBhY2Nlc3MgaXMgZW5hYmxlZFxuICAgICAgY29uc29sZS5pbmZvKGBXb3VsZCBzeW5jICR7bG9nc1RvU3luYy5sZW5ndGh9IGxvZyBlbnRyaWVzIHRvIGNsb3VkYClcbiAgICAgIC8vIGF3YWl0IHRoaXMuc2VuZFRvU2VudHJ5KGxvZ3NUb1N5bmMpXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIHN5bmMgbG9ncyB0byBjbG91ZDonLCBlcnJvcilcbiAgICAgIC8vIFJlLXF1ZXVlIGZhaWxlZCBsb2dzXG4gICAgICB0aGlzLnN5bmNRdWV1ZS51bnNoaWZ0KC4uLmxvZ3NUb1N5bmMpXG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljIGxvZ2dpbmcgbWV0aG9kc1xuICBkZWJ1ZyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIGlmICh0aGlzLnNob3VsZExvZyhMb2dMZXZlbC5ERUJVRykpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5jcmVhdGVMb2dFbnRyeShMb2dMZXZlbC5ERUJVRywgbWVzc2FnZSwgZGF0YSlcbiAgICAgIHRoaXMucGVyc2lzdExvZyhlbnRyeSlcbiAgICAgIGNvbnNvbGUuZGVidWcoYFske3RoaXMuY29uZmlnLmVudmlyb25tZW50fV0gJHttZXNzYWdlfWAsIGRhdGEpXG4gICAgfVxuICB9XG5cbiAgaW5mbyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIGlmICh0aGlzLnNob3VsZExvZyhMb2dMZXZlbC5JTkZPKSkge1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmNyZWF0ZUxvZ0VudHJ5KExvZ0xldmVsLklORk8sIG1lc3NhZ2UsIGRhdGEpXG4gICAgICB0aGlzLnBlcnNpc3RMb2coZW50cnkpXG4gICAgICBjb25zb2xlLmluZm8oYFske3RoaXMuY29uZmlnLmVudmlyb25tZW50fV0gJHttZXNzYWdlfWAsIGRhdGEpXG4gICAgfVxuICB9XG5cbiAgd2FybihtZXNzYWdlOiBzdHJpbmcsIGRhdGE/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikge1xuICAgIGlmICh0aGlzLnNob3VsZExvZyhMb2dMZXZlbC5XQVJOKSkge1xuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmNyZWF0ZUxvZ0VudHJ5KExvZ0xldmVsLldBUk4sIG1lc3NhZ2UsIGRhdGEpXG4gICAgICB0aGlzLnBlcnNpc3RMb2coZW50cnkpXG4gICAgICBjb25zb2xlLndhcm4oYFske3RoaXMuY29uZmlnLmVudmlyb25tZW50fV0gJHttZXNzYWdlfWAsIGRhdGEpXG4gICAgfVxuICB9XG5cbiAgZXJyb3IobWVzc2FnZTogc3RyaW5nLCBlcnJvcj86IEVycm9yIHwgU3RydWN0dXJlZEVycm9yLCBkYXRhPzogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pIHtcbiAgICBpZiAodGhpcy5zaG91bGRMb2coTG9nTGV2ZWwuRVJST1IpKSB7XG4gICAgICBsZXQgc3RydWN0dXJlZEVycm9yOiBTdHJ1Y3R1cmVkRXJyb3IgfCB1bmRlZmluZWRcbiAgICAgIFxuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgc3RydWN0dXJlZEVycm9yID0ge1xuICAgICAgICAgIGlkOiB0aGlzLmdlbmVyYXRlTG9nSWQoKSxcbiAgICAgICAgICBjYXRlZ29yeTogRXJyb3JDYXRlZ29yeS5TWVNURU0sXG4gICAgICAgICAgc2V2ZXJpdHk6IEVycm9yU2V2ZXJpdHkuTUVESVVNLFxuICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHRoaXMuY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgICAgICAgLi4uZGF0YVxuICAgICAgICAgIH0sXG4gICAgICAgICAgaXNSZWNvdmVyYWJsZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGVycm9yKSB7XG4gICAgICAgIHN0cnVjdHVyZWRFcnJvciA9IGVycm9yIGFzIFN0cnVjdHVyZWRFcnJvclxuICAgICAgfVxuXG4gICAgICBjb25zdCBlbnRyeSA9IHRoaXMuY3JlYXRlTG9nRW50cnkoTG9nTGV2ZWwuRVJST1IsIG1lc3NhZ2UsIGRhdGEsIHN0cnVjdHVyZWRFcnJvcilcbiAgICAgIHRoaXMucGVyc2lzdExvZyhlbnRyeSlcbiAgICAgIGNvbnNvbGUuZXJyb3IoYFske3RoaXMuY29uZmlnLmVudmlyb25tZW50fV0gJHttZXNzYWdlfWAsIGVycm9yLCBkYXRhKVxuICAgIH1cbiAgfVxuXG4gIGZhdGFsKG1lc3NhZ2U6IHN0cmluZywgZXJyb3I/OiBFcnJvciB8IFN0cnVjdHVyZWRFcnJvciwgZGF0YT86IFJlY29yZDxzdHJpbmcsIHVua25vd24+KSB7XG4gICAgaWYgKHRoaXMuc2hvdWxkTG9nKExvZ0xldmVsLkZBVEFMKSkge1xuICAgICAgbGV0IHN0cnVjdHVyZWRFcnJvcjogU3RydWN0dXJlZEVycm9yIHwgdW5kZWZpbmVkXG4gICAgICBcbiAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIHN0cnVjdHVyZWRFcnJvciA9IHtcbiAgICAgICAgICBpZDogdGhpcy5nZW5lcmF0ZUxvZ0lkKCksXG4gICAgICAgICAgY2F0ZWdvcnk6IEVycm9yQ2F0ZWdvcnkuU1lTVEVNLFxuICAgICAgICAgIHNldmVyaXR5OiBFcnJvclNldmVyaXR5LkNSSVRJQ0FMLFxuICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrLFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgZW52aXJvbm1lbnQ6IHRoaXMuY29uZmlnLmVudmlyb25tZW50LFxuICAgICAgICAgICAgLi4uZGF0YVxuICAgICAgICAgIH0sXG4gICAgICAgICAgaXNSZWNvdmVyYWJsZTogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlcnJvcikge1xuICAgICAgICBzdHJ1Y3R1cmVkRXJyb3IgPSBlcnJvciBhcyBTdHJ1Y3R1cmVkRXJyb3JcbiAgICAgIH1cblxuICAgICAgY29uc3QgZW50cnkgPSB0aGlzLmNyZWF0ZUxvZ0VudHJ5KExvZ0xldmVsLkZBVEFMLCBtZXNzYWdlLCBkYXRhLCBzdHJ1Y3R1cmVkRXJyb3IpXG4gICAgICB0aGlzLnBlcnNpc3RMb2coZW50cnkpXG4gICAgICBjb25zb2xlLmVycm9yKGBbJHt0aGlzLmNvbmZpZy5lbnZpcm9ubWVudH1dIEZBVEFMOiAke21lc3NhZ2V9YCwgZXJyb3IsIGRhdGEpXG4gICAgfVxuICB9XG5cbiAgLy8gVXRpbGl0eSBtZXRob2RzXG4gIGdldExvZ3MoZmlsdGVycz86IHtcbiAgICBsZXZlbD86IExvZ0xldmVsXG4gICAgY2F0ZWdvcnk/OiBzdHJpbmdcbiAgICBzaW5jZT86IERhdGVcbiAgICBsaW1pdD86IG51bWJlclxuICB9KTogTG9nRW50cnlbXSB7XG4gICAgbGV0IGxvZ3MgPSBbLi4udGhpcy5sb2dCdWZmZXJdXG4gICAgXG4gICAgaWYgKGZpbHRlcnM/LmxldmVsKSB7XG4gICAgICBsb2dzID0gbG9ncy5maWx0ZXIobG9nID0+IGxvZy5sZXZlbCA9PT0gZmlsdGVycy5sZXZlbClcbiAgICB9XG4gICAgXG4gICAgaWYgKGZpbHRlcnM/LmNhdGVnb3J5KSB7XG4gICAgICBsb2dzID0gbG9ncy5maWx0ZXIobG9nID0+IGxvZy5jYXRlZ29yeSA9PT0gZmlsdGVycy5jYXRlZ29yeSlcbiAgICB9XG4gICAgXG4gICAgaWYgKGZpbHRlcnM/LnNpbmNlKSB7XG4gICAgICBsb2dzID0gbG9ncy5maWx0ZXIobG9nID0+IG5ldyBEYXRlKGxvZy50aW1lc3RhbXApID49IGZpbHRlcnMuc2luY2UhKVxuICAgIH1cbiAgICBcbiAgICBpZiAoZmlsdGVycz8ubGltaXQpIHtcbiAgICAgIGxvZ3MgPSBsb2dzLnNsaWNlKC1maWx0ZXJzLmxpbWl0KVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbG9nc1xuICB9XG5cbiAgY2xlYXJMb2dzKCkge1xuICAgIHRoaXMubG9nQnVmZmVyID0gW11cbiAgICB0aGlzLnN5bmNRdWV1ZSA9IFtdXG4gICAgaWYgKHRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgICB0aGlzLmxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdmaWdtYS1wbHVnaW4tbG9ncycpXG4gICAgfVxuICB9XG5cbiAgZXhwb3J0TG9ncygpOiBzdHJpbmcge1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh0aGlzLmxvZ0J1ZmZlciwgbnVsbCwgMilcbiAgfVxuXG4gIGdldExvZ1N0YXRzKCk6IHtcbiAgICB0b3RhbExvZ3M6IG51bWJlclxuICAgIGVycm9yQ291bnQ6IG51bWJlclxuICAgIHdhcm5pbmdDb3VudDogbnVtYmVyXG4gICAgbGFzdEVycm9yPzogTG9nRW50cnlcbiAgfSB7XG4gICAgY29uc3QgZXJyb3JMb2dzID0gdGhpcy5sb2dCdWZmZXIuZmlsdGVyKGxvZyA9PiBsb2cubGV2ZWwgPT09IExvZ0xldmVsLkVSUk9SIHx8IGxvZy5sZXZlbCA9PT0gTG9nTGV2ZWwuRkFUQUwpXG4gICAgY29uc3Qgd2FybmluZ0xvZ3MgPSB0aGlzLmxvZ0J1ZmZlci5maWx0ZXIobG9nID0+IGxvZy5sZXZlbCA9PT0gTG9nTGV2ZWwuV0FSTilcbiAgICBcbiAgICByZXR1cm4ge1xuICAgICAgdG90YWxMb2dzOiB0aGlzLmxvZ0J1ZmZlci5sZW5ndGgsXG4gICAgICBlcnJvckNvdW50OiBlcnJvckxvZ3MubGVuZ3RoLFxuICAgICAgd2FybmluZ0NvdW50OiB3YXJuaW5nTG9ncy5sZW5ndGgsXG4gICAgICBsYXN0RXJyb3I6IGVycm9yTG9nc1tlcnJvckxvZ3MubGVuZ3RoIC0gMV1cbiAgICB9XG4gIH1cbn1cblxuLy8gRGVmYXVsdCBsb2dnZXIgaW5zdGFuY2VzXG5leHBvcnQgY29uc3QgY3JlYXRlTG9nZ2VyID0gKGNvbmZpZzogTG9nZ2VyQ29uZmlnKTogU3RydWN0dXJlZExvZ2dlciA9PiB7XG4gIHJldHVybiBuZXcgU3RydWN0dXJlZExvZ2dlcihjb25maWcpXG59XG5cbi8vIFByZS1jb25maWd1cmVkIGxvZ2dlciBmYWN0b3JpZXNcbmV4cG9ydCBjb25zdCBjcmVhdGVVSUxvZ2dlciA9IChzZXNzaW9uSWQ/OiBzdHJpbmcpOiBTdHJ1Y3R1cmVkTG9nZ2VyID0+IHtcbiAgcmV0dXJuIGNyZWF0ZUxvZ2dlcih7XG4gICAgbGV2ZWw6IExvZ0xldmVsLklORk8sXG4gICAgZW52aXJvbm1lbnQ6ICdVSScsXG4gICAgZW5hYmxlTG9jYWxTdG9yYWdlOiB0cnVlLFxuICAgIG1heExvY2FsRW50cmllczogMTAwMCxcbiAgICBlbmFibGVDbG91ZFN5bmM6IGZhbHNlLCAvLyBXaWxsIGJlIGVuYWJsZWQgd2hlbiBuZXR3b3JrIGFjY2VzcyBpcyBhdmFpbGFibGVcbiAgICBzZXNzaW9uSWQsXG4gICAgcGx1Z2luVmVyc2lvbjogJzAuMC4zJyAvLyBGcm9tIHBhY2thZ2UuanNvblxuICB9KVxufVxuXG5leHBvcnQgY29uc3QgY3JlYXRlUGx1Z2luTG9nZ2VyID0gKHNlc3Npb25JZD86IHN0cmluZyk6IFN0cnVjdHVyZWRMb2dnZXIgPT4ge1xuICByZXR1cm4gY3JlYXRlTG9nZ2VyKHtcbiAgICBsZXZlbDogTG9nTGV2ZWwuSU5GTyxcbiAgICBlbnZpcm9ubWVudDogJ1BMVUdJTicsXG4gICAgZW5hYmxlTG9jYWxTdG9yYWdlOiBmYWxzZSwgLy8gTm90IGF2YWlsYWJsZSBpbiBwbHVnaW4gY29udGV4dFxuICAgIG1heExvY2FsRW50cmllczogNTAwLFxuICAgIGVuYWJsZUNsb3VkU3luYzogZmFsc2UsIC8vIFdpbGwgYmUgZW5hYmxlZCB3aGVuIG5ldHdvcmsgYWNjZXNzIGlzIGF2YWlsYWJsZVxuICAgIHNlc3Npb25JZCxcbiAgICBwbHVnaW5WZXJzaW9uOiAnMC4wLjMnIC8vIEZyb20gcGFja2FnZS5qc29uXG4gIH0pXG59ICIsIi8vIFBsdWdpbi1zaWRlIGVycm9yIGhhbmRsaW5nIGZvciBGaWdtYSdzIHNhbmRib3hlZCBlbnZpcm9ubWVudFxuaW1wb3J0IHR5cGUgeyBTdHJ1Y3R1cmVkRXJyb3IgfSBmcm9tICcuLi9jb21tb24vZXJyb3JzJ1xuaW1wb3J0IHsgXG4gIGNvbnZlcnRUb0ZpZ21hRXJyb3IsIFxuICBjcmVhdGVGaWdtYUFQSUVycm9yLCBcbiAgY3JlYXRlU3lzdGVtRXJyb3IsIFxuICB3aXRoUmV0cnkgXG59IGZyb20gJy4uL2NvbW1vbi9lcnJvcnMnXG5pbXBvcnQgeyBjcmVhdGVQbHVnaW5Mb2dnZXIgfSBmcm9tICcuLi9jb21tb24vbG9nZ2VyJ1xuXG5leHBvcnQgY2xhc3MgUGx1Z2luRXJyb3JIYW5kbGVyIHtcbiAgcHJpdmF0ZSBsb2dnZXIgPSBjcmVhdGVQbHVnaW5Mb2dnZXIoKVxuICBwcml2YXRlIGVycm9yQ291bnQgPSAwXG4gIHByaXZhdGUgbWF4RXJyb3JzID0gNTAgLy8gUHJldmVudCBpbmZpbml0ZSBlcnJvciBsb29wc1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuc2V0dXBHbG9iYWxFcnJvckhhbmRsaW5nKClcbiAgfVxuXG4gIHByaXZhdGUgc2V0dXBHbG9iYWxFcnJvckhhbmRsaW5nKCkge1xuICAgIC8vIEdsb2JhbCBlcnJvciBoYW5kbGVyIGZvciB0aGUgcGx1Z2luIGVudmlyb25tZW50XG4gICAgY29uc3Qgb3JpZ2luYWxFcnJvciA9IGNvbnNvbGUuZXJyb3JcbiAgICBjb25zb2xlLmVycm9yID0gKC4uLmFyZ3M6IHVua25vd25bXSkgPT4ge1xuICAgICAgaWYgKHRoaXMuZXJyb3JDb3VudCA8IHRoaXMubWF4RXJyb3JzKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlRXJyb3IoYXJnc1swXSBhcyBFcnJvciwgeyBzb3VyY2U6ICdjb25zb2xlLmVycm9yJyB9KVxuICAgICAgICB0aGlzLmVycm9yQ291bnQrK1xuICAgICAgfVxuICAgICAgb3JpZ2luYWxFcnJvci5hcHBseShjb25zb2xlLCBhcmdzKVxuICAgIH1cblxuICAgIC8vIEhhbmRsZSB1bmhhbmRsZWQgcHJvbWlzZSByZWplY3Rpb25zXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLm9uKSB7XG4gICAgICBwcm9jZXNzLm9uKCd1bmhhbmRsZWRSZWplY3Rpb24nLCAocmVhc29uKSA9PiB7XG4gICAgICAgIHRoaXMuaGFuZGxlRXJyb3IocmVhc29uIGFzIEVycm9yLCB7IHNvdXJjZTogJ3VuaGFuZGxlZFJlamVjdGlvbicgfSlcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgaGFuZGxlRXJyb3IoZXJyb3I6IHVua25vd24sIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPik6IFN0cnVjdHVyZWRFcnJvciB7XG4gICAgY29uc3Qgc3RydWN0dXJlZEVycm9yID0gY29udmVydFRvRmlnbWFFcnJvcihlcnJvciwge1xuICAgICAgZW52aXJvbm1lbnQ6ICdQTFVHSU4nLFxuICAgICAgLi4uY29udGV4dFxuICAgIH0pXG5cbiAgICB0aGlzLmxvZ2dlci5lcnJvcignUGx1Z2luIGVycm9yIG9jY3VycmVkJywgc3RydWN0dXJlZEVycm9yLCBjb250ZXh0KVxuXG4gICAgLy8gU2VuZCBlcnJvciB0byBVSSBpZiBwb3NzaWJsZVxuICAgIHRyeSB7XG4gICAgICBpZiAodHlwZW9mIGZpZ21hICE9PSAndW5kZWZpbmVkJyAmJiBmaWdtYS51aSkge1xuICAgICAgICBmaWdtYS51aS5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICBlcnJvcjogc3RydWN0dXJlZEVycm9yLnRvU3RydWN0dXJlZCgpLFxuICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9IGNhdGNoIChub3RpZmljYXRpb25FcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gc2VuZCBlcnJvciB0byBVSTonLCBub3RpZmljYXRpb25FcnJvcilcbiAgICB9XG5cbiAgICByZXR1cm4gc3RydWN0dXJlZEVycm9yLnRvU3RydWN0dXJlZCgpXG4gIH1cblxuICAvLyBXcmFwcGVyIGZvciBGaWdtYSBBUEkgY2FsbHMgd2l0aCBlcnJvciBoYW5kbGluZ1xuICBhc3luYyB3aXRoRmlnbWFBUEk8VD4oXG4gICAgb3BlcmF0aW9uOiAoKSA9PiBQcm9taXNlPFQ+LFxuICAgIGNvbnRleHQ/OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICApOiBQcm9taXNlPFQ+IHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IHdpdGhSZXRyeShvcGVyYXRpb24sIHtcbiAgICAgICAgbWF4QXR0ZW1wdHM6IDMsXG4gICAgICAgIGRlbGF5OiAxMDAwLFxuICAgICAgICBzaG91bGRSZXRyeTogKGVycm9yKSA9PiB7XG4gICAgICAgICAgLy8gUmV0cnkgb24gbmV0d29yay1saWtlIGVycm9ycywgbm90IG9uIEFQSSB2YWxpZGF0aW9uIGVycm9yc1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcilcbiAgICAgICAgICByZXR1cm4gIW1lc3NhZ2UuaW5jbHVkZXMoJ0ludmFsaWQnKSAmJiAhbWVzc2FnZS5pbmNsdWRlcygnbm90IGZvdW5kJylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZmlnbWFFcnJvciA9IGNyZWF0ZUZpZ21hQVBJRXJyb3IoXG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSxcbiAgICAgICAgeyBlbnZpcm9ubWVudDogJ1BMVUdJTicsIC4uLmNvbnRleHQgfVxuICAgICAgKVxuICAgICAgdGhpcy5oYW5kbGVFcnJvcihmaWdtYUVycm9yLCBjb250ZXh0KVxuICAgICAgdGhyb3cgZmlnbWFFcnJvclxuICAgIH1cbiAgfVxuXG4gIC8vIFdyYXBwZXIgZm9yIGdlbmVyYWwgYXN5bmMgb3BlcmF0aW9uc1xuICBhc3luYyB3aXRoRXJyb3JIYW5kbGluZzxUPihcbiAgICBvcGVyYXRpb246ICgpID0+IFByb21pc2U8VD4sXG4gICAgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICk6IFByb21pc2U8VD4ge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgb3BlcmF0aW9uKClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3Qgc3RydWN0dXJlZEVycm9yID0gdGhpcy5oYW5kbGVFcnJvcihlcnJvciwgY29udGV4dClcbiAgICAgIHRocm93IHN0cnVjdHVyZWRFcnJvclxuICAgIH1cbiAgfVxuXG4gIC8vIFNhZmUgd3JhcHBlciBmb3Igc3luY2hyb25vdXMgb3BlcmF0aW9uc1xuICB3aXRoU2FmZUV4ZWN1dGlvbjxUPihcbiAgICBvcGVyYXRpb246ICgpID0+IFQsXG4gICAgZmFsbGJhY2s6IFQsXG4gICAgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4gICk6IFQge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gb3BlcmF0aW9uKClcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhpcy5oYW5kbGVFcnJvcihlcnJvciwgY29udGV4dClcbiAgICAgIHJldHVybiBmYWxsYmFja1xuICAgIH1cbiAgfVxuXG4gIC8vIFBsdWdpbi1zcGVjaWZpYyBlcnJvciBoYW5kbGVyc1xuICBoYW5kbGVTZWxlY3Rpb25FcnJvcihlcnJvcjogdW5rbm93biwgbm9kZUlkPzogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHRoaXMuaGFuZGxlRXJyb3IoZXJyb3IsIHtcbiAgICAgIHNvdXJjZTogJ3NlbGVjdGlvbicsXG4gICAgICBub2RlSWQsXG4gICAgICBhY3Rpb246ICdzZWxlY3Rpb25fY2hhbmdlJ1xuICAgIH0pXG4gIH1cblxuICBoYW5kbGVUZXh0Q3JlYXRpb25FcnJvcihlcnJvcjogdW5rbm93biwgdGV4dD86IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmhhbmRsZUVycm9yKGVycm9yLCB7XG4gICAgICBzb3VyY2U6ICd0ZXh0X2NyZWF0aW9uJyxcbiAgICAgIHRleHQsXG4gICAgICBhY3Rpb246ICdjcmVhdGVfdGV4dCdcbiAgICB9KVxuICB9XG5cbiAgaGFuZGxlTmV0d29ya0Vycm9yKGVycm9yOiB1bmtub3duLCBtZXNzYWdlVHlwZT86IHN0cmluZykge1xuICAgIHJldHVybiB0aGlzLmhhbmRsZUVycm9yKGVycm9yLCB7XG4gICAgICBzb3VyY2U6ICduZXR3b3JrJyxcbiAgICAgIG1lc3NhZ2VUeXBlLFxuICAgICAgYWN0aW9uOiAnbWVzc2FnZV9oYW5kbGluZydcbiAgICB9KVxuICB9XG5cbiAgLy8gR2V0IGVycm9yIHN0YXRpc3RpY3NcbiAgZ2V0RXJyb3JTdGF0cygpOiB7XG4gICAgdG90YWxFcnJvcnM6IG51bWJlclxuICAgIHJlY2VudEVycm9yczogU3RydWN0dXJlZEVycm9yW11cbiAgfSB7XG4gICAgY29uc3Qgc3RhdHMgPSB0aGlzLmxvZ2dlci5nZXRMb2dTdGF0cygpXG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsRXJyb3JzOiBzdGF0cy5lcnJvckNvdW50LFxuICAgICAgcmVjZW50RXJyb3JzOiB0aGlzLmxvZ2dlci5nZXRMb2dzKHsgXG4gICAgICAgIGxldmVsOiAnRVJST1InLCBcbiAgICAgICAgbGltaXQ6IDEwIFxuICAgICAgfSkubWFwKGxvZyA9PiBsb2cuZXJyb3IpLmZpbHRlcihCb29sZWFuKSBhcyBTdHJ1Y3R1cmVkRXJyb3JbXVxuICAgIH1cbiAgfVxuXG4gIC8vIFJlc2V0IGVycm9yIGNvdW50ICh1c2VmdWwgZm9yIHRlc3RpbmcpXG4gIHJlc2V0RXJyb3JDb3VudCgpIHtcbiAgICB0aGlzLmVycm9yQ291bnQgPSAwXG4gIH1cbn1cblxuLy8gR2xvYmFsIGluc3RhbmNlIGZvciB0aGUgcGx1Z2luXG5leHBvcnQgY29uc3QgcGx1Z2luRXJyb3JIYW5kbGVyID0gbmV3IFBsdWdpbkVycm9ySGFuZGxlcigpXG5cbi8vIFV0aWxpdHkgZnVuY3Rpb25zIGZvciBjb21tb24gcGx1Z2luIG9wZXJhdGlvbnNcbmV4cG9ydCBjb25zdCBzYWZlbHlFeGVjdXRlID0gPFQ+KFxuICBvcGVyYXRpb246ICgpID0+IFQsXG4gIGZhbGxiYWNrOiBULFxuICBjb250ZXh0PzogUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbik6IFQgPT4ge1xuICByZXR1cm4gcGx1Z2luRXJyb3JIYW5kbGVyLndpdGhTYWZlRXhlY3V0aW9uKG9wZXJhdGlvbiwgZmFsbGJhY2ssIGNvbnRleHQpXG59XG5cbmV4cG9ydCBjb25zdCBzYWZlbHlFeGVjdXRlQXN5bmMgPSBhc3luYyA8VD4oXG4gIG9wZXJhdGlvbjogKCkgPT4gUHJvbWlzZTxUPixcbiAgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4pOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIHBsdWdpbkVycm9ySGFuZGxlci53aXRoRXJyb3JIYW5kbGluZyhvcGVyYXRpb24sIGNvbnRleHQpXG59XG5cbmV4cG9ydCBjb25zdCB3aXRoRmlnbWFBUEkgPSBhc3luYyA8VD4oXG4gIG9wZXJhdGlvbjogKCkgPT4gUHJvbWlzZTxUPixcbiAgY29udGV4dD86IFJlY29yZDxzdHJpbmcsIHVua25vd24+XG4pOiBQcm9taXNlPFQ+ID0+IHtcbiAgcmV0dXJuIHBsdWdpbkVycm9ySGFuZGxlci53aXRoRmlnbWFBUEkob3BlcmF0aW9uLCBjb250ZXh0KVxufVxuXG4vLyBQbHVnaW4gbGlmZWN5Y2xlIGVycm9yIGhhbmRsZXJzXG5leHBvcnQgY29uc3QgaGFuZGxlUGx1Z2luQm9vdHN0cmFwID0gKGVycm9yOiB1bmtub3duKSA9PiB7XG4gIHJldHVybiBwbHVnaW5FcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IsIHtcbiAgICBzb3VyY2U6ICdib290c3RyYXAnLFxuICAgIGFjdGlvbjogJ3BsdWdpbl9pbml0aWFsaXphdGlvbidcbiAgfSlcbn1cblxuZXhwb3J0IGNvbnN0IGhhbmRsZU1lc3NhZ2VFcnJvciA9IChlcnJvcjogdW5rbm93biwgbWVzc2FnZVR5cGU6IHN0cmluZykgPT4ge1xuICByZXR1cm4gcGx1Z2luRXJyb3JIYW5kbGVyLmhhbmRsZU5ldHdvcmtFcnJvcihlcnJvciwgbWVzc2FnZVR5cGUpXG59XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVTZWxlY3Rpb25DaGFuZ2UgPSAoZXJyb3I6IHVua25vd24sIG5vZGVJZD86IHN0cmluZykgPT4ge1xuICByZXR1cm4gcGx1Z2luRXJyb3JIYW5kbGVyLmhhbmRsZVNlbGVjdGlvbkVycm9yKGVycm9yLCBub2RlSWQpXG59XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVUZXh0Q3JlYXRpb24gPSAoZXJyb3I6IHVua25vd24sIHRleHQ/OiBzdHJpbmcpID0+IHtcbiAgcmV0dXJuIHBsdWdpbkVycm9ySGFuZGxlci5oYW5kbGVUZXh0Q3JlYXRpb25FcnJvcihlcnJvciwgdGV4dClcbn0gIiwiaW1wb3J0IHsgUExVR0lOLCBVSSB9IGZyb20gJy4uL2NvbW1vbi9uZXR3b3JrcydcbmltcG9ydCB7IGhhbmRsZU1lc3NhZ2VFcnJvciwgc2FmZWx5RXhlY3V0ZUFzeW5jIH0gZnJvbSAnLi9lcnJvckhhbmRsZXInXG5cbmV4cG9ydCBjb25zdCBQTFVHSU5fQ0hBTk5FTCA9IFBMVUdJTi5jaGFubmVsQnVpbGRlcigpXG4gIC5lbWl0c1RvKFVJLCBtZXNzYWdlID0+IHtcbiAgICBmaWdtYS51aS5wb3N0TWVzc2FnZShtZXNzYWdlKVxuICB9KVxuICAucmVjZWl2ZXNGcm9tKFVJLCBuZXh0ID0+IHtcbiAgICBjb25zdCBsaXN0ZW5lcjogTWVzc2FnZUV2ZW50SGFuZGxlciA9IGV2ZW50ID0+IG5leHQoZXZlbnQpXG4gICAgZmlnbWEudWkub24oJ21lc3NhZ2UnLCBsaXN0ZW5lcilcbiAgICByZXR1cm4gKCkgPT4gZmlnbWEudWkub2ZmKCdtZXNzYWdlJywgbGlzdGVuZXIpXG4gIH0pXG4gIC5zdGFydExpc3RlbmluZygpXG5cbi8vIC0tLS0tLS0tLS0gU2VsZWN0aW9uIHRyYWNraW5nXG5cbmV4cG9ydCBjb25zdCBzdGFydFNlbGVjdGlvbkxpc3RlbmVyID0gKCkgPT4ge1xuICAvLyBUcmFjayBzZWxlY3Rpb24gY2hhbmdlc1xuICBmaWdtYS5vbignc2VsZWN0aW9uY2hhbmdlJywgKCkgPT4ge1xuICAgIGNvbnN0IHNlbGVjdGlvbiA9IGZpZ21hLmN1cnJlbnRQYWdlLnNlbGVjdGlvblxuICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3Qgc2VsZWN0ZWROb2RlID0gc2VsZWN0aW9uWzBdXG4gICAgICBpZiAoc2VsZWN0ZWROb2RlLnR5cGUgPT09ICdURVhUJykge1xuICAgICAgICBjb25zb2xlLmxvZygnVGV4dCBub2RlIHNlbGVjdGVkOicsIHNlbGVjdGVkTm9kZS5jaGFyYWN0ZXJzKVxuICAgICAgICAvLyBTZW5kIGNsaWNrIG5vdGlmaWNhdGlvbiB0byBVSVxuICAgICAgICBQTFVHSU5fQ0hBTk5FTC5lbWl0KFVJLCAndGV4dENsaWNrZWQnLCBbc2VsZWN0ZWROb2RlLmlkLCBzZWxlY3RlZE5vZGUuY2hhcmFjdGVyc10pXG4gICAgICB9XG4gICAgfVxuICB9KVxufVxuXG4vLyAtLS0tLS0tLS0tIE1lc3NhZ2UgaGFuZGxlcnNcblxuUExVR0lOX0NIQU5ORUwucmVnaXN0ZXJNZXNzYWdlSGFuZGxlcigncGluZycsIGFzeW5jIChjb3VudCkgPT4ge1xuICByZXR1cm4gYXdhaXQgc2FmZWx5RXhlY3V0ZUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnUGx1Z2luIHJlY2VpdmVkIHBpbmcgd2l0aCBjb3VudDonLCBjb3VudCwgJ3Jlc3BvbmRpbmcgd2l0aCBwb25nJylcbiAgICByZXR1cm4gYHBvbmc6ICR7Y291bnR9YFxuICB9LCB7IHNvdXJjZTogJ3BpbmdfaGFuZGxlcicsIG1lc3NhZ2VUeXBlOiAncGluZycgfSlcbn0pXG5cblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ21lc3NhZ2UnLCBhc3luYyAodGV4dCkgPT4ge1xuICByZXR1cm4gYXdhaXQgc2FmZWx5RXhlY3V0ZUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICBjb25zb2xlLmxvZygnUGx1Z2luIHJlY2VpdmVkIG1lc3NhZ2U6JywgdGV4dClcbiAgICByZXR1cm4gYHJlY2VpdmVkICR7dGV4dH0gZnJvbSBwbHVnaW5gXG4gIH0sIHsgc291cmNlOiAnbWVzc2FnZV9oYW5kbGVyJywgbWVzc2FnZVR5cGU6ICdtZXNzYWdlJyB9KVxufSlcblxuUExVR0lOX0NIQU5ORUwucmVnaXN0ZXJNZXNzYWdlSGFuZGxlcignY3JlYXRlVGV4dCcsIGFzeW5jICh0ZXh0KSA9PiB7XG4gIHJldHVybiBhd2FpdCBzYWZlbHlFeGVjdXRlQXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdQbHVnaW4gY3JlYXRpbmcgdGV4dDonLCB0ZXh0KVxuXG4gICAgLy8gTG9hZCB0aGUgZGVmYXVsdCBmb250IGZpcnN0XG4gICAgYXdhaXQgZmlnbWEubG9hZEZvbnRBc3luYyh7IGZhbWlseTogJ0ludGVyJywgc3R5bGU6ICdSZWd1bGFyJyB9KVxuXG4gICAgLy8gQ3JlYXRlIGEgdGV4dCBub2RlIGluIEZpZ21hXG4gICAgY29uc3QgdGV4dE5vZGUgPSBmaWdtYS5jcmVhdGVUZXh0KClcbiAgICB0ZXh0Tm9kZS5jaGFyYWN0ZXJzID0gdGV4dFxuICAgIHRleHROb2RlLmZvbnRTaXplID0gMjRcbiAgICB0ZXh0Tm9kZS5maWxscyA9IFt7IHR5cGU6ICdTT0xJRCcsIGNvbG9yOiB7IHI6IDAsIGc6IDAsIGI6IDAgfSB9XVxuXG4gICAgLy8gQWRkIHRvIGN1cnJlbnQgcGFnZVxuICAgIGZpZ21hLmN1cnJlbnRQYWdlLmFwcGVuZENoaWxkKHRleHROb2RlKVxuXG4gICAgLy8gUG9zaXRpb24gaXQgaW4gdGhlIGNlbnRlciBvZiB0aGUgdmlld3BvcnRcbiAgICB0ZXh0Tm9kZS54ID0gZmlnbWEudmlld3BvcnQuY2VudGVyLnggLSB0ZXh0Tm9kZS53aWR0aCAvIDJcbiAgICB0ZXh0Tm9kZS55ID0gZmlnbWEudmlld3BvcnQuY2VudGVyLnkgLSB0ZXh0Tm9kZS5oZWlnaHQgLyAyXG5cbiAgICByZXR1cm4gYENyZWF0ZWQgdGV4dDogXCIke3RleHR9XCJgXG4gIH0sIHsgXG4gICAgc291cmNlOiAnY3JlYXRlX3RleHRfaGFuZGxlcicsIFxuICAgIG1lc3NhZ2VUeXBlOiAnY3JlYXRlVGV4dCcsXG4gICAgdGV4dENvbnRlbnQ6IHRleHQgXG4gIH0pXG59KVxuXG4vLyBBZGQgZXJyb3IgaGFuZGxlciBmb3IgVUkgbWVzc2FnZXNcblBMVUdJTl9DSEFOTkVMLnJlZ2lzdGVyTWVzc2FnZUhhbmRsZXIoJ2Vycm9yJywgYXN5bmMgKGVycm9yLCBjb250ZXh0KSA9PiB7XG4gIGNvbnNvbGUubG9nKCdSZWNlaXZlZCBlcnJvciBmcm9tIFVJOicsIGVycm9yLCBjb250ZXh0KVxuICAvLyBMb2cgdGhlIGVycm9yIGZyb20gVUkgc2lkZVxuICBoYW5kbGVNZXNzYWdlRXJyb3IoZXJyb3IsICd1aV9lcnJvcicpXG4gIHJldHVybiAnRXJyb3IgbG9nZ2VkJ1xufSlcbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwiQGZpZ21hL3BsdWdpbi10eXBpbmdzXCIgLz5cblxuaW1wb3J0IHsgUExVR0lOLCBVSSB9IGZyb20gJy4uL2NvbW1vbi9uZXR3b3JrcydcbmltcG9ydCB7IFBMVUdJTl9DSEFOTkVMLCBzdGFydFNlbGVjdGlvbkxpc3RlbmVyIH0gZnJvbSAnLi9pbmRleC5uZXR3b3JrJ1xuaW1wb3J0IHsgTmV0d29ya2VyIH0gZnJvbSAnbW9ub3JlcG8tbmV0d29ya2VyJ1xuaW1wb3J0IHsgaGFuZGxlUGx1Z2luQm9vdHN0cmFwLCBzYWZlbHlFeGVjdXRlQXN5bmMgfSBmcm9tICcuL2Vycm9ySGFuZGxlcidcblxuYXN5bmMgZnVuY3Rpb24gYm9vdHN0cmFwKCkge1xuICB0cnkge1xuICAgIC8vIEluaXRpYWxpemUgZXJyb3IgaGFuZGxpbmcgZmlyc3RcbiAgICBhd2FpdCBzYWZlbHlFeGVjdXRlQXN5bmMoYXN5bmMgKCkgPT4ge1xuICAgICAgTmV0d29ya2VyLmluaXRpYWxpemUoUExVR0lOLCBQTFVHSU5fQ0hBTk5FTClcbiAgICB9LCB7IHNvdXJjZTogJ25ldHdvcmtlcl9pbml0JyB9KVxuXG4gICAgYXdhaXQgc2FmZWx5RXhlY3V0ZUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIGZpZ21hLnNob3dVSShfX2h0bWxfXywge1xuICAgICAgICB3aWR0aDogODAwLFxuICAgICAgICBoZWlnaHQ6IDY1MCxcbiAgICAgICAgdGl0bGU6ICdGaWdtYSBQbHVnaW4nLFxuICAgICAgfSlcbiAgICB9LCB7IHNvdXJjZTogJ3VpX2luaXQnIH0pXG5cbiAgICBjb25zb2xlLmxvZygnQm9vdHN0cmFwcGVkIEAnLCBOZXR3b3JrZXIuZ2V0Q3VycmVudFNpZGUoKS5uYW1lKVxuICAgIFxuICAgIGF3YWl0IHNhZmVseUV4ZWN1dGVBc3luYyhhc3luYyAoKSA9PiB7XG4gICAgICBQTFVHSU5fQ0hBTk5FTC5lbWl0KFVJLCAnaGVsbG8nLCBbJ1BsdWdpbiBpbml0aWFsaXplZCddKVxuICAgIH0sIHsgc291cmNlOiAnaW5pdGlhbF9tZXNzYWdlJyB9KVxuXG4gICAgYXdhaXQgc2FmZWx5RXhlY3V0ZUFzeW5jKGFzeW5jICgpID0+IHtcbiAgICAgIHN0YXJ0U2VsZWN0aW9uTGlzdGVuZXIoKVxuICAgIH0sIHsgc291cmNlOiAnc2VsZWN0aW9uX2xpc3RlbmVyJyB9KVxuXG4gICAgLy8gU2lnbmFsIHRoYXQgYm9vdHN0cmFwIGlzIGNvbXBsZXRlXG4gICAgUExVR0lOX0NIQU5ORUwuZW1pdChVSSwgJ3JlYWR5JywgW10pXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlUGx1Z2luQm9vdHN0cmFwKGVycm9yKVxuICAgIC8vIFN0aWxsIHRyeSB0byBzaG93IFVJIGV2ZW4gaWYgYm9vdHN0cmFwIGZhaWxzIHBhcnRpYWxseVxuICAgIHRyeSB7XG4gICAgICBmaWdtYS5zaG93VUkoX19odG1sX18sIHtcbiAgICAgICAgd2lkdGg6IDgwMCxcbiAgICAgICAgaGVpZ2h0OiA2NTAsXG4gICAgICAgIHRpdGxlOiAnRmlnbWEgUGx1Z2luIC0gRXJyb3IgTW9kZScsXG4gICAgICB9KVxuICAgIH0gY2F0Y2ggKGZhbGxiYWNrRXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ0NyaXRpY2FsIGJvb3RzdHJhcCBmYWlsdXJlOicsIGZhbGxiYWNrRXJyb3IpXG4gICAgfVxuICB9XG59XG5cbmJvb3RzdHJhcCgpXG4iXSwibmFtZXMiOlsiTmV0d29ya2VyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUksSUFBSSxPQUFPO0FBQ2YsSUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUUsR0FBRyxHQUFHLEVBQUUsWUFBWSxNQUFJLGNBQWMsTUFBSSxVQUFVLE1BQUksT0FBTyxFQUFDLENBQUUsSUFBSSxFQUFFLENBQUMsSUFBSTtBQUM3RyxJQUFJLElBQUksQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLEdBQUcsT0FBTyxLQUFLLFdBQVcsSUFBSSxLQUFLLEdBQUcsQ0FBQyxHQUFHO0FBQ2xFLElBQUksSUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLElBQUksUUFBUSxDQUFDLEdBQUcsTUFBTTtBQUN6QyxNQUFJLElBQUksQ0FBQyxNQUFNO0FBQ2IsUUFBSTtBQUNGLFFBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUFBLElBQ2IsU0FBUyxHQUFHO0FBQ1YsUUFBRSxDQUFDO0FBQUEsSUFDTDtBQUFBLEVBQ0YsR0FBRyxJQUFJLENBQUMsTUFBTTtBQUNaLFFBQUk7QUFDRixRQUFFLEVBQUUsTUFBTSxDQUFDLENBQUM7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
