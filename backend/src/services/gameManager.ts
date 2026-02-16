import type { GamePhase } from '@prisma/client';
import type { GameState, RoomState, PlayerState } from '../types/gameState.js';
import { roomRepository } from '../repositories/roomRepository.js';
import { gameSessionRepository } from '../repositories/gameSessionRepository.js';
import { wordRepository } from '../repositories/categoryRepository.js';
import { playerRoleRepository } from '../repositories/playerRoleRepository.js';
import { scoreRepository } from '../repositories/scoreRepository.js';

export class GameManager {
  private rooms: Map<string, RoomState> = new Map();

  // ==================== ROOM MANAGEMENT ====================

  async createRoom(name: string, hostId: string): Promise<RoomState> {
    const dbRoom = await roomRepository.create(name, hostId);

    const room: RoomState = {
      id: dbRoom.id,
      name: dbRoom.name,
      hostId: dbRoom.hostId,
      players: new Map(),
      createdAt: dbRoom.createdAt,
    };

    this.rooms.set(room.id, room);
    return room;
  }

  async joinRoom(
    roomId: string,
    playerId: string,
    socketId: string,
    playerName: string
  ): Promise<RoomState> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const player: PlayerState = {
      id: playerId,
      socketId,
      name: playerName,
      isConnected: true,
    };

    room.players.set(playerId, player);
    return room;
  }

  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    room.players.delete(playerId);

    // Delete room if empty
    if (room.players.size === 0) {
      this.rooms.delete(roomId);
      await roomRepository.delete(roomId);
    }
  }

  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  getRooms(): RoomState[] {
    return Array.from(this.rooms.values());
  }

  // ==================== GAME STATE MACHINE ====================

  async startGame(roomId: string): Promise<GameState> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    if (room.players.size < 2) {
      throw new Error('Not enough players to start game');
    }

    // Get random word
    const word = await wordRepository.findRandom();
    if (!word) {
      throw new Error('No words available in database');
    }

    // Create game session in DB
    const dbSession = await gameSessionRepository.create(roomId, word.id);

    // Initialize game state
    const gameState: GameState = {
      sessionId: dbSession.id,
      roomId,
      currentPhase: 'LOBBY',
      round: 1,
      maxRounds: 3,
      word: word.text,
      players: room.players,
      createdAt: dbSession.createdAt,
    };

    room.gameState = gameState;
    return gameState;
  }

  async transitionPhase(roomId: string, newPhase: GamePhase): Promise<GameState> {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) {
      throw new Error('Game not found');
    }

    const validTransitions: Record<GamePhase, GamePhase[]> = {
      LOBBY: ['ASSIGN_ROLES'],
      ASSIGN_ROLES: ['CLUE_PHASE'],
      CLUE_PHASE: ['VOTING_PHASE'],
      VOTING_PHASE: ['REVEAL_PHASE'],
      REVEAL_PHASE: ['SCORE_PHASE'],
      SCORE_PHASE: ['CLUE_PHASE', 'LOBBY'],
    };

    const currentPhase = room.gameState.currentPhase;
    const allowed = validTransitions[currentPhase];

    if (!allowed.includes(newPhase)) {
      throw new Error(`Cannot transition from ${currentPhase} to ${newPhase}`);
    }

    room.gameState.currentPhase = newPhase;
    await gameSessionRepository.updatePhase(room.gameState.sessionId, newPhase);

    return room.gameState;
  }

  getGameState(roomId: string): GameState | undefined {
    const room = this.rooms.get(roomId);
    return room?.gameState;
  }

  // ==================== PLAYER STATE ====================

  setPlayerRole(roomId: string, playerId: string, role: string): void {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const player = room.players.get(playerId);
    if (!player) {
      throw new Error(`Player ${playerId} not found in room`);
    }

    player.role = role === 'IMPOSTER' ? 'IMPOSTER' : 'PLAYER';
  }

  getPlayer(roomId: string, playerId: string): PlayerState | undefined {
    const room = this.rooms.get(roomId);
    return room?.players.get(playerId);
  }

  getRoomPlayers(roomId: string): PlayerState[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.players.values()) : [];
  }

  setPlayerConnected(roomId: string, playerId: string, connected: boolean): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const player = room.players.get(playerId);
    if (player) {
      player.isConnected = connected;
    }
  }

  // ==================== PHASE 6: GAME LOGIC RULES ====================

  /**
   * Verify that all players in a room have been assigned roles
   * Required before transitioning to CLUE_PHASE
   */
  async verifyAllRolesAssigned(gameSessionId: string, roomId: string): Promise<boolean> {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error(`Room ${roomId} not found`);
    }

    const playerCount = room.players.size;
    const assignedRoles = await playerRoleRepository.findByGameSessionId(gameSessionId);

    return assignedRoles.length === playerCount && playerCount > 0;
  }

  /**
   * Get all player roles for a game session
   */
  async getPlayerRoles(gameSessionId: string): Promise<Array<{ playerId: string; role: string }>> {
    const roles = await playerRoleRepository.findByGameSessionId(gameSessionId);
    return roles.map((r) => ({
      playerId: r.playerId,
      role: r.role,
    }));
  }

  /**
   * Check win condition: if all imposters are eliminated
   * Returns { won: boolean, winners: 'PLAYERS' | 'IMPOSTERS' | null }
   */
  async checkPlayersWinCondition(gameSessionId: string): Promise<{
    won: boolean;
    winners: 'PLAYERS' | null;
  }> {
    const roles = await playerRoleRepository.findByGameSessionId(gameSessionId);
    const imposters = roles.filter((r) => r.role === 'IMPOSTER');

    // If there are no imposters left, players win
    if (imposters.length === 0) {
      return { won: true, winners: 'PLAYERS' };
    }

    return { won: false, winners: null };
  }

  /**
   * Check win condition: if imposter successfully guesses the word
   * Returns { won: boolean, winners: 'IMPOSTERS' | null }
   */
  checkImpostorWinCondition(
    guessedWord: string,
    actualWord: string
  ): {
    won: boolean;
    winners: 'IMPOSTERS' | null;
  } {
    const isCorrect = guessedWord.toLowerCase().trim() === actualWord.toLowerCase().trim();
    return { won: isCorrect, winners: isCorrect ? 'IMPOSTERS' : null };
  }

  /**
   * Calculate points for all players in a round
   * Scoring rules:
   * - Correct guess: 10 points
   * - Imposter survived vote: 5 points
   * - Players eliminated imposter: 3 points each
   */
  async calculateRoundScores(
    gameSessionId: string,
    eliminatedPlayerId: string | null,
    impostorGuessedCorrectly: boolean,
    roundNumber: number
  ): Promise<Map<string, number>> {
    const roles = await playerRoleRepository.findByGameSessionId(gameSessionId);
    const scores = new Map<string, number>();

    // Initialize scores for all players
    for (const role of roles) {
      scores.set(role.playerId, 0);
    }

    // If imposter guessed correctly, all imposters get 10 points
    if (impostorGuessedCorrectly) {
      for (const role of roles) {
        if (role.role === 'IMPOSTER') {
          scores.set(role.playerId, (scores.get(role.playerId) || 0) + 10);
        }
      }
    } else if (!eliminatedPlayerId) {
      // If no one was eliminated, imposter survived - 5 points
      for (const role of roles) {
        if (role.role === 'IMPOSTER') {
          scores.set(role.playerId, (scores.get(role.playerId) || 0) + 5);
        }
      }
    } else if (eliminatedPlayerId) {
      // Check if eliminated player was imposter or player
      const eliminatedRole = roles.find((r) => r.playerId === eliminatedPlayerId);

      if (eliminatedRole?.role === 'IMPOSTER') {
        // Players who voted out the imposter get 3 points each
        for (const role of roles) {
          if (role.role === 'PLAYER') {
            scores.set(role.playerId, (scores.get(role.playerId) || 0) + 3);
          }
        }
      }
      // If a regular player was eliminated, no bonus points
    }

    // Save scores to database
    for (const [playerId, points] of scores.entries()) {
      await scoreRepository.create(gameSessionId, playerId, points, roundNumber);
    }

    return scores;
  }

  /**
   * Get total scores for all players in a game session
   */
  async getTotalGameScores(
    gameSessionId: string
  ): Promise<Array<{ playerId: string; name: string; totalPoints: number }>> {
    const scores = await scoreRepository.findByGameSessionId(gameSessionId);
    const playerScores = new Map<string, number>();

    for (const score of scores) {
      const current = playerScores.get(score.playerId) || 0;
      playerScores.set(score.playerId, current + score.points);
    }

    // Enrich with player names from room
    const playerNames = new Map<string, string>();
    for (const room of this.rooms.values()) {
      for (const player of room.players.values()) {
        playerNames.set(player.id, player.name);
      }
    }

    const result = Array.from(playerScores.entries()).map(([playerId, totalPoints]) => ({
      playerId,
      name: playerNames.get(playerId) || 'Unknown',
      totalPoints,
    }));

    return result.sort((a, b) => b.totalPoints - a.totalPoints);
  }

  /**
   * Advance to next round or end game
   * Returns { gameEnded: boolean, nextRound?: number }
   */
  async prepareNextRound(
    roomId: string,
    currentRound: number,
    maxRounds: number
  ): Promise<{ gameEnded: boolean; nextRound?: number }> {
    const room = this.rooms.get(roomId);
    if (!room || !room.gameState) {
      throw new Error('Game not found');
    }

    if (currentRound >= maxRounds) {
      // Game ended
      return { gameEnded: true };
    }

    // Start next round
    const nextRound = currentRound + 1;

    // Get new word for next round
    const word = await wordRepository.findRandom();
    if (!word) {
      throw new Error('No words available in database');
    }

    // Create new game session for next round
    const newSession = await gameSessionRepository.create(roomId, word.id);

    // Update game state
    room.gameState.sessionId = newSession.id;
    room.gameState.round = nextRound;
    room.gameState.word = word.text;
    room.gameState.currentPhase = 'ASSIGN_ROLES';

    return { gameEnded: false, nextRound };
  }

  /**
   * Get count of imposters and players still in game
   */
  async getRoleCounts(gameSessionId: string): Promise<{ imposters: number; players: number }> {
    const roles = await playerRoleRepository.findByGameSessionId(gameSessionId);
    const imposters = roles.filter((r) => r.role === 'IMPOSTER').length;
    const players = roles.length - imposters;
    return { imposters, players };
  }
}

export const gameManager = new GameManager();
