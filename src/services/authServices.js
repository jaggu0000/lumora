import User from "../models/UserDB/User.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/tokenUtils.js";
import UserMetadata from "../models/UserDB/UserMetadata.js";

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

	const newUserMetadata = new UserMetadata({
		userId: user._id,
	});

	const userMetadata = await newUserMetadata.save();
	if (!userMetadata) throw new Error("Failed to create user metadata");

	return user;
};

//user login
export const loginUser = async (identifier, password) => {
	const user = await User.findOne({
		$or: [{ email: identifier }, { username: identifier }],
	}).select("+password"); //explicitly include the password
	if (!user) throw new Error("A user doesn't exist with this email or username");

	//compare password
	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) throw new Error("Wrong Password");

	//generate token
	const token = generateToken(user);

	// Remove password from response
	user.password = undefined;

	return { user, token };
};

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
