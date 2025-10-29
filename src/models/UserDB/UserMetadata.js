import mongoose from "mongoose";
import { userDB } from "../../config/db.js";
import User from "./User.js";
import Todo from "./Todo.js";
import Timer from "./Timer.js";
import CompletedTodo from "./CompletedTodo.js";
import Community from "../CommunityDB/Community.js";
import Achievement from "../AdminDB/Achievement.js";

const userMetadataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  profile: {
    fullName: {
      type: String,
      trim: true,
      maxlength: [50, "Full name must be less than 50 characters long"],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [160, "Bio must be less than 160 characters long"],
    },
    avatarUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i.test(v);
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    location: {
      type: String,
      trim: true,
      maxlength: [30, "Location must be less than 30 characters long"],
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(\/[\w-]*)*\/?$/i.test(v);
        },
        message: (props) => `${props.value} is not a valid URL!`,
      },
    },
    social: {
      twitter: {
        type: String,
        trim: true,
        match: [/^@?(\w){1,15}$/, "Not a valid Twitter handle!"],
      },
      linkedin: {
        type: String,
        trim: true,
        match: [
          /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[A-z0-9_-]+\/?$/,
          "Not a valid LinkedIn URL!",
        ],
      },
      github: {
        type: String,
        trim: true,
        match: [
          /^(https?:\/\/)?(www\.)?github\.com\/[A-z0-9_-]+\/?$/,
          "Not a valid GitHub URL!",
        ],
      },
      instagram: {
        type: String,
        trim: true,
        match: [
          /^(https?:\/\/)?(www\.)?instagram\.com\/[A-z0-9_.]+\/?$/,
          "Not a valid Instagram URL!",
        ],
      },
    },
  },
  streakCount: {
    type: Number,
    default: 0,
    min: [0, "Streak count cannot be negative"],
  },
  maxStreakCount: {
    type: Number,
    default: 0,
    min: [0, "Max streak count cannot be negative"],
  },
  achievements: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Achievement",
    default: [],
  },
  joinedCommunities: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Community",
    default: [],
  },
  todos: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Todo",
    default: [],
  },
  timers: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Timer",
    default: [],
  },
  completedTodos: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "CompletedTodo",
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
});

// Create the model using the userDB connection
const UserMetadata = userDB.model("UserMetadata", userMetadataSchema);

export default UserMetadata;

