import express from "express";
import Round1 from "../models/Round1.js";

const router = express.Router();

/**
 * ✅ 1. Create / Start Session
 */
router.post("/round1", async (req, res) => {
  try {
    const { phase, authed, attempts, timeLeft, attemptStart, chosen, timedOut, finalCode, attemptLog, finalScore } = req.body;
    const teamName = typeof req.body.teamName === "string" ? req.body.teamName.trim() : "";

    if (!teamName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    let session = await Round1.findOne({ teamName });

    if (session) {
      if (phase !== undefined) session.phase = phase;
      if (authed !== undefined) session.authed = authed;
      if (attempts !== undefined) session.attempts = attempts;
      if (timeLeft !== undefined) session.timeLeft = timeLeft;
      if (attemptStart !== undefined) session.attemptStart = attemptStart;
      if (chosen !== undefined) session.chosen = chosen;
      if (timedOut !== undefined) session.timedOut = timedOut;
      if (finalCode !== undefined) session.finalCode = finalCode;
      if (attemptLog !== undefined) session.attemptLog = attemptLog;
      if (finalScore !== undefined) session.finalScore = finalScore;
    } else {
      session = new Round1({
        teamName,
        phase: phase || "start",
        authed: authed !== undefined ? authed : true,
        attempts: attempts || 0,
        timeLeft: timeLeft !== undefined ? timeLeft : "30:00",
        attemptStart: attemptStart || Date.now(),
        chosen: chosen || [],
        timedOut: timedOut || false,
        finalCode: finalCode || "",
        attemptLog: attemptLog || [],
        finalScore: finalScore || 0,
      });
    }

    await session.save();

    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ 2. Get Session
 */
router.get("/round1/:teamName", async (req, res) => {
  try {
    const teamName = typeof req.params.teamName === "string" ? req.params.teamName.trim() : "";
    if (!teamName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const session = await Round1.findOne({ teamName });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ 3. Submit Attempt
 */
router.post("/round1/attempt", async (req, res) => {
  try {
    const { answer } = req.body;
    const rawTeamName = req.body.teamName || req.body.userId;
    const teamName = typeof rawTeamName === "string" ? rawTeamName.trim() : "";

    if (!teamName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const session = await Round1.findOne({ teamName });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.timedOut) {
      return res.status(400).json({ message: "Time is over" });
    }

    // Example correct answer (you can change)
    const correctAnswer = "NODE123";

    const isCorrect = answer === correctAnswer;

    session.attempts += 1;

    session.attemptLog.push({
      answer,
      isCorrect,
      time: Date.now(),
    });

    if (isCorrect) {
      session.phase = "completed";
      session.finalCode = answer;
    }

    await session.save();

    res.json({
      success: isCorrect,
      attempts: session.attempts,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * ✅ 4. Update Progress (choices / timer etc.)
 */
router.put("/round1/update", async (req, res) => {
  try {
    const { chosen, timeLeft, timedOut } = req.body;
    const rawTeamName = req.body.teamName || req.body.userId;
    const teamName = typeof rawTeamName === "string" ? rawTeamName.trim() : "";

    if (!teamName) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const session = await Round1.findOne({ teamName });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (chosen) session.chosen = chosen;
    if (timeLeft !== undefined) session.timeLeft = timeLeft;
    if (timedOut !== undefined) session.timedOut = timedOut;

    await session.save();

    res.json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;