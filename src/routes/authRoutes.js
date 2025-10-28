import express from "express";
import userRegistrationValidation, {userLoginValidation} from "../validators/authValidator.js";
import addUser, { login } from "../controllers/authController.js";

const authRouter = express.Router();

//Routing for users
authRouter.post("/signup", userRegistrationValidation, addUser);
authRouter.post("/login", userLoginValidation, login);

export default authRouter;
