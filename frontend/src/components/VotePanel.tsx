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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Voting</h2>
      <p className="text-gray-600 mb-4">
        Vote for who you think is the imposter
      </p>
      <div className="grid grid-cols-2 gap-2">
        {players
          .filter((p) => p.id !== currentPlayerId)
          .map((player) => (
            <button
              key={player.id}
              onClick={() => onVote(player.id)}
              disabled={disabled}
              className="p-3 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
            >
              <p className="font-medium">{player.name}</p>
              <p className="text-sm text-gray-500">Vote</p>
            </button>
          ))}
      </div>
    </div>
  );
}
