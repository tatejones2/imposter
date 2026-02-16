import { PlayerList } from "../components/PlayerList";
import type { Room } from "../types/game";

interface LobbyPageProps {
  room: Room;
  isHost: boolean;
  currentPlayerId?: string;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function LobbyPage({
  room,
  isHost,
  currentPlayerId,
  onStartGame,
  onLeaveRoom,
}: LobbyPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-4xl font-bold mb-2">{room.name}</h1>
          <p className="text-gray-600 mb-6">
            Room ID:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded">{room.id}</code>
          </p>

          <div className="mb-8">
            <p className="text-lg font-semibold mb-4">
              Players ({room.players.length})
            </p>
            <PlayerList
              players={room.players}
              currentPlayerId={currentPlayerId}
            />
          </div>

          {isHost && room.players.length >= 2 ? (
            <button
              onClick={onStartGame}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-lg transition"
            >
              Start Game
            </button>
          ) : isHost ? (
            <div className="p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-center">
              Need at least 2 players to start
            </div>
          ) : (
            <div className="p-4 bg-blue-100 border border-blue-400 rounded text-blue-800 text-center">
              Waiting for host to start the game...
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="w-full mt-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
