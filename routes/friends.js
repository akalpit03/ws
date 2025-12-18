import express from "express";
import Friend from "../models/Friend.js";

const router = express.Router();

/**
 * POST /friends/add
 * body: { userId, friendId }
 */
router.post("/add", async (req, res) => {
  try {
    const { userId, friendId } = req.body;

    if (userId === friendId)
      return res.status(400).json({ error: "Cannot add self" });

    await Friend.create([
      { user: userId, friend: friendId },
      { user: friendId, friend: userId },
    ]);

    res.json({ success: true });
  } catch (err) {
    if (err.code === 11000) {
      return res.json({ success: true });
    }
    res.status(500).json({ error: "Add friend failed" });
  }
});

/**
 * GET /friends/:userId
 */
router.get("/:userId", async (req, res) => {
  const friends = await Friend.find({ user: req.params.userId })
    .populate("friend", "name phone");

  res.json(friends.map((f) => f.friend));
});

export default router;
