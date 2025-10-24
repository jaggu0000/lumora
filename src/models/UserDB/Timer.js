import mongoose from "mongoose";
import { userDB } from "../../config/db.js";
import User from "./User.js";

const timerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  duration: { type: Number, required: true },
  startTime: { type: Date, default: Date.now }, // automatically set to current time
  endTime: { type: Date },
});

const Timer = userDB.model("Timer", timerSchema);

export default Timer;
