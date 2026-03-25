import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  teamName: { type: String, unique: true },

  phase: String,
  authed: Boolean,
  attempts: Number,
  timeLeft: String,
  attemptStart: Number,
  chosen: [Number],
  timedOut: Boolean,
  finalCode: String,
  attemptLog: Array,
  finalScore: Number,
});

export default mongoose.model("Round1", sessionSchema);