import express from "express";
import { taskCreationValidation } from "../validators/todoValidator.js";
import { addTodo, editTodo } from "../controllers/todoController.js";

const userRouter = express.Router();

// Task routes
userRouter.post("/todo", taskCreationValidation, addTodo);
userRouter.put("/todo/:todoId", taskCreationValidation, editTodo);

export default userRouter;
