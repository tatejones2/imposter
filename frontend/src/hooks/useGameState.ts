import { useState, useCallback, useEffect } from "react";
import type { Room, GameState, Player } from "../types/game";
import { useSocket } from "../context/SocketContext";

interface UseGameStateReturn {
  room: Room | null;
  gameState: GameState | null;
  playerRole: "PLAYER" | "IMPOSTER" | null;
  word: string | null; // Only non-null if playerRole is PLAYER
  players: Player[];
  error: string | null;
  // eslint-disable-next-line no-unused-vars
  createRoom: (name: string, playerName: string) => void;
  // eslint-disable-next-line no-unused-vars
  joinRoom: (roomId: string, playerName: string) => void;
  // eslint-disable-next-line no-unused-vars
  startGame: (roomId: string) => void;
  // eslint-disable-next-line no-unused-vars
  submitClue: (roomId: string, clue: string) => void;
  // eslint-disable-next-line no-unused-vars
  submitVote: (roomId: string, votedForPlayerId: string) => void;
  // eslint-disable-next-line no-unused-vars
  guessWord: (roomId: string, word: string) => void;
  // eslint-disable-next-line no-unused-vars
  leaveRoom: (roomId: string) => void;
}

export function useGameState(): UseGameStateReturn {
  const { socket } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerRole, setPlayerRole] = useState<"PLAYER" | "IMPOSTER" | null>(
    null,
  );
  const [word, setWord] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("room_created", (data) => {
      setRoom({
        id: data.roomId,
        name: data.room.name,
        hostId: data.room.hostId,
        players: data.room.players,
      });
      setPlayers(data.room.players);
    });

    socket.on("room_joined", (data) => {
      setRoom({
        id: data.roomId,
        name: data.room.name,
        hostId: data.room.hostId,
        players: data.room.players,
      });
      setPlayers(data.room.players);
    });

    socket.on("player_list_updated", (data) => {
      setPlayers(data.players);
      if (room) {
        setRoom({ ...room, players: data.players });
      }
    });

    socket.on("role_assigned", (data) => {
      setPlayerRole(data.role as "PLAYER" | "IMPOSTER");
      if (data.word) {
        setWord(data.word);
      }
    });

    socket.on("phase_changed", (data) => {
      if (gameState) {
        setGameState({
          ...gameState,
          currentPhase: data.phase,
        });
      }
    });

    socket.on("error", (data) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.off("room_created");
      socket.off("room_joined");
      socket.off("player_list_updated");
      socket.off("role_assigned");
      socket.off("phase_changed");
      socket.off("error");
    };
  }, [socket, room, gameState]);

  const createRoom = useCallback(
    (name: string, playerName: string) => {
      if (socket) {
        socket.emit("create_room", { name, playerName });
      }
    },
    [socket],
  );

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      if (socket) {
        socket.emit("join_room", { roomId, playerName });
      }
    },
    [socket],
  );

  const startGame = useCallback(
    (_roomId: string) => {
      if (socket) {
        socket.emit("start_game", { roomId: _roomId });
      }
    },
    [socket],
  );

  const submitClue = useCallback(
    (_roomId: string, clue: string) => {
      if (socket) {
        socket.emit("submit_clue", { roomId: _roomId, clue });
      }
    },
    [socket],
  );

  const submitVote = useCallback(
    (_roomId: string, votedForPlayerId: string) => {
      if (socket) {
        socket.emit("submit_vote", { roomId: _roomId, votedForPlayerId });
      }
    },
    [socket],
  );

  const guessWord = useCallback(
    (_roomId: string, wordGuess: string) => {
      if (socket) {
        socket.emit("guess_word", { roomId: _roomId, word: wordGuess });
      }
    },
    [socket],
  );

  const leaveRoom = useCallback(
    (_roomId: string) => {
      if (socket) {
        socket.emit("leave_room", { roomId: _roomId });
        setRoom(null);
        setGameState(null);
        setPlayerRole(null);
        setWord(null);
        setPlayers([]);
      }
    },
    [socket],
  );

  return {
    room,
    gameState,
    playerRole,
    word,
    players,
    error,
    createRoom,
    joinRoom,
    startGame,
    submitClue,
    submitVote,
    guessWord,
    leaveRoom,
  };
}
