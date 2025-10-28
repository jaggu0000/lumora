import express from "express";
import userRegistrationValidation, {userLoginValidation} from "../validators/userValidator.js";
import addUser, { login } from "../controllers/userController.js";

const authRouter = express.Router();

//Routing for users
authRouter.post("/signup", userRegistrationValidation, addUser);
authRouter.post("/login", userLoginValidation, login);

export default authRouter;
