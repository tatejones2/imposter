import type { GamePhase } from '@prisma/client';
import type { GameState, RoomState, PlayerState } from '../types/gameState.js';
import { roomRepository } from '../repositories/roomRepository.js';
import { gameSessionRepository } from '../repositories/gameSessionRepository.js';
import { wordRepository } from '../repositories/categoryRepository.js';

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
}

export const gameManager = new GameManager();
