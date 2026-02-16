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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
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
                  className="bg-white rounded-lg shadow p-6"
                >
                  <h2 className="text-xl font-bold mb-4">Guess the Word</h2>
                  <p className="text-gray-600 mb-4">
                    Use the clues you heard to guess the word
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      placeholder="Enter your guess..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!guessInput.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                    >
                      Guess
                    </button>
                  </div>
                </form>
              )}

            {gameState.currentPhase === "SCORE_PHASE" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Round Complete</h2>
                <p className="text-gray-600">
                  Scores have been updated. Prepare for the next round!
                </p>
              </div>
            )}

            {gameState.currentPhase === "ASSIGN_ROLES" && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Roles Assigned</h2>
                <p className="text-gray-600">
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
