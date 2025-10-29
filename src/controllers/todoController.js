import { addNewTodo } from "../services/todoServices.js";

//Create todo
export const addTodo = async (req, res) => {
  try {
    const { title, description, dueDate } = await addNewTodo({...req.body, userId: req.auth.userId});
    res
      .status(201)
      .json({ status: "Sucess", data: { title, description, dueDate } });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};
