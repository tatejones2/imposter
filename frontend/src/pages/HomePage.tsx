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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      {/* Geometric decoration circles */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-amber-200 rounded-full opacity-30"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-teal-200 rounded-full opacity-20"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full relative z-10 border-4 border-amber-100">
        <h1 className="text-5xl font-bold text-center mb-2 text-amber-900" style={{ fontFamily: "Georgia, serif" }}>
          Imposter
        </h1>
        <p className="text-center text-amber-700 mb-8 text-lg font-medium">
          Find the imposter & guess the secret word!
        </p>

        {!isConnected && (
          <div className="mb-6 p-4 bg-red-100 border-2 border-red-400 rounded-lg text-red-800 text-sm font-medium">
            Connecting to server...
          </div>
        )}

        {!mode ? (
          <div className="space-y-4 flex flex-col">
            <button
              onClick={() => setMode("create")}
              disabled={!isConnected}
              className="w-full py-4 bg-amber-300 hover:bg-amber-200 text-amber-900 rounded-xl disabled:bg-gray-300 font-bold text-lg transition transform hover:scale-105 shadow-xl border-3 border-amber-400 hover:border-amber-300"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode("join")}
              disabled={!isConnected}
              className="w-full py-4 bg-teal-300 hover:bg-teal-200 text-teal-900 rounded-xl disabled:bg-gray-300 font-bold text-lg transition transform hover:scale-105 shadow-xl border-3 border-teal-400 hover:border-teal-300"
            >
              Join Room
            </button>
          </div>
        ) : mode === "create" ? (
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900 placeholder-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border-2 border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-50 text-amber-900 placeholder-amber-400"
              />
            </div>
            <button
              type="submit"
              disabled={!roomName.trim() || !playerName.trim()}
              className="w-full py-4 bg-amber-300 hover:bg-amber-200 text-amber-900 rounded-xl disabled:bg-gray-300 font-bold transition transform hover:scale-105 shadow-xl border-3 border-amber-400 hover:border-amber-300"
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-3 bg-gray-300 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition border-2 border-gray-400"
            >
              Back
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-teal-900 mb-2">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
                className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-50 text-teal-900 placeholder-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-teal-900 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-50 text-teal-900 placeholder-teal-400"
              />
            </div>
            <button
              type="submit"
              disabled={!roomId.trim() || !playerName.trim()}
              className="w-full py-4 bg-teal-300 hover:bg-teal-200 text-teal-900 rounded-xl disabled:bg-gray-300 font-bold transition transform hover:scale-105 shadow-xl border-3 border-teal-400 hover:border-teal-300"
            >
              Join Room
            </button>
            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-3 bg-gray-300 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition border-2 border-gray-400"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
