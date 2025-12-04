import express from "express";
import { taskCreationValidation } from "../validators/todoValidator.js";
import { addTodo, completeTodo, deleteTodo, editTodo, getAllTodo } from "../controllers/todoController.js";
import { reportValidation } from "../validators/userValidator.js";
import { reportCommunity, reportUser } from "../controllers/userController.js";

const userRouter = express.Router();

// Task routes
userRouter
	.route("/todo")
	.post(taskCreationValidation, addTodo) // Create Todo
	.get(getAllTodo); // Get all Todos of a user
userRouter
	.route("/todo/:todoId")
	.put(taskCreationValidation, editTodo) // Edit Todo
	.delete(deleteTodo); // Delete Todo
userRouter.patch("/todo/completed/:todoId", completeTodo);
userRouter.post("/report-user/:communityId/:reportedUserId", reportValidation, reportUser);
userRouter.post("/report-community/:communityId", reportValidation, reportCommunity);

export default userRouter;
