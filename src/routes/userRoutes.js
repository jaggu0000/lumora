import express from "express";
import { taskCreationValidation } from "../validators/todoValidator.js";
import { addTodo } from "../controllers/todoController.js";

const userRouter = express.Router();

userRouter.post("/todo", taskCreationValidation, addTodo);

export default userRouter;
