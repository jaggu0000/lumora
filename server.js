import {
  connectAdminDB,
  connectCommunityDB,
  connectUserDB,
} from "./src/config/db.js";
import env from "./src/config/env.js";
import app from "./src/app.js"

// Connect to all databases
const connectDatabases = async () => {
  await connectUserDB();
  await connectCommunityDB();
  await connectAdminDB();
};

// Start server after database connections
const startServer = async () => {
  try {
    await connectDatabases();
    app.listen(env.SERVER_PORT, () => {
      console.log(`Server is running on http://localhost:${env.SERVER_PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

app.get("/", (req, res) => {
  res.send("Hello, Lumora!");
});
