import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function JoinWordChainRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinRoom } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState(searchParams.get('room') || '');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomId.trim()) return;

    setError('');
    joinRoom(roomId.trim().toUpperCase(), playerName.trim());
    
    // Give time for socket to respond
    setTimeout(() => {
      navigate('/wordchain/room');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">🔤 Word Chain</h1>
          <p className="text-gray-400">Join a room!</p>
        </div>

        <form onSubmit={handleJoin} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 space-y-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Code</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={10}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl font-mono"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-lg"
          >
            Join Room 🚀
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Want to create a new room?{' '}
            <button
              onClick={() => navigate('/wordchain/create')}
              className="text-purple-400 hover:text-purple-300"
            >
              Create Room
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
