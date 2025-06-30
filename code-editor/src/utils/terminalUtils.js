// src/utils/terminalUtils.js
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

export const initializeTerminal = (
  terminalRef,
  handleTerminalInput,
  termInstanceRef,
  fitAddonRef,
  onDataDisposableRef
) => {
  if (!terminalRef || !terminalRef.current) {
    console.warn("terminalUtils: terminalRef.current is null.");
    return;
  }

  console.log("terminalUtils: Initializing new Xterm.js terminal.");

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

  try {
    term.open(terminalRef.current);
    console.log("terminalUtils: terminal opened.");
    fitAddon.fit();
  } catch (e) {
    console.error("terminalUtils: Error opening/fitting terminal:", e);
    term.dispose();
    return;
  }

  // Store instances in refs
  termInstanceRef.current = term;
  fitAddonRef.current = fitAddon;
  onDataDisposableRef.current = term.onData(handleTerminalInput);

  console.log("terminalUtils: Terminal initialized and onData attached.");
};


export const disposeTerminal = (
  termInstanceRef,
  fitAddonRef,
  onDataDisposableRef
) => {
  if (onDataDisposableRef?.current) {
    onDataDisposableRef.current.dispose();
    onDataDisposableRef.current = null;
  }
  if (termInstanceRef?.current) {
    console.log("terminalUtils: Disposing terminal.");
    termInstanceRef.current.dispose();
    termInstanceRef.current = null;
  }
  if (fitAddonRef) {
    fitAddonRef.current = null;
  }
};

export const writeToTerminal = (termInstanceRef, data) => {
  if (termInstanceRef?.current) {
    termInstanceRef.current.write(data);
  } else {
    console.warn("terminalUtils: write failed, terminalInstanceRef is null.");
  }
};

export const fitTerminal = (termInstanceRef, fitAddonRef) => {
  if (
    fitAddonRef?.current &&
    termInstanceRef?.current &&
    termInstanceRef.current.element
  ) {
    const parent = termInstanceRef.current.element.parentElement;
    if (!parent || parent.clientWidth < 5 || parent.clientHeight < 5) {
      console.warn("fitTerminal: parent has zero dimensions, retrying...");
      setTimeout(() => fitTerminal(termInstanceRef, fitAddonRef), 30);
      return false;
    }
    try {
      fitAddonRef.current.fit();
      console.log("terminalUtils: fitTerminal success.");
      return true;
    } catch (e) {
      console.error("fitTerminal error:", e);
    }
  } else {
    console.warn("fitTerminal: terminal or fitAddon not ready.");
  }
  return false;
};

export const clearTerminal = (terminalInstanceRef) => {
  if (terminalInstanceRef.current) {
    terminalInstanceRef.current.reset();
  }
};

/*
export const getTerminalDimensions = () => {
  if (terminalInstanceRef.current) {
    return {
      cols: terminalInstanceRef.current.cols,
      rows: terminalInstanceRef.current.rows,
    };
  }
  return { cols: 80, rows: 30 };
}; */

/* export const getTerminalInstance = () => terminalInstanceRef.current;
 */
