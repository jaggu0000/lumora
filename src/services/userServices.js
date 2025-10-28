import User from "../models/UserDB/User.js";
import bcrypt from "bcrypt";
import {generateToken} from "../utils/tokenUtils.js"

// Creates a new user in the User database
export const addNewUser = async (data) => {
  const { username, email, password } = data;

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    email,
    password: hashPassword,
    role: "user",
  });

  const user = await newUser.save();
  if (!user) throw new Error("Failed to create user");

  return user;
};

//user login
export const loginUser = async(identifier, password) => {
  const user = await User.findOne({
    $or: [{email: identifier}, {username: identifier}],
  }).select("+password"); //explicitly include the password
  if (!user) throw new Error("Invalid Credentials");
  // console.log(user)

  //compare password
  const isMatch = await bcrypt.compare(password, user.password);
  console.log(isMatch)
  if(!isMatch) throw new Error("Wrong Password");

  //generate token
  const token = generateToken(user);
  return {user, token};
}

// Helper for validator
//Checks if username already exist
export const checkUsernameExistence = async (username) => {
  const existingUsername = await User.findOne({ username });
  return !!existingUsername;
};

// Helper for validator
//Checks if email already exist
export const checkEmailExistence = async (email) => {
  const existingEmail = await User.findOne({ email });
  return !!existingEmail;
};
