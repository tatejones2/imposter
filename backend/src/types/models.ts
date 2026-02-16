import type {
  Room,
  Player,
  Category,
  Word,
  GameSession,
  PlayerRole,
  Vote,
  Score,
  RoomStatus,
  GamePhase,
  GameRole,
} from '@prisma/client';

export type {
  Room,
  Player,
  Category,
  Word,
  GameSession,
  PlayerRole,
  Vote,
  Score,
  RoomStatus,
  GamePhase,
  GameRole,
};

// Room with related data
export interface RoomWithData extends Room {
  players: Player[];
  gameSessions: GameSession[];
}

// Player with related data
export interface PlayerWithData extends Player {
  room: Room;
  playerRoles: PlayerRole[];
  votes: Vote[];
  scores: Score[];
}

// GameSession with full relations
export interface GameSessionWithData extends GameSession {
  room: Room;
  word: Word;
  playerRoles: PlayerRole[];
  votes: Vote[];
  scores: Score[];
}

// PlayerRole with relations
export interface PlayerRoleWithData extends PlayerRole {
  gameSession: GameSession;
  player: Player;
}
