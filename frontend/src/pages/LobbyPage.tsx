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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-8">
      <div className="absolute top-10 right-10 w-40 h-40 bg-amber-200 rounded-full opacity-20"></div>
      <div className="absolute bottom-32 left-10 w-48 h-48 bg-teal-200 rounded-full opacity-15"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-10 mb-8 border-4 border-amber-100">
          <h1 className="text-5xl font-bold mb-2 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
            {room.name}
          </h1>
          <p className="text-amber-800 mb-6 text-lg">
            Room ID:{" "}
            <code className="bg-amber-100 px-3 py-1 rounded-lg font-mono font-bold text-amber-900">{room.id}</code>
          </p>

          <div className="mb-8">
            <p className="text-2xl font-bold mb-4 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
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
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 font-bold text-lg transition transform hover:scale-105 shadow-lg"
            >
              Start Game
            </button>
          ) : isHost ? (
            <div className="p-4 bg-amber-100 border-2 border-amber-400 rounded-lg text-amber-800 text-center font-bold">
              Need at least 2 players to start
            </div>
          ) : (
            <div className="p-4 bg-teal-100 border-2 border-teal-400 rounded-lg text-teal-800 text-center font-bold">
              Waiting for host to start the game...
            </div>
          )}

          <button
            onClick={onLeaveRoom}
            className="w-full mt-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 font-bold transition transform hover:scale-105 shadow-lg"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
