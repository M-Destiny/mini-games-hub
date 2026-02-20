import { Link } from 'react-router-dom';

const games = [
  {
    id: 'scribble',
    name: 'Scribble',
    description: 'Draw and guess words with your friends!',
    icon: '🎨',
    color: 'from-pink-500 to-rose-500',
    status: 'Ready',
    link: '/scribble',
  },
  {
    id: 'hangman',
    name: 'Hangman',
    description: 'Classic word guessing game',
    icon: '🏴',
    color: 'from-emerald-500 to-teal-500',
    status: 'Ready',
    link: '/hangman',
  },
  {
    id: 'wordchain',
    name: 'Word Chain',
    description: 'Connect words by matching the last letter',
    icon: '🔤',
    color: 'from-purple-500 to-indigo-500',
    status: 'Ready',
    link: '/wordchain',
  },
  {
    id: 'trivia',
    name: 'Trivia Quiz',
    description: 'Test your knowledge in group quizzes!',
    icon: '❓',
    color: 'from-amber-500 to-orange-500',
    status: 'Ready',
    link: '/trivia',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-6">
            🎮 Mini Games Hub
          </h1>
          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto">
            Play multiplayer games with friends! Just share the link and start playing. No downloads needed.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-white/60 flex-wrap">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Free to Play
            </span>
            <span>•</span>
            <span>No Account Required</span>
            <span>•</span>
            <span>Real-time Multiplayer</span>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Choose a Game</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((game) => (
            <Link
              key={game.id}
              to={game.link}
              className={`group relative overflow-hidden rounded-2xl bg-gray-800 border border-gray-700 hover:border-gray-600 transition-all hover:scale-[1.02] hover:shadow-2xl ${
                game.status !== 'Ready' ? 'opacity-60' : ''
              }`}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
              
              <div className="relative p-6">
                <div className="text-5xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{game.description}</p>
                
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  game.status === 'Ready' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-600/50 text-gray-400'
                }`}>
                  {game.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-800/50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Play Here?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                🔗
              </div>
              <h3 className="text-xl font-bold mb-2">Shareable Links</h3>
              <p className="text-gray-400">Just share your room link and friends can join instantly!</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                👥
              </div>
              <h3 className="text-xl font-bold mb-2">No Limits</h3>
              <p className="text-gray-400">No player limits! Invite as many friends as you want.</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                ⚡
              </div>
              <h3 className="text-xl font-bold mb-2">Real-time</h3>
              <p className="text-gray-400">Smooth real-time gameplay with no lag or delays.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm">
        <p className="mb-2">Made with ❤️ by Destiny & Clawe 🐾</p>
        <p className="text-xs">The best assistant in the world</p>
      </footer>
    </div>
  );
}
