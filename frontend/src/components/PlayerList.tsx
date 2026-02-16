import type { Player } from "../types/game";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-4 border-amber-100">
      <h2 className="text-2xl font-bold mb-4 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Players</h2>
      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-4 rounded-xl transition transform hover:scale-105 ${
              currentPlayerId === player.id
                ? "bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-300 shadow-md"
                : "bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900">{player.name}</span>
              <div className="flex items-center gap-3">
                {player.role && (
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-bold ${
                      player.role === "IMPOSTER"
                        ? "bg-red-300 text-red-900 border border-red-500"
                        : "bg-emerald-300 text-emerald-900 border border-emerald-500"
                    }`}
                  >
                    {player.role}
                  </span>
                )}
                <span
                  className={`w-3 h-3 rounded-full shadow-sm ${
                    player.isConnected
                      ? "bg-gradient-to-r from-emerald-400 to-teal-400"
                      : "bg-gray-400"
                  }`}
                  title={player.isConnected ? "Connected" : "Disconnected"}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
