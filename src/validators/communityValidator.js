import { body, validationResult } from "express-validator";
import { checkCommunityTagExistence } from "../services/communityServices.js";

export const communityCreationValidation = [
	body("communityTag")
		.trim()
		.notEmpty()
		.withMessage("Community Tag is required")
		.bail()
		.isLength({ min: 3 })
		.withMessage("Community Tag must be at least 3 characters long")
		.bail()
		.isLength({ max: 10 })
		.withMessage("Community Tag must be less than 10 characters long")
		.bail()
		.matches(/^[a-z0-9_-]+$/i)
		.withMessage(
			"Community Tag can only contain letters, numbers, underscores, and hyphens"
		)
        .bail()
        .custom(async (value, { req }) => {
            const exists = await checkCommunityTagExistence(value);
            if (exists) {
                throw new Error("Community Tag already exists");
            }
        }),

	body("communityName")
		.trim()
		.notEmpty()
		.withMessage("Community Name is required")
		.bail()
		.isLength({ min: 3 })
		.withMessage("Community Name must be at least 3 characters long")
		.bail()
		.isLength({ max: 30 })
		.withMessage("Community Name must be less than 30 characters long"),

	body("description")
		.trim()
		.notEmpty()
		.withMessage("Description is required")
		.bail()
		.isLength({ min: 10 })
		.withMessage("Description must be at least 10 characters long")
		.bail()
		.isLength({ max: 500 })
		.withMessage("Description must be less than 500 characters long"),

	body("communityRules")
		.trim()
		.isLength({ max: 1000 })
		.withMessage("Community rules must be less than 1000 characters long"),

	body("isPrivate")
		.trim()
		.notEmpty()
		.withMessage("isPrivate field is required")
		.bail()
		.isBoolean()
		.withMessage("isPrivate must be a boolean value"),

	body("membershipMode")
		.trim()
		.notEmpty()
		.withMessage("Membership mode is required")
		.bail()
		.isIn(["open", "invite-only", "request-to-join"])
		.withMessage("Invalid membership mode"),

	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	},
];
