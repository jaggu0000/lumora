import Todo from "../models/UserDB/Todo.js";
import Task from "../models/UserDB/Todo.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

//Adds new todo
export const addNewTodo = async (data) => {
  const { userId, title, description, dueDate } = data;

  const newTodo = new Task({ userId, title, description, dueDate });
  const todo = await newTodo.save();
  if (!todo) throw new Error("Failed to create Todo");

  // Update UserMetadata
  const newUserMetadata = await UserMetadata.findOne({userId});
  if (!newUserMetadata) throw new Error("Failed to find user metadata");
  newUserMetadata.todos.push(todo._id);
  const userMetadata = await newUserMetadata.save();
  if (!userMetadata) throw new Error("Failed to create user metadata");
  
  return todo;
};


// Edit Todo
export const editExistingTodo = async (data, todoId) => {
    const todo = await Todo.findOne({ _id: todoId });
    if(!todo) throw new Error("404 Todo not Found");
    
    const { title, description, dueDate } = data;
    todo.title = title;
    todo.description = description;
    todo.dueDate = dueDate;

    const editedTodo = await todo.save();
    if(!editedTodo) throw new Error("Failed to edit Todo list");
    return editedTodo;
}


// Delete Todo
export const deleteExistingTodo = async (todoId) => {
  	// get the todo to read userId
  	const todo = await Todo.findById(todoId);
  	if (!todo) throw new Error("404 Todo not Found");

  	// remove reference from UserMetadata first
  	await deleteTodoReference(todo.userId, todo._id);

  	// then delete the todo
  	const deleted = await Todo.findByIdAndDelete(todo._id);
  	if (!deleted) throw new Error("Failed to delete Todo");
}

export const deleteTodoReference = async (userId, todoId) => {
	const userMetadata = await UserMetadata.findOne({ userId });
	if (!userMetadata) throw new Error("404 UserMetadata not Found");
	
	userMetadata.todos = userMetadata.todos.filter(
		(id) => id.toString() !== todoId.toString()
	);
	const newUserMetadata = await userMetadata.save();
	if (!newUserMetadata) throw new Error("Failed to update newUserMetadata todo reference");

}