import { useState } from "react";
import { SocketProvider } from "./context/SocketContext";
import { useGameState } from "./hooks/useGameState";
import { HomePage } from "./pages/HomePage";
import { LobbyPage } from "./pages/LobbyPage";
import { GamePage } from "./pages/GamePage";

function AppContent() {
  const {
    room,
    gameState,
    playerRole,
    word,
    players,
    startGame,
    submitClue,
    submitVote,
    guessWord,
    leaveRoom,
  } = useGameState();

  const [currentPage, setCurrentPage] = useState<"home" | "lobby" | "game">(
    "home",
  );

  const handleRoomCreated = () => {
    setCurrentPage("lobby");
  };

  const handleRoomJoined = () => {
    setCurrentPage("lobby");
  };

  const handleStartGame = () => {
    if (room) {
      startGame(room.id);
      setCurrentPage("game");
    }
  };

  const handleLeaveRoom = () => {
    if (room) {
      leaveRoom(room.id);
    }
    setCurrentPage("home");
  };

  if (currentPage === "home") {
    return (
      <HomePage
        onRoomCreated={handleRoomCreated}
        onRoomJoined={handleRoomJoined}
      />
    );
  }

  if (currentPage === "lobby" && room) {
    return (
      <LobbyPage
        room={room}
        isHost={room.hostId === players[0]?.id}
        currentPlayerId={players[0]?.id}
        onStartGame={handleStartGame}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (currentPage === "game" && gameState) {
    return (
      <GamePage
        gameState={gameState}
        playerRole={playerRole}
        word={word}
        currentPlayerId={players[0]?.id}
        onSubmitClue={(clue) => submitClue(gameState.roomId, clue)}
        onSubmitVote={(votedForId) => submitVote(gameState.roomId, votedForId)}
        onGuessWord={(wordGuess) => guessWord(gameState.roomId, wordGuess)}
      />
    );
  }

  return (
    <HomePage
      onRoomCreated={handleRoomCreated}
      onRoomJoined={handleRoomJoined}
    />
  );
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App;
