import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

const DEFAULT_WORDS = [
  'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house',
  'island', 'jungle', 'kite', 'lamp', 'mountain', 'notebook', 'ocean', 'pizza',
  'queen', 'rainbow', 'sunflower', 'tree', 'umbrella', 'volcano', 'waterfall', 'xylophone',
  'yacht', 'zebra', 'airplane', 'butterfly', 'castle', 'dragon', 'fireworks', 'galaxy',
];

const ROUND_OPTIONS = [1, 2, 3, 4, 5, 6];
const TIME_OPTIONS = [30, 60, 80, 100, 120];

export default function CreateRoom() {
  const navigate = useNavigate();
  const { createRoom } = useSocket();
  
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [customWordsInput, setCustomWordsInput] = useState('');
  const [rounds, setRounds] = useState(3);
  const [roundTime, setRoundTime] = useState(80);
  const [useCustomWords, setUseCustomWords] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !roomName.trim()) return;
    
    // Parse custom words
    let customWords: string[] = [];
    if (useCustomWords && customWordsInput.trim()) {
      customWords = customWordsInput
        .split(',')
        .map(w => w.trim().toLowerCase())
        .filter(w => w.length > 0);
    }
    
    // Store game settings in sessionStorage for the game to use
    sessionStorage.setItem('gameSettings', JSON.stringify({
      customWords,
      rounds,
      roundTime,
    }));
    
    createRoom(playerName.trim(), roomName.trim(), {
      customWords: customWords.length > 0 ? customWords : DEFAULT_WORDS,
      rounds,
      roundTime,
    });
    navigate('/scribble/room');
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">🎨 Scribble</h1>
          <p className="text-gray-400">Create a new room and invite friends!</p>
        </div>

        <form onSubmit={handleCreate} className="bg-gray-800 rounded-2xl p-8 border border-gray-700 space-y-6">
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Room Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Friday Night Games"
              maxLength={30}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Game Settings */}
          <div className="border-t border-gray-700 pt-6">
            <h3 className="text-lg font-bold mb-4">⚙️ Game Settings</h3>
            
            {/* Rounds */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Rounds
              </label>
              <div className="flex gap-2">
                {ROUND_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRounds(r)}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      rounds === r
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Time per Round */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time per Round
              </label>
              <div className="flex gap-2 flex-wrap">
                {TIME_OPTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRoundTime(t)}
                    className={`py-2 px-3 rounded-lg font-medium transition-all ${
                      roundTime === t
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Words Toggle */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div 
                  className={`w-12 h-6 rounded-full transition-colors ${
                    useCustomWords ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                  onClick={() => setUseCustomWords(!useCustomWords)}
                >
                  <div 
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      useCustomWords ? 'translate-x-6' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-300">
                  Use custom words
                </span>
              </label>
              
              {useCustomWords && (
                <div className="mt-3">
                  <textarea
                    value={customWordsInput}
                    onChange={(e) => setCustomWordsInput(e.target.value)}
                    placeholder="Enter words separated by commas&#10;e.g., cat, dog, elephant, pizza"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use default words
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!playerName.trim() || !roomName.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Room 🎉
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500">
            Want to join an existing room?{' '}
            <button
              onClick={() => navigate('/scribble/join')}
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              Join Room
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
