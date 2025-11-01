import express from "express";
import { taskCreationValidation } from "../validators/todoValidator.js";
import { addTodo, deleteTodo, editTodo } from "../controllers/todoController.js";

const userRouter = express.Router();

// Task routes
userRouter.post("/todo", taskCreationValidation, addTodo);  // Create Todo
userRouter.route("/todo/:todoId")
    .put(taskCreationValidation, editTodo)                  // Edit Todo
    .delete(deleteTodo);                                    // Delete Todo

export default userRouter;
