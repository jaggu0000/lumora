import jwt from "jsonwebtoken"
import env from "../config/env.js"

export const generateToken = (user) => {
    return jwt.sign({
        id: user._id,
        username: user.username,
        role: user.role
    },
    env.JWT_SECRET_KEY,
    {expiresIn: "5hr"}
    );
};