import { body, validationResult } from "express-validator";

export const taskCreationValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),

  body("description").optional().trim(),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date")
    .bail()
    .custom((value) => {
      const dueDate = new Date(value);
      const now = new Date();
      if (dueDate < now) {
        throw new Error("Due date must be in the future");
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
