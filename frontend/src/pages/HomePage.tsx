import React, { useState } from "react";
import { useGameState } from "../hooks/useGameState";
import { useSocket } from "../context/SocketContext";

interface HomePageProps {
  // eslint-disable-next-line no-unused-vars
  onRoomCreated: (roomId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRoomJoined: (roomId: string) => void;
}

export function HomePage({
  onRoomCreated: _onRoomCreated,
  onRoomJoined: _onRoomJoined,
}: HomePageProps) {
  const { createRoom, joinRoom } = useGameState();
  const { isConnected } = useSocket();
  const [mode, setMode] = useState<"create" | "join" | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && playerName.trim()) {
      createRoom(roomName, playerName);
      _onRoomCreated(roomName);
      setMode(null);
      setRoomName("");
      setPlayerName("");
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && playerName.trim()) {
      joinRoom(roomId, playerName);
      _onRoomJoined(roomId);
      setMode(null);
      setRoomId("");
      setPlayerName("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          Imposter
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Find the imposter and guess the secret word!
        </p>

        {!isConnected && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-sm">
            Connecting to server...
          </div>
        )}

        {!mode ? (
          <div className="space-y-4">
            <button
              onClick={() => setMode("create")}
              disabled={!isConnected}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode("join")}
              disabled={!isConnected}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold transition"
            >
              Join Room
            </button>
          </div>
        ) : mode === "create" ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={!roomName.trim() || !playerName.trim()}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold transition"
            >
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              type="submit"
              disabled={!roomId.trim() || !playerName.trim()}
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold transition"
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-semibold transition"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
