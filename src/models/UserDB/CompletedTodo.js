import mongoose from "mongoose";
import { userDB } from "../../config/db.js";
import User from "./User.js";

const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

const CompletedTodo = userDB.model("CompletedTodo", todoSchema);

export default CompletedTodo;
