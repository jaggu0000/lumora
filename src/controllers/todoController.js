import {
  addNewTodo,
  deleteExistingTodo,
  editExistingTodo,
  getAllTodoOfUser,
  markTodoAsCompleted,
} from "../services/todoServices.js";

//Create todo
export const addTodo = async (req, res) => {
  try {
    const { title, description, dueDate } = await addNewTodo({
      ...req.body,
      userId: req.auth.userId,
    });
    res.status(201).json({
      status: "Sucess",
      data: { title, description, dueDate },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Edit Todo
export const editTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    const { title, description, dueDate } = await editExistingTodo(
      req.body,
      todoId
    );
    res.status(201).json({
      status: "Success",
      data: { title, description, dueDate },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Delete Todo
export const deleteTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    await deleteExistingTodo(todoId);
    res.status(201).json({
      status: "Success",
      message: "Todo deleted successfully",
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Get all Todos of a user
export const getAllTodo = async (req, res) => {
  try {
    const todos = await getAllTodoOfUser(req.auth.userId);
    res.status(200).json({ success: true, data: todos });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Mark Todo as completed
export const completeTodo = async (req, res) => {
  try {
    const { todoId } = req.params;
    await markTodoAsCompleted(todoId);
	res.status(201).json({
      status: "Success",
      message: "Todo marked as completed",
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};
