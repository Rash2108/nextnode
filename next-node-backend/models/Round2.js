import mongoose from "mongoose";

const round2Schema = new mongoose.Schema({
  teamName: { type: String, unique: true },
  phase: String,
  timeLeft: String,
  overallTimeUsed: String,
  score: Number,
  solvedQuestions: Array,
  finalSolved: Boolean,
});

export default mongoose.model("Round2", round2Schema);
