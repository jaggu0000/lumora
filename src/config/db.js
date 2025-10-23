import mongoose from "mongoose";
import env from "./env.js";

// Create separate connections for each database
export const userDB = mongoose.createConnection();
export const communityDB = mongoose.createConnection();
export const adminDB = mongoose.createConnection();

export const connectUserDB = async () => {
  try {
    await userDB.openUri(env.CONNECTION_STRING_USER);
    console.log("User database connected successfully");
  } catch (error) {
    console.error("Error connecting to the user database", error);
    process.exit(1);
  }
};

export const connectCommunityDB = async () => {
  try {
    await communityDB.openUri(env.CONNECTION_STRING_COMMUNITY);
    console.log("Community database connected successfully");
  } catch (error) {
    console.error("Error connecting to the community database", error);
    process.exit(1);
  }
};

export const connectAdminDB = async () => {
  try {
    await adminDB.openUri(env.CONNECTION_STRING_ADMIN);    
    console.log("Admin database connected successfully");
  } catch (error) {
    console.error("Error connecting to the admin database", error);
    process.exit(1);
  }
};

// Connect to all databases
export const connectDatabases = async () => {
  await connectUserDB();
  await connectCommunityDB();
  await connectAdminDB();
};