// backend/server.js
import "dotenv/config"; // Load environment variables
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http"; // *** NEW: Import http module for WebSocket server
import { WebSocketServer } from "ws"; // *** NEW: Import WebSocketServer
import * as pty from "node-pty"; // *** NEW: Import node-pty
import { v4 as uuidv4 } from "uuid"; // *** NEW: Import uuid for session IDs

import authRoutes from "./routes/authRoutes.js";
import codeExecutionRoutes from "./routes/codeExecution.js"; // This will now contain interactive logic too

const app = express();
const port = process.env.PORT || 5000;

// Create an HTTP server instance from your Express app
const server = http.createServer(app); // *** NEW: HTTP server for both Express and WebSockets

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// --- WebSocket Server Setup ---
const activeSessions = new Map(); // Map<sessionId, ptyProcess> to store active terminal processes
const outputBuffers = new Map();
const clientSockets = new Map(); // Map<sessionId, WebSocket>

const wss = new WebSocketServer({ server }); // *** NEW: Create WebSocket server linked to the HTTP server

/* wss.on('connection', (ws, req) => {
    // Extract session ID from the URL (e.g., /terminal?sessionId=XYZ)
    // The req.url includes the path and query parameters
    const url = new URL(req.url, `http://${req.headers.host}`); // Create a full URL object
    const sessionId = url.searchParams.get('sessionId');

    console.log(`WebSocket connection attempt with session ID: ${sessionId}`);

    const term = activeSessions.get(sessionId);

    console.log(`Retrieved terminal for session ${sessionId}:`, term);

    if (term) {
        term.onData((data) => {
        ws.send(data);
        });

        ws.on("message", (msg) => {
        term.write(msg);
        });
    } else {
        const buffered = outputBuffers.get(sessionId);
        if (buffered) {
        ws.send(buffered);
        }
        ws.send("[Session already ended]");
        ws.close();
    }
    

    if (!term) {
        console.warn(`WebSocket connection attempted with invalid or expired session ID: ${sessionId}`);
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid or expired session ID.' }));
            ws.close();
        }
        return;
    }

    console.log(`WebSocket connected for session ${sessionId}`);

    // Pipe program output (from pty) to WebSocket (to frontend)
    const onDataHandler = (data) => {
        
       if (ws.readyState === ws.OPEN) { // Corrected line
            ws.send(JSON.stringify({ type: 'output', data: data }));
        }
    };
    term.onData(onDataHandler); // *** node-pty uses onData

    // Pipe WebSocket input (from frontend) to program's stdin (to pty)
    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === 'input') {
                term.write(parsedMessage.data); // Write user input to the pseudo-terminal
            } else if (parsedMessage.type === 'resize') {
                term.resize(parsedMessage.cols, parsedMessage.rows); // Handle terminal resize
            }
        } catch (e) {
            console.error('Invalid WebSocket message:', message, e);
        }
    });

    ws.on('close', () => {
        console.log(`WebSocket disconnected for session ${sessionId}`);
        term.removeListener('data', onDataHandler); // Clean up listener to prevent memory leaks
        // Optionally, if you want to terminate the backend process when the frontend disconnects
        // term.kill(); // This will trigger the 'exit' event on term, which cleans up files
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for session ${sessionId}:`, error);
        term.removeListener('data', onDataHandler); // Also clean up on error
    });
}); */

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const sessionId = url.searchParams.get("sessionId");

  console.log(`WebSocket connection attempt for session: ${sessionId}`);

  const term = activeSessions.get(sessionId); // interactive (pty) session
  const bufferedOutput = outputBuffers.get(sessionId); // for non-interactive (spawn) sessions

  if (term && typeof term.onData === "function") {
    console.log(`✅ Interactive terminal session found for ${sessionId}`);

    clientSockets.set(sessionId, ws); // ✅ Keep this line

    const existing = outputBuffers.get(sessionId);
    if (existing && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "output", data: existing }));
    }

    const onDataHandler = (data) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "output", data }));
      }
    };

    term.onData(onDataHandler);

    ws.on("message", (message) => {
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "input") {
          term.write(parsed.data);
        } else if (parsed.type === "resize") {
          term.resize(parsed.cols, parsed.rows);
        }
      } catch (e) {
        console.error("Invalid message received:", message);
      }
    });

    ws.on("close", () => {
      console.log(`❌ WebSocket closed for session ${sessionId}`);
      term.removeListener("data", onDataHandler); // ✅ Correct way for node-pty
      /* term.kill(); // Optionally kill the pty process */
      activeSessions.delete(sessionId); // Free memory
    });

    ws.on("error", (err) => {
      console.error(`WebSocket error for session ${sessionId}:`, err);
      term.removeListener("data", onDataHandler); // ✅ Also fix here
    });
  } else if (bufferedOutput) {
    console.log(`📝 Sending buffered output for session ${sessionId}`);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "output", data: bufferedOutput }));
      ws.send(
        JSON.stringify({ type: "status", message: "[Session already ended]" })
      );
      ws.close();
      console.log(
        `🚪 WebSocket explicitly closed after sending buffered output for session ${sessionId}`
      );
    }
  } else {
    console.warn(`❌ No active or buffered session found for ${sessionId}`);
    if (ws.readyState === ws.OPEN) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Invalid or expired session ID.",
        })
      );
      ws.close();
    }
  }
});

// --- Express Routes ---

/* wss.on("connection", (ws, req) => {
  const urlParams = new URLSearchParams(req.url.split("?")[1]);
  const sessionId = urlParams.get("sessionId");

  console.log("WebSocket connection attempt with session ID:", sessionId);

  if (!sessionId) {
    ws.send("Missing session ID.");
    return ws.close();
  }

  const term = activeSessions.get(sessionId);

  if (term) {
    console.log("Retrieved terminal for session:", sessionId);
    
    // Pipe data to client
    term.onData((data) => {
      ws.send(data);
    });

    // Handle input from client
    ws.on("message", (msg) => {
      term.write(msg);
    });

    // Optional: Resize handling
    ws.on("resize", ({ cols, rows }) => {
      term.resize(cols, rows);
    });
    
  } else if (outputBuffers.has(sessionId)) {
    // Session has ended but output is available
    const bufferedOutput = outputBuffers.get(sessionId);
    console.log("Sending buffered output for ended session:", sessionId);
    ws.send(bufferedOutput + "\n[Session has ended]");
    return ws.close();
  } else {
    console.log("WebSocket connection attempted with invalid or expired session ID:", sessionId);
    ws.send("Session expired or invalid.");
    return ws.close();
  }
}); */

app.use("/api/auth", authRoutes);

// Pass the activeSessions map to your codeExecutionRoutes.
// This is crucial so your /start-terminal-session route can store the pty process.
app.use(
  "/api",
  (req, res, next) => {
    req.activeSessions = activeSessions; // Attach activeSessions to req object
    req.outputBuffers = outputBuffers; // Attach outputBuffers to req object
    req.clientSockets = clientSockets; // Attach clientSockets to req object
    next();
  },
  codeExecutionRoutes
);

// Start the HTTP and WebSocket server (listen on the 'server' instance, not 'app')
server.listen(port, () => {
  // *** NEW: Listen on 'server'
  console.log(`Server listening on port ${port}`);
  console.log(`WebSocket server running on ws://localhost:${port}/terminal`); // Note the path
});
