import { useState, type FormEvent } from "react";
import { GameHeader } from "../components/GameHeader";
import { PlayerList } from "../components/PlayerList";
import { ClueInput } from "../components/ClueInput";
import { VotePanel } from "../components/VotePanel";
import { RoleDisplay } from "../components/RoleDisplay";
import type { GameState } from "../types/game";

interface GamePageProps {
  gameState: GameState;
  playerRole: "PLAYER" | "IMPOSTER" | null;
  word: string | null;
  currentPlayerId?: string;
  // eslint-disable-next-line no-unused-vars
  onSubmitClue: (clue: string) => void;
  // eslint-disable-next-line no-unused-vars
  onSubmitVote: (playerId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onGuessWord: (word: string) => void;
}

export function GamePage({
  gameState,
  playerRole,
  word,
  currentPlayerId,
  onSubmitClue: _onSubmitClue,
  onSubmitVote: _onSubmitVote,
  onGuessWord: _onGuessWord,
}: GamePageProps) {
  const [guessInput, setGuessInput] = useState("");

  const handleGuessSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (guessInput.trim()) {
      _onGuessWord(guessInput);
      setGuessInput("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-8">
      <div className="absolute top-10 right-10 w-56 h-56 bg-amber-200 rounded-full opacity-15"></div>
      <div className="absolute bottom-32 left-10 w-64 h-64 bg-teal-200 rounded-full opacity-10"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <GameHeader
          roomName={gameState.roomId}
          currentPhase={gameState.currentPhase}
          round={gameState.round}
          maxRounds={gameState.maxRounds}
          playerRole={playerRole}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Left column - Role Display and Player List */}
          <div className="space-y-6">
            <RoleDisplay role={playerRole} word={word} />
            <PlayerList
              players={gameState.players}
              currentPlayerId={currentPlayerId}
            />
          </div>

          {/* Center column - Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {gameState.currentPhase === "CLUE_PHASE" && (
              <ClueInput
                onSubmit={_onSubmitClue}
                disabled={playerRole === "IMPOSTER" && playerRole !== null}
                playerRole={playerRole}
              />
            )}

            {gameState.currentPhase === "VOTING_PHASE" && (
              <VotePanel
                players={gameState.players}
                onVote={_onSubmitVote}
                currentPlayerId={currentPlayerId}
              />
            )}

            {gameState.currentPhase === "REVEAL_PHASE" &&
              playerRole === "IMPOSTER" && (
                <form
                  onSubmit={handleGuessSubmit}
                  className="bg-white rounded-2xl shadow-xl p-8 border-4 border-amber-100"
                >
                  <h2 className="text-2xl font-bold mb-4 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>Guess the Word</h2>
                  <p className="text-amber-800 mb-4 font-medium">
                    Use the clues you heard to guess the word
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      placeholder="Enter your guess..."
                      className="flex-1 px-4 py-3 border-2 border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900 placeholder-amber-400"
                    />
                    <button
                      type="submit"
                      disabled={!guessInput.trim()}
                      className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 disabled:bg-gray-400 font-bold transition transform hover:scale-105 shadow-lg"
                    >
                      Guess
                    </button>
                  </div>
                </form>
              )}

            {gameState.currentPhase === "SCORE_PHASE" && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-emerald-100">
                <h2 className="text-2xl font-bold mb-4 text-emerald-900" style={{ fontFamily: "Georgia, serif" }}>Round Complete</h2>
                <p className="text-emerald-800 font-medium">
                  Scores have been updated. Prepare for the next round!
                </p>
              </div>
            )}

            {gameState.currentPhase === "ASSIGN_ROLES" && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border-4 border-teal-100">
                <h2 className="text-2xl font-bold mb-4 text-teal-900" style={{ fontFamily: "Georgia, serif" }}>Roles Assigned</h2>
                <p className="text-teal-800 font-medium">
                  Roles are being assigned. Get ready to play!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
