import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';

export default function CreateCodenamesRoom() {
  const navigate = useNavigate();
  const { createRoom } = useContext(SocketContext)!;
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;
    
    createRoom(playerName, roomName, 'codenames', {});
    
    // Navigate after a short delay to allow socket to connect
    setTimeout(() => {
      const urlParams = new URLSearchParams({ playerName });
      navigate(`/codenames/room?${urlParams.toString()}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">🎯 Codenames</h1>
        <p className="text-gray-400 text-center mb-6">Create a new room</p>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-lg"
          >
            Create Room
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/codenames/join" className="text-gray-400 hover:text-white">
            Or join existing room →
          </a>
        </div>
      </div>
    </div>
  );
}
