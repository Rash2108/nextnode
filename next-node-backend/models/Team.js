import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  event: {
    type: String,
    default: "Next Node",
  },
  teamName: {
    type: String,
    required: true,
    unique: true,
  },
  players: [
    {
      name: { type: String, required: true },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Team", teamSchema);