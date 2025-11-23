import { body, validationResult } from "express-validator";

export const userReportValidation = [
	body("reasonType")
		.trim()
		.notEmpty()
		.withMessage("Reason type is required")
		.bail()
		.isIn(["Spam", "Harassment", "Inappropriate Content", "Impersonation", "Hate speech or Discrimination", "Other"])
        .withMessage("Invalid membership mode"),

    body("reason")
        .trim()
        .notEmpty()
        .withMessage("Reason is required")
        .bail()
        .isLength({ max: 500 })
        .withMessage("Reason must be less than 500 characters long"),

    (req, res, next) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            next();
        },
];
