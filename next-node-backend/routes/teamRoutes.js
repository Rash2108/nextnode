import express from "express";
import Team from "../models/Team.js";

const router = express.Router();

// Register team
router.post("/register", async (req, res) => {
  try {
    const { players } = req.body;
    const teamName = typeof req.body.teamName === "string" ? req.body.teamName.trim() : "";

    if (!teamName || !Array.isArray(players) || players.length !== 2) {
      return res.status(400).json({ message: "Invalid data" });
    }

    const existing = await Team.findOne({ teamName });
    if (existing) {
      return res.status(400).json({ message: "Team already exists" });
    }

    const newTeam = new Team({ ...req.body, teamName });
    await newTeam.save();

    res.status(201).json({ message: "Team registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all teams (admin)
router.get("/teams", async (req, res) => {
  const teams = await Team.find().sort({ createdAt: -1 });
  res.json(teams);
});

export default router;