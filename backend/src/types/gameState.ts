import type { GamePhase, GameRole } from '@prisma/client';

export interface PlayerState {
  id: string;
  socketId: string;
  name: string;
  role?: GameRole;
  isConnected: boolean;
}

export interface GameState {
  sessionId: string;
  roomId: string;
  currentPhase: GamePhase;
  round: number;
  maxRounds: number;
  word?: string;
  players: Map<string, PlayerState>;
  createdAt: Date;
}

export interface RoomState {
  id: string;
  name: string;
  hostId: string;
  players: Map<string, PlayerState>;
  gameState?: GameState;
  createdAt: Date;
}

export type GamePhaseType = (typeof GamePhase)[keyof typeof GamePhase];
