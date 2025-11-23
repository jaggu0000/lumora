import express from "express";
import { taskCreationValidation } from "../validators/todoValidator.js";
import { addTodo, completeTodo, deleteTodo, editTodo, getAllTodo } from "../controllers/todoController.js";
import { userReportValidation } from "../validators/userValidator.js";
import { reportUser } from "../controllers/userController.js";

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
userRouter.put("/todo/completed/:todoId", completeTodo);
userRouter.post("/report-user/:communityId/:reportedUserId", userReportValidation, reportUser);

export default userRouter;
