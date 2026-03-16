import mongoose from "mongoose";
import { adminDB } from "../../config/db.js";

const ruleSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	conditions: {
		type: [String],
		required: true,
	},
	actions: {
		type: [String],
		required: true,
	},
});

const Rule = adminDB.model("Rule", ruleSchema);
export default Rule;
