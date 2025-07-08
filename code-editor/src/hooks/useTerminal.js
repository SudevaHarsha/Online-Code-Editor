// hooks/useTerminal.js
import { useRef, useEffect, useCallback } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { useCodeEditor } from "../context/codeEditor";

export const useTerminal = ({ language, user }) => {
  const terminalRef = useRef(null);
  const termInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const {wsRef} = useCodeEditor();

  const initializeTerminal = useCallback(() => {
    if (terminalRef.current && !termInstanceRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: "monospace",
        fontSize: 14,
        theme: {
          background: "#1e1e2e",
          foreground: "#cccccc",
          cursor: "#cccccc",
          selection: "#222222",
        },
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;

      // Resize listener
      const handleResize = () => {
        fitAddonRef.current?.fit();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "resize",
            cols: term.cols,
            rows: term.rows
          }));
        }
      };
      window.addEventListener("resize", handleResize);
      term.onData(data => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "input", data }));
        }
      });

      term.write("Welcome to the Online Code Runner Terminal!\r\n");
      term.write('Type your code and click "Run Code". Output appears here.\r\n\r\n');

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        wsRef.current?.close();
        term.dispose();
        termInstanceRef.current = null;
        wsRef.current = null;
      };
    }
  }, []);

  const runTerminalSession = async (code, language) => {
    if (!code || !termInstanceRef.current) return;

    termInstanceRef.current.reset();
    termInstanceRef.current.write("Connecting to backend terminal...\r\n\r\n");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const response = await fetch("https://online-code-editor-dmo6.onrender.com/api/start-terminal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: user?.token ? `Bearer ${user.token}` : "",
        },
        body: JSON.stringify({ language, code }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Session failed");
      const { sessionId } = data;

      const ws = new WebSocket(`ws://localhost:5000/terminal?sessionId=${sessionId}`);
      wsRef.current = ws;

      ws.onopen = () => {
        termInstanceRef.current.write("\x1b[32mConnected!\x1b[0m\r\n\r\n");
        fitAddonRef.current?.fit();
        ws.send(JSON.stringify({
          type: "resize",
          cols: termInstanceRef.current.cols,
          rows: termInstanceRef.current.rows,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (!termInstanceRef.current) return;

          switch (message.type) {
            case "output":
              termInstanceRef.current.write(message.data);
              break;
            case "status":
              termInstanceRef.current.write(`\r\n\x1b[36m${message.message}\x1b[0m\r\n`);
              break;
            case "error":
              termInstanceRef.current.write(`\r\n\x1b[31mError: ${message.message}\x1b[0m\r\n`);
              break;
            default:
              termInstanceRef.current.write(`\r\n\x1b[33m[Unknown message]\x1b[0m\r\n`);
          }
        } catch (e) {
          termInstanceRef.current.write("\r\n\x1b[31mFailed to parse server message.\x1b[0m\r\n");
        }
      };

      ws.onclose = () => {
        termInstanceRef.current.write("\r\n\x1b[36mTerminal closed.\x1b[0m\r\n");
      };

      ws.onerror = (err) => {
        termInstanceRef.current.write(`\r\n\x1b[31mError: ${err.message}\x1b[0m\r\n`);
      };
    } catch (err) {
      termInstanceRef.current.write(`\r\n\x1b[31m${err.message}\x1b[0m\r\n`);
    }
  };

  return {
    terminalRef,
    termInstanceRef,
    fitAddonRef,
    initializeTerminal,
    runTerminalSession,
  };
};
