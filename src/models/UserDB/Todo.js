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
		},
		dueDate: {
			type: Date,
		},
		isCompleted: {
			type: Boolean,
			default: false,
		},
		completedAt: {
			type: Date,
		}
	},
	{ timestamps: true }
);

const Todo = userDB.model("Todo", todoSchema);

export default Todo;
