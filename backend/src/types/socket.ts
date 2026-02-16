import type { PlayerState } from './gameState.js';

// Client → Server events
export interface ClientToServerEvents {
  create_room: (data: { name: string; playerName: string }) => void;
  join_room: (data: { roomId: string; playerName: string }) => void;
  start_game: (data: { roomId: string }) => void;
  submit_clue: (data: { roomId: string; clue: string }) => void;
  submit_vote: (data: { roomId: string; votedForPlayerId: string }) => void;
  guess_word: (data: { roomId: string; word: string }) => void;
  leave_room: (data: { roomId: string }) => void;
}

// Server → Client events
export interface RoomData {
  id: string;
  name: string;
  hostId: string;
  players: PlayerState[];
}

export interface ScoreData {
  playerId: string;
  playerName: string;
  points: number;
}

export interface GameScoreData {
  playerId: string;
  name: string;
  totalPoints: number;
}

export interface ServerToClientEvents {
  room_created: (data: { roomId: string; room: RoomData }) => void;
  room_joined: (data: { roomId: string; room: RoomData }) => void;
  player_list_updated: (data: { roomId: string; players: PlayerState[] }) => void;
  role_assigned: (data: { role: string; word?: string }) => void;
  phase_changed: (data: { roomId: string; phase: string }) => void;
  clue_submitted: (data: { roomId: string; playerName: string; clue: string }) => void;
  voting_started: (data: { roomId: string; players: PlayerState[] }) => void;
  vote_results: (data: { roomId: string; eliminated: string; reason: string }) => void;
  round_results: (data: { roomId: string; scores: ScoreData[] }) => void;
  round_complete: (data: { roomId: string; round: number; nextRound: number }) => void;
  game_over: (data: { roomId: string; winner: string; scores: GameScoreData[] }) => void;
  game_aborted: (data: { roomId: string; reason: string }) => void;
  host_changed: (data: { roomId: string; newHostId: string }) => void;
  error: (data: { message: string }) => void;
}

// Socket data
export interface SocketData {
  playerId?: string;
  socketId: string;
}
