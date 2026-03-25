import express from "express";
import Round2 from "../models/Round2.js";

const router = express.Router();

router.post("/round2", async (req, res) => {
  try {
    const { teamName, phase, timeLeft, overallTimeUsed, score, solvedQuestions, finalSolved } = req.body;

    let session = await Round2.findOne({ teamName });

    if (session) {
      if (phase !== undefined) session.phase = phase;
      if (timeLeft !== undefined) session.timeLeft = timeLeft;
      if (overallTimeUsed !== undefined) session.overallTimeUsed = overallTimeUsed;
      if (score !== undefined) session.score = score;
      if (solvedQuestions !== undefined) session.solvedQuestions = solvedQuestions;
      if (finalSolved !== undefined) session.finalSolved = finalSolved;
    } else {
      session = new Round2({
        teamName,
        phase: phase || "gate",
        timeLeft: timeLeft || "30:00",
        overallTimeUsed: overallTimeUsed || "00:00",
        score: score || 0,
        solvedQuestions: solvedQuestions || [],
        finalSolved: finalSolved || false,
      });
    }

    await session.save();
    res.status(200).json(session);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
