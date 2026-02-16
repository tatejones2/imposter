interface GameHeaderProps {
  roomName: string;
  currentPhase: string;
  round: number;
  maxRounds: number;
  playerRole?: "PLAYER" | "IMPOSTER" | null;
}

export function GameHeader({
  roomName,
  currentPhase,
  round,
  maxRounds,
  playerRole,
}: GameHeaderProps) {
  const phaseDisplay = currentPhase
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">{roomName}</h1>
          <p className="text-blue-100">Imposter Word Game</p>
        </div>
        {playerRole && (
          <div
            className={`px-4 py-2 rounded-full font-bold ${
              playerRole === "IMPOSTER"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            {playerRole}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-blue-100 text-sm">Phase</p>
          <p className="text-lg font-semibold">{phaseDisplay}</p>
        </div>
        <div>
          <p className="text-blue-100 text-sm">Round</p>
          <p className="text-lg font-semibold">
            {round} / {maxRounds}
          </p>
        </div>
      </div>
    </div>
  );
}
