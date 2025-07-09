import { writeToTerminal } from "./terminalUtils";

let ws = null;
let onMessageCallback = null;
let onOpenCallback = null;
let onCloseCallback = null;
let onErrorCallback = null;

/**
 * Utility function to get terminal dimensions from a termInstanceRef
 */
const getTerminalDimensions = (termInstanceRef) => {
  if (termInstanceRef?.current) {
    return {
      cols: termInstanceRef.current.cols,
      rows: termInstanceRef.current.rows,
    };
  }
  return { cols: 80, rows: 30 }; // fallback
};

/**
 * Establish a WebSocket connection
 */
export const connectWebSocket = (
  sessionId,
  termInstanceRef,
  { onOpen, onMessage, onClose, onError }
) => {
  closeWebSocket();

  console.log(`Attempting to connect WebSocket for session: ${sessionId}`);
  ws = new WebSocket(`https://online-code-editor-backend-3ehb.onrender.com/terminal?sessionId=${sessionId}`);

  onOpenCallback = onOpen;
  onMessageCallback = onMessage;
  onCloseCallback = onClose;
  onErrorCallback = onError;

  ws.onopen = () => {
    console.log("WebSocket connected.");
    const { cols, rows } = getTerminalDimensions(termInstanceRef);
    sendMessage({ type: "resize", cols, rows });
    onOpenCallback && onOpenCallback();
  };

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      if (message.type === "output") {
        writeToTerminal(termInstanceRef, message.data);
      }
    } catch (e) {
      writeToTerminal(termInstanceRef, "Failed to parse server message\n");
    }
  };

  ws.onclose = (event) => {
    console.log("WebSocket closed.", event.code, event.reason);
    onCloseCallback && onCloseCallback(event);
    ws = null;
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    onErrorCallback && onErrorCallback(error);
  };

  return ws;
};

export const sendMessage = (message) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  } else {
    console.warn("WebSocket not open. Message not sent:", message);
  }
};

export const closeWebSocket = () => {
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    console.log("Closing WebSocket connection.");
    ws.close();
  }
  onOpenCallback = null;
  onMessageCallback = null;
  onCloseCallback = null;
  onErrorCallback = null;
  ws = null;
};

export const isWebSocketOpen = () => {
  return ws && ws.readyState === WebSocket.OPEN;
};

export const getWebSocketInstance = () => {
  return ws;
};
