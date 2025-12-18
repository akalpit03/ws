import express from "express";
import http from "http";import cors from "cors";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";

import connectDB from "./db.js";
import userRoutes from "./routes/users.js";
import friendRoutes from "./routes/friends.js";
dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRoutes);

app.use("/friends", friendRoutes);


const wss = new WebSocketServer({ server });

// In-memory online users
const clients = new Map(); // userId -> ws

wss.on("connection", (ws) => {
  console.log("🟢 WS connected");

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "REGISTER") {
      clients.set(data.userId, ws);
      console.log(`✅ User online: ${data.userId}`);
    }
  });

  ws.on("close", () => {
    for (const [key, value] of clients.entries()) {
      if (value === ws) clients.delete(key);
    }
    console.log("🔴 WS disconnected");
  });
});

// Start
connectDB();
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
