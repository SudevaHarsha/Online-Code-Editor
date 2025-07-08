import { useState, useRef, useEffect, useCallback } from "react";
import { LANGUAGE_CONFIG } from "../constants";
import { useUser } from "./UserContext";
import { Terminal } from "xterm"; // Import Xterm.js
import { FitAddon } from "xterm-addon-fit"; // Import FitAddon
import { v4 as uuidv4 } from "uuid"; // Import uuid
import { useFile } from "./UseFileContext";

/* import {
  initializeTerminal,
  disposeTerminal,
  writeToTerminal,
  clearTerminal,
  getTerminalDimensions,
  getTerminalInstance,
  fitTerminal, // Needed for some internal checks if not passing directly
} from "../utils/terminalUtils.js"; // Import terminal utility functions */

import {
  initializeTerminal,
  disposeTerminal,
  writeToTerminal,
  fitTerminal,
  clearTerminal,
} from "../utils/terminalUtils.js"; // Import terminal utility functions

import {
  connectWebSocket,
  sendMessage,
  closeWebSocket,
  isWebSocketOpen,
  getWebSocketInstance, // For direct check in runCode etc.
} from "../utils/webSocketUtils.js";

const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      language: "javascript",
      fontSize: 16,
      theme: "vs-dark",
    };
  }

  const savedLanguage = localStorage.getItem("editor-language") || "javascript";
  const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";
  const savedFontSize = localStorage.getItem("editor-font-size") || 16;

  return {
    language: savedLanguage,
    theme: savedTheme,
    fontSize: Number(savedFontSize),
  };
};

export const useCodeEditor = () => {
  const initialState = getInitialState();
  const { file } = useFile();
  const [language, setLanguage] = useState(initialState.language);
  const [theme, setTheme] = useState(initialState.theme);
  const [fontSize, setFontSize] = useState(initialState.fontSize);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [editor, setEditor] = useState(null); // Monaco type removed
  const [fileName, setFileName] = useState("");
  const [codeId, setCodeId] = useState("");
  const [executionResult, setExecutionResult] = useState(null); // CodeEditorState type removed
  const editorRef = useRef(null);

  // Terminal related states/refs
  const terminalRef = useRef(null); // Ref to the DOM element for Xterm.js
  /*     const wsRef = useRef(null); // WebSocket connection instance
  const termInstanceRef = useRef(null); // Xterm.js Terminal instance
  const fitAddonRef = useRef(null); // FitAddon instance
  const onDataDisposableRef = useRef(null); // To store the disposable object from term.onData */

  const termInstanceRef = useRef(null);
  const fitAddonRef = useRef(null);
  const onDataDisposableRef = useRef(null);
  const wsRef = useRef(null);

  /* const [isRunning, setIsRunning] = useState(false); */ // Overall execution status

  const { user } = useUser();

  const getCode = () => editorRef.current?.getValue() || "";

  const handleSetEditor = (editor) => {
    editorRef.current = editor;
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    if (savedCode) editor.setValue(savedCode);
    setEditor(editor);
  };

  const handleSetTheme = (newTheme) => {
    localStorage.setItem("editor-theme", newTheme);
    setTheme(newTheme);
  };

  const handleFileName = (fileName) => {
    localStorage.setItem("file-name", fileName);
    setFileName(fileName);
  };

  const handleCodeId = (codeId) => {
    localStorage.setItem("code-id", codeId);
    setCodeId(codeId);
  };

  const handleSetFontSize = (newFontSize) => {
    localStorage.setItem("editor-font-size", newFontSize.toString());
    setFontSize(newFontSize);
  };

  const handleSetLanguage = (newLanguage) => {
    const currentCode = editorRef.current?.getValue();
    if (currentCode) {
      localStorage.setItem(`editor-code-${language}`, currentCode);
    }

    localStorage.setItem("editor-language", newLanguage);

    setLanguage(newLanguage);
    setOutput("");
    setError(null);
  };

  const getTerminalInstance = () => termInstanceRef.current;

  const getTerminalDimensions = () => {
    if (termInstanceRef.current) {
      return {
        cols: termInstanceRef.current.cols,
        rows: termInstanceRef.current.rows,
      };
    }
    return { cols: 80, rows: 30 };
  };

  /* const runCode = async () => {
    const code = getCode();

    if (!code) {
      setError("Please enter some code");
      return;
    }

    setIsRunning(true);
    setError(null);
    setOutput("");

    
    try {
      const response = await fetch("https://online-code-editor-backend-3ehb.onrender.com/api/execute", {
        // Replace with your backend URL
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": user?.token
        },
        body: JSON.stringify({
          language: language,
          code: code,
          input: "",
        }),
      });

      const data = await response.json();

      console.log("data back from backend:", data);

      if (data.error) {
        setError(data.error);
        setExecutionResult({ code, output: "", error: data.error });
        return;
      }
      const output = data.output.trim();

      setOutput(output);
      setError(null);
      setExecutionResult({ code, output, error: null });
    } catch (error) {
      console.log("Error running code:", error);
      setError("Error running code");
      setExecutionResult({ code, output: "", error: "Error running code" });
    } finally {
      setIsRunning(false);
    }
  }; */

  /*   const runCode = async () => {
    setIsRunning(true); // Set running status
    if (termInstanceRef.current) {
      termInstanceRef.current.reset(); // Clear terminal content
      termInstanceRef.current.write(
        "Connecting to backend terminal...\r\n\r\n"
      );
    }

    // Close any existing WebSocket connection before starting a new one
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null; // Clear ref
    }

    const code = getCode();
    if (!code) {
      if (termInstanceRef.current)
        termInstanceRef.current.write(
          "\x1b[31mError: Please enter some code.\x1b[0m\r\n"
        );
      setIsRunning(false);
      return;
    }

    const payload = {
      language: language,
      code: code,
    };

    try {
      // Step 1: Request a new session ID from the backend via HTTP POST
      const response = await fetch(
        "https://online-code-editor-backend-3ehb.onrender.com/api/start-terminal-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: user?.token ? `Bearer ${user.token}` : "", // Use actual user token
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      // Check for HTTP response errors
      if (!response.ok) {
        throw new Error(data.error || "Failed to start session on backend.");
      }

      const { sessionId } = data;

      if (!sessionId) {
        throw new Error("Session ID not received from backend.");
      } else {
        console.log("Received session ID from backend:", sessionId);
      }

      // Step 2: Establish WebSocket connection using the received sessionId
      const ws = new WebSocket(
        `ws://localhost:5000/terminal?sessionId=${sessionId}`
      );
      wsRef.current = ws; // Store the WebSocket instance in a ref

      // WebSocket event handlers
      ws.onopen = () => {
        console.log("WebSocket connection established.");
        if (termInstanceRef.current) {
          termInstanceRef.current.write(
            "\x1b[32mConnected to backend terminal!\x1b[0m\r\n\r\n"
          );
          // Send initial terminal size to backend so pty process can adapt
          if (fitAddonRef.current) {
            fitAddonRef.current.fit(); // Re-fit in case window resized while connecting
            ws.send(
              JSON.stringify({
                type: "resize",
                cols: termInstanceRef.current.cols,
                rows: termInstanceRef.current.rows,
              })
            );
          }
        }
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
              termInstanceRef.current.write(
                `\r\n\x1b[36m${message.message}\x1b[0m\r\n`
              );
              break;

            case "error":
              termInstanceRef.current.write(
                `\r\n\x1b[31mError: ${message.message}\x1b[0m\r\n`
              );
              setIsRunning(false);
              if (wsRef.current) wsRef.current.close();
              break;

            case "executionComplete":
              setIsRunning(false);

            default:
              termInstanceRef.current.write(
                `\r\n\x1b[33m[Unknown message type: ${message.type}]\x1b[0m\r\n`
              );
          }
        } catch (e) {
          console.error("Error parsing WebSocket message:", e, event.data);
          if (termInstanceRef.current) {
            termInstanceRef.current.write(
              `\r\n\x1b[31mFailed to parse server message.\x1b[0m\r\n`
            );
          }
        }
      };

      ws.onclose = () => {
        console.log("Terminal session closed.");
        if (termInstanceRef.current) {
          termInstanceRef.current.write(
            "\r\n\x1b[36mTerminal session closed.\x1b[0m\r\n"
          );
        }
        setIsRunning(false);
        wsRef.current = null; // Clear WebSocket ref
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (termInstanceRef.current) {
          termInstanceRef.current.write(
            `\r\n\x1b[31mTerminal connection error: ${
              error.message || "Unknown error"
            }\x1b[0m\r\n`
          );
        }
        setIsRunning(false);
      };
    } catch (error) {
      const errorMessage = error.message || "Unknown error.";
      console.error("Error initiating session:", error);
      if (termInstanceRef.current) {
        termInstanceRef.current.write(
          `\r\n\x1b[31mFailed to start session: ${errorMessage}\x1b[0m\r\n`
        );
      }
      setIsRunning(false);
    }
  }; */

  // --- Effect to initialize Xterm.js on component mount ---
  /*  useEffect(() => {
    // Initialize Xterm.js only once when the component mounts
    // Check terminalRef.current to ensure the DOM element is available
    // Check !termInstanceRef.current to ensure Xterm.js is not already initialized
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
      term.open(terminalRef.current); // Attach terminal to the DOM element
      fitAddon.fit();

      termInstanceRef.current = term; // Store the terminal instance
      fitAddonRef.current = fitAddon; // Store the fit addon instance

      // Handle window resize events to re-fit the terminal
      // Use a stable reference to term.cols and term.rows
      const handleResize = () => {
        if (fitAddonRef.current && termInstanceRef.current) {
          fitAddonRef.current.fit();
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: "resize",
                cols: termInstanceRef.current.cols, // Use cols from actual term instance
                rows: termInstanceRef.current.rows, // Use rows from actual term instance
              })
            );
          }
        }
      };
      window.addEventListener("resize", handleResize);

      // Handle user data input (keyboard presses) in the terminal
      const handleTermData = (data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "input", data: data }));
        }
      };
      term.onData(handleTermData);

      // Initial welcome messages in the terminal
      term.write("Welcome to the Online Code Runner Terminal!\r\n");
      term.write(
        'Type your code in the editor and click "Run Code" to start an interactive session.\r\n'
      );
      term.write("Output and prompts will appear here.\r\n\r\n");
    }

    // --- Cleanup function for when the component unmounts ---
    return () => {
      // Close WebSocket if open
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Dispose Xterm.js instance to free resources
      if (termInstanceRef.current) {
        termInstanceRef.current.dispose();
        termInstanceRef.current = null;
      }
      // Remove the resize event listener
      // IMPORTANT: Remove the specific named function, not an anonymous one
      // window.removeEventListener('resize', handleResize); // This needs handleResize to be defined outside or memoized
    };
  }, [language, theme, file]); // Depend on language/theme to re-initialize terminal if they change */

  /* // --- Main Effect for Xterm.js lifecycle and reactivity to file/language changes ---
  useEffect(() => {
    // --- Cleanup function for previous terminal instance ---
    if (termInstanceRef.current) {
      console.log("Disposing existing terminal for re-initialization...");
      // Dispose the disposable for onData listener
      if (onDataDisposableRef.current) {
        onDataDisposableRef.current.dispose();
        onDataDisposableRef.current = null;
      }
      termInstanceRef.current.dispose(); // Dispose the Xterm.js instance
      termInstanceRef.current = null;
      fitAddonRef.current = null;
      window.removeEventListener("resize", handleResize); // Ensure old resize listener is removed
    }
    // --- Close any active WebSocket for a clean slate ---
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRunning(false); // Reset running status on re-init

    // --- Initialize new terminal instance ---
    if (terminalRef.current) {
      console.log(
        `Initializing new terminal for file ${
          file?.fileName || "untitled"
        } (ID: ${file?.codeId || "new"}) and language ${language}`
      );
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

      // Crucial: Only call fit() after the terminal is open and potentially rendered
      // Using a short delay to ensure DOM is ready can sometimes help.
      // A more robust solution might use an IntersectionObserver or a custom event from Xterm.js.
      // For now, let's just ensure it's called *after* open.
      try {
        fitAddon.fit();
      } catch (fitError) {
        console.error("Error during fitAddon.fit():", fitError);
        // This indicates the terminal might not be fully ready for layout calculation
        // You might need a slight setTimeout here, or re-evaluate component lifecycle.
      }

      termInstanceRef.current = term;
      fitAddonRef.current = fitAddon;

      // Welcome messages
      term.write(
        `Welcome to the Online Code Runner Terminal for ${language.toUpperCase()}!\r\n`
      );
      term.write(`File: ${file?.fileName || "Untitled"}\r\n`);
      term.write(
        'Type your code in the editor and click "Run Code" to start an interactive session.\r\n'
      );
      term.write("Output and prompts will appear here.\r\n\r\n");

      // Attach onData listener and store its disposable
      const handleTermData = (data) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "input", data: data }));
        }
      };
      onDataDisposableRef.current = term.onData(handleTermData); // Store the disposable

      // Re-add resize listener for the new terminal instance
      window.addEventListener("resize", handleResize);
    }

    // The return function of this useEffect runs on component unmount,
    // or just before the effect re-runs due to dependency changes.
    // The cleanup logic at the top of this effect already handles re-runs.
    // This return is primarily for the final unmount.
    return () => {
      if (onDataDisposableRef.current) {
        onDataDisposableRef.current.dispose();
        onDataDisposableRef.current = null;
      }
      if (termInstanceRef.current) {
        termInstanceRef.current.dispose();
        termInstanceRef.current = null;
      }
      if (fitAddonRef.current) {
        fitAddonRef.current = null;
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [terminalRef.current, language, file?.codeId, file?.fileName]); // Dependencies: DOM ref, language, file ID, file name

  // Global resize handler for Xterm.js (defined outside to ensure stable reference)
    const handleResize = () => {
    if (fitAddonRef.current && termInstanceRef.current) {
      try {
        fitAddonRef.current.fit();
      } catch (fitError) {
        console.error("Error during resize fitAddon.fit():", fitError);
      }
      // Only send resize to backend if WS is open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "resize",
            cols: termInstanceRef.current.cols,
            rows: termInstanceRef.current.rows,
          })
        );
      }
    }
  }; */

  // --- High-level runCode function ---
  const runCode = async () => {
    setIsRunning(true);
    clearTerminal(termInstanceRef); // Uses utility
    writeToTerminal("Connecting to backend terminal...\r\n\r\n");

    closeWebSocket(); // Uses utility

    const code = getCode();
    if (!code) {
      writeToTerminal("\x1b[31mError: Please enter some code.\x1b[0m\r\n");
      setIsRunning(false);
      return;
    }

    const { cols, rows } = getTerminalDimensions(); // Uses utility

    const payload = {
      language: language,
      code: code,
      cols: cols,
      rows: rows,
    };

    try {
      const response = await fetch(
        "https://online-code-editor-backend-3ehb.onrender.com/api/start-terminal-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: user?.token ? `Bearer ${user.token}` : "",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start session on backend.");
      }

      const { sessionId } = data;

      if (!sessionId) {
        throw new Error("Session ID not received from backend.");
      } else {
        console.log("Received session ID from backend:", sessionId);
      }

      // Define callbacks for WebSocketManager
      const wsCallbacks = {
        onOpen: () => {
          console.log(
            "WebSocket connection established (via CodeEditorContext)."
          );
          writeToTerminal(
            "\x1b[32mConnected to backend terminal!\x1b[0m\r\n\r\n"
          );
        },
        onMessage: (message) => {
          switch (message.type) {
            case "output":
              writeToTerminal(message.data);
              break;
            case "status":
              writeToTerminal(`\r\n\x1b[36m${message.message}\x1b[0m\r\n`);
              break;
            case "error":
              writeToTerminal(
                `\r\n\x1b[31mError: ${message.message}\x1b[0m\r\n`
              );
              setIsRunning(false);
              closeWebSocket();
              break;
            case "executionComplete":
              setIsRunning(false);
              break;
            default:
              writeToTerminal(
                `\r\n\x1b[33m[Unknown message type: ${message.type}]\x1b[0m\r\n`
              );
          }
        },
        onClose: () => {
          console.log("Terminal session closed (via CodeEditorContext).");
          writeToTerminal("\r\n\x1b[36mTerminal session closed.\x1b[0m\r\n");
          setIsRunning(false);
        },
        onError: (error) => {
          console.error("WebSocket error (via CodeEditorContext):", error);
          writeToTerminal(
            `\r\n\x1b[31mTerminal connection error: ${
              error.message || "Unknown error"
            }\x1b[0m\r\n`
          );
          setIsRunning(false);
        },
      };

      connectWebSocket(sessionId, termInstanceRef, wsCallbacks); // Connect WebSocket using utility
    } catch (error) {
      const errorMessage = error.message || "Unknown error.";
      console.error("Error initiating session:", error);
      writeToTerminal(
        `\r\n\x1b[31mFailed to start session: ${errorMessage}\x1b[0m\r\n`
      );
      setIsRunning(false);
    }
  };

  // --- Global resize handler for Xterm.js (defined here for a stable reference) ---
  // This function will be passed to window.addEventListener
  const handleWindowResize = () => {
    // Ensure getTerminalDimensions and isWebSocketOpen actually use the GLOBAL instances
    // managed by terminalUtils and webSocketUtils.
    if (getTerminalInstance() && getTerminalDimensions()) {
      // Check if terminal is active first
      const { cols, rows } = getTerminalDimensions();
      if (isWebSocketOpen()) {
        sendMessage({ type: "resize", cols, rows });
      }
    }
  };

  // --- useEffect for Xterm.js lifecycle and reactivity to file/language changes ---
  const handleResize = () => {
    fitTerminal(termInstanceRef, fitAddonRef);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "resize",
          cols: termInstanceRef.current.cols,
          rows: termInstanceRef.current.rows,
        })
      );
    }
  };

  const handleTerminalInput = (data) => {
    sendMessage({
      type: "input",
      data,
    });
  };

  useEffect(() => {
    console.log("=== useEffect for terminal triggered ===");

    // --- CLEANUP PREVIOUS ---
    disposeTerminal(termInstanceRef, fitAddonRef, onDataDisposableRef);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
      wsRef.current = null;
    }
    window.removeEventListener("resize", handleResize);
    setIsRunning(false);

    // --- INIT NEW TERMINAL ---
    if (terminalRef.current) {
      initializeTerminal(
        terminalRef,
        handleTerminalInput,
        termInstanceRef,
        fitAddonRef,
        onDataDisposableRef
      );

      writeToTerminal(
        termInstanceRef,
        `Welcome to Online Runner for ${language.toUpperCase()}\r\n`
      );
      writeToTerminal(
        termInstanceRef,
        `File: ${file?.fileName || "Untitled"}\r\n`
      );
      writeToTerminal(
        termInstanceRef,
        'Type code and click "Run Code" to start.\r\n'
      );

      window.addEventListener("resize", handleResize);
      console.log("Added resize listener.");
    }

    return () => {
      disposeTerminal(termInstanceRef, fitAddonRef, onDataDisposableRef);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close();
        wsRef.current = null;
      }
      window.removeEventListener("resize", handleResize);
      console.log("Cleanup done.");
    };
  }, [terminalRef.current, language, file?.codeId, file?.fileName]);

  return {
    language,
    theme,
    fontSize,
    output,
    isRunning,
    error,
    editor,
    executionResult,
    fileName,
    codeId,
    setCodeId: handleCodeId,
    setFileName: handleFileName,
    getCode,
    setEditor: handleSetEditor,
    setTheme: handleSetTheme,
    setFontSize: handleSetFontSize,
    setLanguage: handleSetLanguage,
    runCode,

    /*  wsRef,
    fitAddonRef,
    onDataDisposableRef,
    termInstanceRef, */
    getTerminalInstance,
    getTerminalDimensions,
    terminalRef, // Pass the ref to the DOM element
    termInstanceRef,
  };
};

/* export const getExecutionResult = () => {
    const { executionResult } = useCodeEditor();
    return executionResult;
}; */
