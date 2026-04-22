import express from "express";
import { connectDatabases } from "./src/config/db.js";
import env from "./src/config/env.js";
import app from "./src/app.js";
import dns from 'dns'

dns.setServers(['1.1.1.1', '8.8.8.8'])

const server = express();
server.use("/api", app); // Assigning prefix

// Start server after database connections
const startServer = async () => {
	try {
		await connectDatabases();
		server.listen(env.SERVER_PORT, () => {
			console.log(`Server is running on http://localhost:${env.SERVER_PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
