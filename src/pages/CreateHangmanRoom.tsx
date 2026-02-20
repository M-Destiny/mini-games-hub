import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const CATEGORIES = ['animals', 'fruits', 'countries', 'movies', 'sports'];
const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6];

export default function CreateHangmanRoom() {
  const navigate = useNavigate();
  const { createRoom } = useSocket();
  
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [category, setCategory] = useState('animals');
  const [rounds, setRounds] = useState(3);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;
    
    createRoom(playerName.trim(), roomName.trim(), 'hangman', {
      category,
      rounds,
      roundTime: 0,
    });
    navigate('/hangman/room');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">🏴 Hangman</h1>
          <p className="text-gray-400">Create a new room!</p>
        </div>

        <form onSubmit={handleCreate} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 space-y-6">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Friday Night Games"
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rounds</label>
            <div className="flex gap-2">
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                    rounds === r ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!playerName.trim() || !roomName.trim()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg font-bold text-lg transition-all disabled:opacity-50"
          >
            Create Room 🎉
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            Want to join an existing room?{' '}
            <button onClick={() => navigate('/hangman/join')} className="text-purple-400 hover:text-purple-300 font-medium">
              Join Room
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
