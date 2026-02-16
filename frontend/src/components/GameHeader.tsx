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
    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-8 rounded-2xl shadow-2xl border-4 border-amber-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-4xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{roomName}</h1>
          <p className="text-amber-100 text-lg">Imposter Word Game</p>
        </div>
        {playerRole && (
          <div
            className={`px-6 py-3 rounded-full font-bold text-lg ${
              playerRole === "IMPOSTER"
                ? "bg-red-600 text-white shadow-lg border-2 border-red-300"
                : "bg-emerald-600 text-white shadow-lg border-2 border-emerald-300"
            }`}
          >
            {playerRole}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-amber-100 text-sm font-semibold uppercase tracking-wider">Phase</p>
          <p className="text-lg font-bold text-white">{phaseDisplay}</p>
        </div>
        <div>
          <p className="text-amber-100 text-sm font-semibold uppercase tracking-wider">Round</p>
          <p className="text-lg font-bold text-white">
            {round} / {maxRounds}
          </p>
        </div>
      </div>
    </div>
  );
}
