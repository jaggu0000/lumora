import { body, validationResult } from "express-validator";
import {
  checkUsernameExistence,
  checkEmailExistence,
} from "../services/authServices.js";

const userRegistrationValidation = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .bail()
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long")
    .bail()
    .isLength({ max: 20 })
    .withMessage("Username must be less than 20 characters long")
    .bail()
    .matches(/^[a-z0-9_]+$/i)
    .withMessage("Username can only contain letters, numbers, and underscores")
    .bail()
    .custom(async (value) => {
      const exist = await checkUsernameExistence(value);
      if (exist) {
        throw new Error("Username already exists");
      }
      return true;
    }),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Invalid email address")
    .bail()
    .custom(async (value) => {
      const exist = await checkEmailExistence(value);
      if (exist) {
        throw new Error("Email already exists");
      }
      return true;
    }),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),

  body("confirmPassword")
    .trim()
    .notEmpty()
    .withMessage("Confirm password is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

export const userLoginValidation = [
  body("identifier")
  .notEmpty()
  .withMessage("Username or Email is Required!")
  .bail(),

  body("password")
  .notEmpty()
  .withMessage("Password is required!")
  .bail(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }
    next();
  },
];

export default userRegistrationValidation;
