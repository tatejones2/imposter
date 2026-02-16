interface RoleDisplayProps {
  role: "PLAYER" | "IMPOSTER" | null;
  word?: string | null;
}

export function RoleDisplay({ role, word }: RoleDisplayProps) {
  if (!role) return null;

  const isImposter = role === "IMPOSTER";

  return (
    <div
      className={`rounded-lg shadow p-6 ${
        isImposter
          ? "bg-gradient-to-br from-red-100 to-red-50"
          : "bg-gradient-to-br from-green-100 to-green-50"
      }`}
    >
      <p className="text-sm text-gray-600 mb-2">Your Role</p>
      <p
        className={`text-3xl font-bold mb-4 ${
          isImposter ? "text-red-600" : "text-green-600"
        }`}
      >
        {role}
      </p>

      {!isImposter && word && (
        <div className="mt-4 p-3 bg-white rounded border-2 border-green-300">
          <p className="text-xs text-gray-600 mb-1">The Secret Word Is</p>
          <p className="text-2xl font-bold text-green-700">{word}</p>
        </div>
      )}

      {isImposter && (
        <p className="text-sm text-red-700">
          You are the imposter! Find the word by listening to clues, or guess it
          in the reveal phase.
        </p>
      )}
    </div>
  );
}
