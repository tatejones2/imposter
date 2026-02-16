import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types/socket.js';
import { gameManager } from './gameManager.js';
import { playerRepository } from '../repositories/playerRepository.js';
import { playerRoleRepository } from '../repositories/playerRoleRepository.js';

export function setupSocketHandlers(
  io: SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, unknown>,
    SocketData
  >
): void {
  io.on(
    'connection',
    (
      socket: Socket<
        ClientToServerEvents,
        ServerToClientEvents,
        Record<string, unknown>,
        SocketData
      >
    ) => {
      console.log(`Client connected: ${socket.id}`);
      socket.data.socketId = socket.id;

      // ==================== CREATE ROOM ====================
      socket.on('create_room', async (data) => {
        try {
          const dbPlayer = await playerRepository.create(
            'temp-room-id',
            socket.id,
            data.playerName
          );

          const room = await gameManager.createRoom(data.name, dbPlayer.id);

          await gameManager.joinRoom(room.id, dbPlayer.id, socket.id, data.playerName);

          socket.data.playerId = dbPlayer.id;
          socket.join(room.id);

          io.to(room.id).emit('room_created', {
            roomId: room.id,
            room: {
              id: room.id,
              name: room.name,
              hostId: room.hostId,
              players: Array.from(room.players.values()),
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create room';
          socket.emit('error', { message });
        }
      });

      // ==================== JOIN ROOM ====================
      socket.on('join_room', async (data) => {
        try {
          const room = gameManager.getRoom(data.roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          const dbPlayer = await playerRepository.create(data.roomId, socket.id, data.playerName);

          await gameManager.joinRoom(data.roomId, dbPlayer.id, socket.id, data.playerName);

          socket.data.playerId = dbPlayer.id;
          socket.join(data.roomId);

          io.to(data.roomId).emit('player_list_updated', {
            roomId: data.roomId,
            players: Array.from(room.players.values()),
          });

          io.to(data.roomId).emit('room_joined', {
            roomId: data.roomId,
            room: {
              id: room.id,
              name: room.name,
              hostId: room.hostId,
              players: Array.from(room.players.values()),
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to join room';
          socket.emit('error', { message });
        }
      });

      // ==================== START GAME ====================
      socket.on('start_game', async (data) => {
        try {
          const gameState = await gameManager.startGame(data.roomId);

          // Assign roles to players
          const players = Array.from(gameState.players.values());
          const impostersCount = Math.ceil(players.length / 3);
          const shuffled = [...players].sort(() => Math.random() - 0.5);

          for (let i = 0; i < shuffled.length; i++) {
            const role = i < impostersCount ? 'IMPOSTER' : 'PLAYER';
            gameManager.setPlayerRole(data.roomId, shuffled[i].id, role);

            // Save role to DB
            await playerRoleRepository.create(gameState.sessionId, shuffled[i].id, role);

            // Emit private role assignment
            const playerSocket = Array.from(io.sockets.sockets.values()).find(
              (s) => s.data.playerId === shuffled[i].id
            );

            if (playerSocket) {
              playerSocket.emit('role_assigned', {
                role,
                word: role === 'PLAYER' ? gameState.word : undefined,
              });
            }
          }

          // Transition to ASSIGN_ROLES phase
          await gameManager.transitionPhase(data.roomId, 'ASSIGN_ROLES');

          io.to(data.roomId).emit('phase_changed', {
            roomId: data.roomId,
            phase: 'ASSIGN_ROLES',
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to start game';
          socket.emit('error', { message });
        }
      });

      // ==================== LEAVE ROOM ====================
      socket.on('leave_room', async (data) => {
        try {
          if (!socket.data.playerId) {
            throw new Error('Player not found');
          }

          await gameManager.leaveRoom(data.roomId, socket.data.playerId);
          await playerRepository.delete(socket.data.playerId);

          socket.leave(data.roomId);

          const room = gameManager.getRoom(data.roomId);
          if (room) {
            io.to(data.roomId).emit('player_list_updated', {
              roomId: data.roomId,
              players: Array.from(room.players.values()),
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to leave room';
          socket.emit('error', { message });
        }
      });

      // ==================== DISCONNECT ====================
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);

        if (socket.data.playerId) {
          // Mark player as disconnected but don't remove them yet
          // They can reconnect within a timeout window
        }
      });
    }
  );
}
