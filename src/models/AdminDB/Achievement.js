import mongoose from "mongoose";
import { adminDB } from "../../config/db.js";

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  iconUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i.test(v);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
});

const Achievement = adminDB.model("Achievement", achievementSchema);
export default Achievement;