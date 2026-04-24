const MAX_ROOM_SIZE = 4;

// roomId -> Map<socketId, { socketId, userId, username }>
const videoRooms = new Map();

function leaveRoom(socket, roomId, io) {
	const room = videoRooms.get(roomId);
	if (!room) return;

	room.delete(socket.id);
	socket.leave(roomId);

	if (room.size === 0) {
		videoRooms.delete(roomId);
	} else {
		io.to(roomId).emit("peer-left", { socketId: socket.id });
	}
}

export function registerVideoSocket(io) {
	io.on("connection", (socket) => {

		socket.on("join-video-room", ({ roomId, userId, username }) => {
			const room = videoRooms.get(roomId) ?? new Map();

			if (room.size >= MAX_ROOM_SIZE) {
				socket.emit("room-full");
				return;
			}

			const existingPeers = [...room.values()];

			room.set(socket.id, { socketId: socket.id, userId, username });
			videoRooms.set(roomId, room);
			socket.join(roomId);

			// Tell the new joiner who is already in the room
			socket.emit("existing-peers", existingPeers);

			// Tell existing members a new peer arrived
			socket.to(roomId).emit("peer-joined", {
				socketId: socket.id,
				userId,
				username,
			});
		});

		socket.on("offer", ({ to, offer }) => {
			io.to(to).emit("offer", { from: socket.id, offer });
		});

		socket.on("answer", ({ to, answer }) => {
			io.to(to).emit("answer", { from: socket.id, answer });
		});

		socket.on("ice-candidate", ({ to, candidate }) => {
			io.to(to).emit("ice-candidate", { from: socket.id, candidate });
		});

		socket.on("leave-video-room", ({ roomId }) => {
			leaveRoom(socket, roomId, io);
		});

		socket.on("disconnect", () => {
			for (const [roomId, room] of videoRooms) {
				if (room.has(socket.id)) {
					leaveRoom(socket, roomId, io);
					break;
				}
			}
		});
	});
}
