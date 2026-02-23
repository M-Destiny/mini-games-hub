import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export default function JoinCodenamesRoom() {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomId.trim()) return;

    setLoading(true);
    setError('');
    const socket = io(SOCKET_URL);
    
    socket.emit('join-room', { playerName, roomId: roomId.toUpperCase() }, (response: any) => {
      if (response.success) {
        navigate(`/codenames/room?roomId=${roomId.toUpperCase()}&playerName=${playerName}`);
      } else {
        setError(response.error || 'Failed to join room');
      }
      setLoading(false);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2">🎯 Codenames</h1>
        <p className="text-gray-400 text-center mb-6">Join a room</p>

        <form onSubmit={joinRoom} className="space-y-4">
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
            <label className="block text-sm text-gray-400 mb-1">Room Code</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg uppercase"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Joining...' : 'Join Room'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/codenames/create" className="text-gray-400 hover:text-white">
            Or create new room →
          </a>
        </div>
      </div>
    </div>
  );
}
