import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

let io = null;
const socketsByUser = new Map(); // userId -> Set of socket ids

const registerSocket = (userId, socketId) => {
  if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
  socketsByUser.get(userId).add(socketId);
};

const unregisterSocket = (userId, socketId) => {
  if (!userId || !socketsByUser.has(userId)) return;
  socketsByUser.get(userId).delete(socketId);
  if (socketsByUser.get(userId).size === 0) socketsByUser.delete(userId);
};

export const initRealtime = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: true, credentials: false },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(payload.id).select("_id");
      if (!user) return next(new Error("User not found"));
      socket.userId = String(user._id);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    registerSocket(socket.userId, socket.id);
    socket.on("disconnect", () => unregisterSocket(socket.userId, socket.id));
  });
};

export const emitToUsers = async (userIdOrIds, event, data) => {
  if (!io) return;
  const ids = Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds];
  const seen = new Set();
  for (const id of ids) {
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    const sockets = socketsByUser.get(key);
    if (!sockets) continue;
    for (const socketId of sockets) io.to(socketId).emit(event, data);
  }
};