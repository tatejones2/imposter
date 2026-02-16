import { useState, type FormEvent } from "react";

interface ClueInputProps {
  // eslint-disable-next-line no-unused-vars
  onSubmit: (clue: string) => void;
  disabled?: boolean;
  playerRole?: "PLAYER" | "IMPOSTER" | null;
}

export function ClueInput({
  onSubmit,
  disabled = false,
  playerRole,
}: ClueInputProps) {
  const [clueText, setClueText] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (clueText.trim()) {
      onSubmit(clueText);
      setClueText("");
    }
  };

  const isImposter = playerRole === "IMPOSTER";
  const placeholder = isImposter
    ? "Give a clue about the word (hiding your knowledge)..."
    : "Give a clue about the word...";

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 border-4 border-teal-100">
      <label className="block text-sm uppercase tracking-widest font-bold text-teal-900 mb-3">
        Your Clue
      </label>
      <div className="flex gap-3">
        <input
          type="text"
          value={clueText}
          onChange={(e) => setClueText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 border-2 border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed bg-teal-50 text-teal-900 placeholder-teal-400"
        />
        <button
          type="submit"
          disabled={disabled || !clueText.trim()}
          className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-bold transition transform hover:scale-105 shadow-lg"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
