import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function CreateWordChainRoom() {
  const navigate = useNavigate();
  const { createRoom } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [rounds, setRounds] = useState(3);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    createRoom(playerName.trim(), roomName.trim() || 'Word Chain Room', 'wordchain', {
      rounds,
      roundTime: 0,
    });
    navigate('/wordchain/room');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">🔤 Word Chain</h1>
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Room Name (optional)</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="My Room"
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Number of Rounds</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRounds(r)}
                  className={`flex-1 py-2 rounded-lg font-bold transition ${
                    rounds === r
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-lg"
          >
            Create Room 🎮
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have a room?{' '}
            <button
              onClick={() => navigate('/wordchain/join')}
              className="text-purple-400 hover:text-purple-300"
            >
              Join Room
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
