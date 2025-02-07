"use strict";
const express = require("express"); // Using CommonJS style import
const http = require("http");
const { WebSocketServer } = require("ws");
const { initialize, handleChatMode, handleAutoMode } = require("./chatbot");

(async function main() {
  try {
    const { agent, config } = await initialize();
    const app = express();
    const server = http.createServer(app);

    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws) => {
      console.log("Client connected");

      // Send initial connection message as JSON
      ws.send(
        JSON.stringify({
          type: "connection",
          content:
            "Welcome to Twitter Agentkit Chatbot.\n" +
            "Please select a mode:\n" +
            "Type 'chat' (or '1') for interactive chat mode, or 'auto' (or '2') for autonomous mode.",
          timestamp: new Date().toISOString(),
        })
      );

      let modeSelected = false;

      ws.on("message", async (data) => {
        try {
             const Raw = JSON.parse(data);
             
             
             const message=Raw.content.toString();
         

          if (!modeSelected) {
            if (message === "chat" || message === "1") {
              modeSelected = true;
              ws.send(
                JSON.stringify({
                  type: "message",
                  content: "Chat mode selected.",
                  timestamp: new Date().toISOString(),
                })
              );
              handleChatMode(ws, agent, config);
            } else if (message === "auto" || message === "2") {
              modeSelected = true;
              ws.send(
                JSON.stringify({
                  type: "message",
                  content: "Autonomous mode selected.",
                  timestamp: new Date().toISOString(),
                })
              );
              handleAutoMode(ws, agent, config);
            } else {
              ws.send(
                JSON.stringify({
                  type: "error",
                  content:
                    "Invalid mode. Please type 'chat' or 'auto' to select a mode.",
                  timestamp: new Date().toISOString(),
                })
              );
            }
          }
        } catch (error) {
          console.error("Error handling message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              content: "An error occurred while processing your request.",
              timestamp: new Date().toISOString(),
            })
          );
        }
      });

      ws.on("close", () => {
        console.log("Client disconnected");
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`WebSocket server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
})();
