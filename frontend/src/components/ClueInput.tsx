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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Your Clue
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={clueText}
          onChange={(e) => setClueText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !clueText.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
