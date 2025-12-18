const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// userId -> socket
const clients = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (data) => {
    const message = JSON.parse(data.toString());
    console.log("Received:", message);

    if (message.type === "REGISTER") {
      ws.userId = message.userId;
      clients.set(message.userId, ws);
      console.log(`User registered: ${message.userId}`);
    }

    if (message.type === "SEND_DIGIT") {
      const receiverSocket = clients.get(message.to);
      if (receiverSocket) {
        receiverSocket.send(
          JSON.stringify({
            type: "NEW_MESSAGE",
            from: message.from,
            digit: message.digit,
          })
        );
      }
    }

    if (message.type === "MESSAGE_READ") {
      const senderSocket = clients.get(message.to);
      if (senderSocket) {
        senderSocket.send(
          JSON.stringify({
            type: "MESSAGE_READ",
            from: message.from,
          })
        );
      }
    }
  });

  ws.on("close", () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      console.log(`User disconnected: ${ws.userId}`);
    }
  });
});

server.listen(3000, () => {
  console.log("Server running on ws://localhost:3000");
});
