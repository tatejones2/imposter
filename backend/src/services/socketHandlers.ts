import type { Server as SocketIOServer, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  GameScoreData,
  ScoreData,
} from '../types/socket.js';
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

          // PHASE 6: Auto-transition to CLUE_PHASE after roles are verified and a delay
          setTimeout(async () => {
            try {
              // Verify all roles are assigned before clue phase
              const allRolesAssigned = await gameManager.verifyAllRolesAssigned(
                gameState.sessionId,
                data.roomId
              );

              if (allRolesAssigned) {
                await gameManager.transitionPhase(data.roomId, 'CLUE_PHASE');
                io.to(data.roomId).emit('phase_changed', {
                  roomId: data.roomId,
                  phase: 'CLUE_PHASE',
                });
              }
            } catch (e) {
              console.error('Failed to transition to clue phase:', e);
            }
          }, 2000); // 2 second delay to let clients see role assignments
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

          const playerRole = await playerRoleRepository.findByPlayerAndSession(
            socket.data.playerId,
            gameState.sessionId
          );

          if (!playerRole) {
            throw new Error('Player role not found');
          }

          // Record vote in database
          await voteRepository.create(
            gameState.sessionId,
            socket.data.playerId,
            data.votedForPlayerId
          );

          // Check if all connected players have voted
          const connectedPlayers = gameManager.getConnectedRoomPlayers(data.roomId);
          const votes = await voteRepository.findByGameSessionId(gameState.sessionId);

          if (votes.length >= connectedPlayers.length) {
            // Tally votes and determine who was eliminated
            const voteCounts = new Map<string, number>();
            for (const vote of votes) {
              voteCounts.set(vote.votedForId, (voteCounts.get(vote.votedForId) || 0) + 1);
            }

            // PHASE 7: Use tie-breaking logic if needed
            const eliminated = gameManager.resolveTiedVotes(voteCounts);

            const eliminatedPlayer = eliminated
              ? gameManager.getPlayer(data.roomId, eliminated)
              : null;
            if (eliminatedPlayer) {
              io.to(data.roomId).emit('vote_results', {
                roomId: data.roomId,
                eliminated: eliminatedPlayer.name,
                reason: 'Voted out',
              });

              // PHASE 6: Calculate scores for this round
              const scores = await gameManager.calculateRoundScores(
                gameState.sessionId,
                eliminated,
                false,
                gameState.round
              );

              // PHASE 6: Check if all imposters were eliminated (players win)
              const playersWon = await gameManager.checkPlayersWinCondition(gameState.sessionId);

              if (playersWon.won) {
                // Game over - players won
                const totalScores = await gameManager.getTotalGameScores(gameState.sessionId);

                io.to(data.roomId).emit('game_over', {
                  roomId: data.roomId,
                  winner: 'Players',
                  scores: totalScores as GameScoreData[],
                });
              } else {
                // PHASE 7: Check if enough players remain
                const { hasEnough } = gameManager.checkSufficientPlayers(data.roomId);
                if (!hasEnough) {
                  io.to(data.roomId).emit('game_aborted', {
                    roomId: data.roomId,
                    reason: 'Not enough players to continue',
                  });
                } else {
                  // Transition to reveal phase for imposter to guess
                  await gameManager.transitionPhase(data.roomId, 'REVEAL_PHASE');
                  io.to(data.roomId).emit('phase_changed', {
                    roomId: data.roomId,
                    phase: 'REVEAL_PHASE',
                  });
                  io.to(data.roomId).emit('round_results', {
                    roomId: data.roomId,
                    scores: Array.from(scores.entries())
                      .map(([playerId, points]) => {
                        const player = gameManager.getPlayer(data.roomId, playerId);
                        return {
                          playerId,
                          playerName: player?.name || 'Unknown',
                          points,
                        } as ScoreData;
                      })
                      .filter(Boolean),
                  });
                }
              }
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

          if (!gameState.word) {
            throw new Error('Game word not found');
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

          // PHASE 6: Check if imposter guess is correct
          const impostorWon = gameManager.checkImpostorWinCondition(data.word, gameState.word);

          if (impostorWon.won) {
            // Imposter guessed correctly - game over!
            // Calculate scores with imposter win bonus
            await gameManager.calculateRoundScores(
              gameState.sessionId,
              null,
              true, // imposter guessed correctly
              gameState.round
            );

            const totalScores = await gameManager.getTotalGameScores(gameState.sessionId);

            io.to(data.roomId).emit('game_over', {
              roomId: data.roomId,
              winner: 'Imposter',
              scores: totalScores as GameScoreData[],
            });
          } else {
            // Wrong guess - transition to score phase
            // Calculate scores for this round (imposter did not guess)
            await gameManager.calculateRoundScores(
              gameState.sessionId,
              null,
              false,
              gameState.round
            );

            await gameManager.transitionPhase(data.roomId, 'SCORE_PHASE');

            // PHASE 6: Check if we continue to next round or end game
            const { gameEnded, nextRound } = await gameManager.prepareNextRound(
              data.roomId,
              gameState.round,
              gameState.maxRounds
            );

            if (gameEnded) {
              // Get final scores and declare overall winner
              const totalScores = await gameManager.getTotalGameScores(gameState.sessionId);
              const overallWinner =
                totalScores.length > 0 && totalScores[0]?.totalPoints > 0
                  ? 'Players' // Most points wins (or we could use other logic)
                  : 'Draw';

              io.to(data.roomId).emit('game_over', {
                roomId: data.roomId,
                winner: overallWinner,
                scores: totalScores as GameScoreData[],
              });
            } else {
              // Continue to next round
              io.to(data.roomId).emit('round_complete', {
                roomId: data.roomId,
                round: gameState.round,
                nextRound: nextRound ?? gameState.round + 1,
              });

              // After a short delay, auto-transition to next round
              setTimeout(async () => {
                try {
                  await gameManager.transitionPhase(data.roomId, 'ASSIGN_ROLES');
                  io.to(data.roomId).emit('phase_changed', {
                    roomId: data.roomId,
                    phase: 'ASSIGN_ROLES',
                  });
                } catch (e) {
                  console.error('Failed to transition to next round:', e);
                }
              }, 3000); // 3 second delay before next round
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to guess word';
          socket.emit('error', { message });
        }
      });

      // ==================== DISCONNECT ====================
      socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}`);

        if (!socket.data.playerId) return;

        // Find which room this player was in
        let playerRoomId: string | null = null;
        for (const room of gameManager.getRooms()) {
          if (room.players.has(socket.data.playerId)) {
            playerRoomId = room.id;
            break;
          }
        }

        if (!playerRoomId) return;

        // PHASE 7: Mark player as disconnected
        gameManager.handlePlayerDisconnect(playerRoomId, socket.data.playerId);

        const room = gameManager.getRoom(playerRoomId);
        if (!room) return;

        // PHASE 7: Check if host disconnected
        if (room.hostId === socket.data.playerId) {
          const { newHostId, hostChanged } = await gameManager.reassignHostIfNeeded(playerRoomId);

          if (hostChanged && newHostId) {
            io.to(playerRoomId).emit('host_changed', {
              roomId: playerRoomId,
              newHostId,
            });
          } else if (!newHostId) {
            // No connected players left - abort game
            io.to(playerRoomId).emit('game_aborted', {
              roomId: playerRoomId,
              reason: 'Not enough players connected',
            });
          }
        }

        // PHASE 7: Check if there are enough players to continue
        const gameState = gameManager.getGameState(playerRoomId);
        if (gameState) {
          const { hasEnough, currentCount, minRequired } =
            gameManager.checkSufficientPlayers(playerRoomId);

          if (!hasEnough) {
            // Abort the game
            io.to(playerRoomId).emit('game_aborted', {
              roomId: playerRoomId,
              reason: `Not enough players. ${currentCount} connected, ${minRequired} required.`,
            });
          } else {
            // Update player list with disconnected status
            io.to(playerRoomId).emit('player_list_updated', {
              roomId: playerRoomId,
              players: Array.from(room.players.values()),
            });
          }
        } else {
          // Not in a game yet, just clean up lobby
          io.to(playerRoomId).emit('player_list_updated', {
            roomId: playerRoomId,
            players: Array.from(room.players.values()),
          });
        }
      });
    }
  );
}
