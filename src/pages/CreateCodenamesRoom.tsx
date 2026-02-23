import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function CreateCodenamesRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(false);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;

    setLoading(true);
    const socket = io(SOCKET_URL);
    
    socket.emit('create-room', { 
      playerName, 
      roomName, 
      gameType: 'codenames',
      settings: {}
    }, (response: any) => {
      if (response.success) {
        navigate(`/codenames/room?roomId=${response.room.id}&playerName=${playerName}`);
      }
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">🎯 Codenames</h1>
        <p className="text-gray-400 text-center mb-6">Create a new room</p>

        <form onSubmit={createRoom} className="space-y-4">
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
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Room'}
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
