import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function JoinHangmanRoom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinRoom } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    const roomId = searchParams.get('room');
    if (roomId) setRoomCode(roomId.toUpperCase());
  }, [searchParams]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCode.trim()) return;
    
    joinRoom(roomCode.trim().toUpperCase(), playerName.trim());
    navigate('/hangman/room');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">🏴 Hangman</h1>
          <p className="text-gray-400">Join an existing room!</p>
        </div>

        <form onSubmit={handleJoin} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 space-y-6">
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
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-2xl font-mono tracking-widest"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!playerName.trim() || !roomCode.trim()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
          >
            Join Room 🚀
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            Want to create a new room?{' '}
            <button onClick={() => navigate('/hangman/create')} className="text-purple-400 hover:text-purple-300 font-medium">
              Create Room
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
