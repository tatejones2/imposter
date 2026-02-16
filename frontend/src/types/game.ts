export interface Player {
  id: string;
  socketId: string;
  name: string;
  role?: "PLAYER" | "IMPOSTER";
  isConnected: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Player[];
}

export interface GameState {
  sessionId: string;
  roomId: string;
  currentPhase:
    | "LOBBY"
    | "ASSIGN_ROLES"
    | "CLUE_PHASE"
    | "VOTING_PHASE"
    | "REVEAL_PHASE"
    | "SCORE_PHASE";
  round: number;
  maxRounds: number;
  word?: string; // Only available if role is PLAYER
  players: Player[];
}

export interface ScoreData {
  playerId: string;
  playerName: string;
  points: number;
}
