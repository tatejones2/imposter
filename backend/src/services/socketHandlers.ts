import type { Server as SocketIOServer, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from '../types/socket.js';
import { gameManager } from './gameManager.js';
import { playerRepository } from '../repositories/playerRepository.js';
import { playerRoleRepository } from '../repositories/playerRoleRepository.js';
import { voteRepository } from '../repositories/voteRepository.js';

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

      // ==================== SUBMIT CLUE ====================
      socket.on('submit_clue', async (data) => {
        try {
          if (!socket.data.playerId) {
            throw new Error('Player not found');
          }

          const room = gameManager.getRoom(data.roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          const gameState = gameManager.getGameState(data.roomId);
          if (!gameState || gameState.currentPhase !== 'CLUE_PHASE') {
            throw new Error('Not in clue phase');
          }

          const player = gameManager.getPlayer(data.roomId, socket.data.playerId);
          if (!player) {
            throw new Error('Player not found in room');
          }

          // Broadcast clue to all players
          io.to(data.roomId).emit('clue_submitted', {
            roomId: data.roomId,
            playerName: player.name,
            clue: data.clue,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to submit clue';
          socket.emit('error', { message });
        }
      });

      // ==================== SUBMIT VOTE ====================
      socket.on('submit_vote', async (data) => {
        try {
          if (!socket.data.playerId) {
            throw new Error('Player not found');
          }

          const room = gameManager.getRoom(data.roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          const gameState = gameManager.getGameState(data.roomId);
          if (!gameState || gameState.currentPhase !== 'VOTING_PHASE') {
            throw new Error('Not in voting phase');
          }

          // Check if player has already voted
          const existingVote = await playerRoleRepository.findByPlayerAndSession(
            socket.data.playerId,
            gameState.sessionId
          );

          if (!existingVote) {
            throw new Error('Player role not found');
          }

          // Record vote in database
          await voteRepository.create(
            gameState.sessionId,
            socket.data.playerId,
            data.votedForPlayerId
          );

          // Check if all players have voted
          const players = gameManager.getRoomPlayers(data.roomId);
          const votes = await voteRepository.findByGameSessionId(gameState.sessionId);

          if (votes.length >= players.length) {
            // Tally votes and determine who was eliminated
            const voteCounts = new Map<string, number>();
            for (const vote of votes) {
              voteCounts.set(vote.votedForId, (voteCounts.get(vote.votedForId) || 0) + 1);
            }

            let maxVotes = 0;
            let eliminated = '';
            for (const [playerId, count] of voteCounts.entries()) {
              if (count > maxVotes) {
                maxVotes = count;
                eliminated = playerId;
              }
            }

            const eliminatedPlayer = gameManager.getPlayer(data.roomId, eliminated);
            if (eliminatedPlayer) {
              io.to(data.roomId).emit('vote_results', {
                roomId: data.roomId,
                eliminated: eliminatedPlayer.name,
                reason: 'Voted out',
              });

              // Transition to reveal phase
              await gameManager.transitionPhase(data.roomId, 'REVEAL_PHASE');
              io.to(data.roomId).emit('phase_changed', {
                roomId: data.roomId,
                phase: 'REVEAL_PHASE',
              });
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to submit vote';
          socket.emit('error', { message });
        }
      });

      // ==================== GUESS WORD ====================
      socket.on('guess_word', async (data) => {
        try {
          if (!socket.data.playerId) {
            throw new Error('Player not found');
          }

          const gameState = gameManager.getGameState(data.roomId);
          if (!gameState || gameState.currentPhase !== 'REVEAL_PHASE') {
            throw new Error('Not in reveal phase');
          }

          const playerRole = await playerRoleRepository.findByPlayerAndSession(
            socket.data.playerId,
            gameState.sessionId
          );

          if (!playerRole) {
            throw new Error('Player role not found');
          }

          if (playerRole.role !== 'IMPOSTER') {
            throw new Error('Only imposters can guess');
          }

          // Check if guess is correct
          const isCorrect = data.word.toLowerCase() === gameState.word?.toLowerCase();

          if (isCorrect) {
            // Imposter wins!
            io.to(data.roomId).emit('game_over', {
              roomId: data.roomId,
              winner: 'Imposter',
              scores: [],
            });
          } else {
            // Wrong guess, transition to score phase
            await gameManager.transitionPhase(data.roomId, 'SCORE_PHASE');
            io.to(data.roomId).emit('phase_changed', {
              roomId: data.roomId,
              phase: 'SCORE_PHASE',
            });
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to guess word';
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
