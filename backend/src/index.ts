import express, { Express } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from './types/socket.js';
import { setupSocketHandlers } from './services/socketHandlers.js';

dotenv.config();

const app: Express = express();
const server = http.createServer(app);
const io = new SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, unknown>,
  SocketData
>(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
