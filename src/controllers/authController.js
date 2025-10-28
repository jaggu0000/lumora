import { addNewUser, loginUser } from "../services/authServices.js";

// User Signup
const addUser = async (req, res, next) => {
  const { username, email, password, role } = await addNewUser(req.body);
  res
    .status(201)
    .json({ status: "Sucess", data: { username, email, password, role } });
};

//user Login
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const { user, token } = await loginUser(identifier, password);
    res.status(201).json({
      success: true,
      data: {
        username: user.username,
        email: user.email,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export default addUser;
