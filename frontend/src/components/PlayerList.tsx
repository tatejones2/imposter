import type { Player } from "../types/game";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Players</h2>
      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded ${
              currentPlayerId === player.id ? "bg-blue-100" : "bg-gray-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{player.name}</span>
              <div className="flex items-center gap-2">
                {player.role && (
                  <span
                    className={`text-sm px-2 py-1 rounded ${
                      player.role === "IMPOSTER"
                        ? "bg-red-200 text-red-800"
                        : "bg-green-200 text-green-800"
                    }`}
                  >
                    {player.role}
                  </span>
                )}
                <span
                  className={`w-2 h-2 rounded-full ${
                    player.isConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
