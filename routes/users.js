import express from "express";
import User from "../models/User.js";

const router = express.Router();

/**
 * POST /users/register
 */
router.post("/register", async (req, res) => {
  try {
    const { name, phone } = req.body;

    let user = await User.findOne({ phone });
    if (user) {
      return res.json(user); // idempotent
    }

    user = await User.create({ name, phone });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * GET /users/search?phone=xxxx
 */
router.get("/search", async (req, res) => {
  const { phone } = req.query;

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({});

  res.json(user);
});

export default router;
