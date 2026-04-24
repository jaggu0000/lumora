import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDatabases } from "./src/config/db.js";
import env from "./src/config/env.js";
import app from "./src/app.js";
import dns from 'dns'

dns.setServers(['1.1.1.1', '8.8.8.8'])
import { registerVideoSocket } from "./src/sockets/videoSocket.js";
import { registerChatSocket } from "./src/sockets/chatSocket.js";

const expressApp = express();
expressApp.use("/api", app);

const httpServer = createServer(expressApp);

const io = new Server(httpServer, {
	cors: {
		origin: env.CLIENT_URL,
		credentials: true,
		methods: ["GET", "POST"],
	},
});

registerVideoSocket(io);
registerChatSocket(io);

const startServer = async () => {
	try {
		await connectDatabases();
		httpServer.listen(env.SERVER_PORT, () => {
			console.log(`Server is running on http://localhost:${env.SERVER_PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();
