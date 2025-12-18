import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";

import connectDB from "./db.js";
import userRoutes from "./routes/users.js";
import friendRoutes from "./routes/friends.js";
import Friend from "./models/Friend.js"; // adjust the path if necessary

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/friends", friendRoutes);

// WebSocket server
const wss = new WebSocketServer({ server });

// In-memory online users
const clients = new Map(); // userId -> ws

wss.on("connection", (ws) => {
  console.log("🟢 WS connected");

  ws.on("message", async (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch (err) {
      console.log("Invalid JSON:", msg);
      return;
    }

    console.log("Received WS message:", data);

    // Register user
    if (data.type === "REGISTER") {
      clients.set(data.userId, ws);
      console.log(`✅ User online: ${data.userId}`);
      return;
    }

    // Forward chat message only if users are friends
    if (data.type === "message") {
      const { fromUserId, toUserId } = data;

      try {
        // Check if they are friends
        const friendship = await Friend.findOne({
          $or: [
            { userId: fromUserId, friendId: toUserId },
            { userId: toUserId, friendId: fromUserId },
          ],
        });

        if (!friendship) {
          console.log(`❌ Users ${fromUserId} and ${toUserId} are not friends. Message blocked.`);
          return; // don't forward
        }

        // Send to recipient if online
        if (clients.has(toUserId)) {
          clients.get(toUserId).send(JSON.stringify(data));
        }

        // Echo back to sender
        if (clients.has(fromUserId)) {
          clients.get(fromUserId).send(JSON.stringify(data));
        }

      } catch (err) {
        console.error("Error checking friendship:", err);
      }
    }
  });

  ws.on("close", () => {
    for (const [key, value] of clients.entries()) {
      if (value === ws) clients.delete(key);
    }
    console.log("🔴 WS disconnected");
  });
});

// Start server
connectDB();
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
