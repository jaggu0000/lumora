import { addNewTodo, editExistingTodo } from "../services/todoServices.js";

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

// Edit Todo
export const editTodo = async(req, res) => {
    try {
        const { todoId } = req.params;
        const { title, description, dueDate } = await editExistingTodo(req.body, todoId);
        res.status(201).json({
            status: "Success", data: { title, description, dueDate }
        });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
}
