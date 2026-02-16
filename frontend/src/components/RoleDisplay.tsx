interface RoleDisplayProps {
  role: "PLAYER" | "IMPOSTER" | null;
  word?: string | null;
}

export function RoleDisplay({ role, word }: RoleDisplayProps) {
  if (!role) return null;

  const isImposter = role === "IMPOSTER";

  return (
    <div
      className={`rounded-2xl shadow-xl p-8 border-4 ${
        isImposter
          ? "bg-gradient-to-br from-red-100 to-red-50 border-red-300"
          : "bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-300"
      }`}
    >
      <p className={`text-sm uppercase tracking-widest font-bold mb-2 ${
        isImposter ? "text-red-700" : "text-emerald-700"
      }`}>Your Role</p>
      <p
        className={`text-4xl font-bold mb-4 ${
          isImposter ? "text-red-700" : "text-emerald-700"
        }`}
        style={{ fontFamily: "Georgia, serif" }}
      >
        {role}
      </p>

      {!isImposter && word && (
        <div className="mt-6 p-4 bg-white rounded-xl border-4 border-emerald-300 shadow-md">
          <p className="text-xs uppercase tracking-widest font-bold text-emerald-700 mb-2">The Secret Word Is</p>
          <p className="text-3xl font-bold text-emerald-900" style={{ fontFamily: "Georgia, serif" }}>{word}</p>
        </div>
      )}

      {isImposter && (
        <p className="text-sm font-semibold text-red-800 leading-relaxed">
          You are the imposter! Find the word by listening to clues, or guess it
          in the reveal phase.
        </p>
      )}
    </div>
  );
}
