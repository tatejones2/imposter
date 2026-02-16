import type { Player } from "../types/game";

interface VotePanelProps {
  players: Player[];
  // eslint-disable-next-line no-unused-vars
  onVote: (playerId: string) => void;
  disabled?: boolean;
  currentPlayerId?: string;
}

export function VotePanel({
  players,
  onVote,
  disabled = false,
  currentPlayerId,
}: VotePanelProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-orange-100">
      <h2 className="text-2xl font-bold mb-2 text-orange-900" style={{ fontFamily: "Georgia, serif" }}>Voting Phase</h2>
      <p className="text-orange-800 mb-6 font-medium">
        Vote for who you think is the imposter
      </p>
      <div className="grid grid-cols-2 gap-3">
        {players
          .filter((p) => p.id !== currentPlayerId)
          .map((player) => (
            <button
              key={player.id}
              onClick={() => onVote(player.id)}
              disabled={disabled}
              className="p-4 border-3 border-orange-200 rounded-lg hover:border-red-500 hover:bg-gradient-to-br hover:from-red-100 hover:to-pink-100 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all transform hover:scale-105 font-bold text-orange-900"
            >
              <p className="font-bold text-lg">{player.name}</p>
              <p className="text-sm text-orange-700">Vote</p>
            </button>
          ))}
      </div>
    </div>
  );
}
