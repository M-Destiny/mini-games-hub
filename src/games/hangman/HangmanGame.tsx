import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const WORD_CATEGORIES = {
  animals: ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'KANGAROO', 'BUTTERFLY', 'Rhinoceros', 'Crocodile', 'Hippopotamus', 'Octopus'],
  fruits: ['APPLE', 'BANANA', 'ORANGE', 'WATERMELON', 'STRAWBERRY', 'PINEAPPLE', 'BLUEBERRY', 'RASPBERRY', 'CHERRY', 'MANGO'],
  countries: ['AMERICA', 'CANADA', 'BRAZIL', 'GERMANY', 'AUSTRALIA', 'JAPAN', 'CHINA', 'INDIA', 'FRANCE', 'ITALY'],
  movies: ['AVENGERS', 'TITANIC', 'FROZEN', 'SPIDERMAN', 'BATMAN', 'IRONMAN', 'JURASSIC', 'STARWARS', 'MATRIX', 'GLADIATOR'],
  sports: ['FOOTBALL', 'CRICKET', 'TENNIS', 'BASKETBALL', 'BASEBALL', 'HOCKEY', 'GOLF', 'SWIMMING', 'BOXING', 'RUGBY'],
};

const CATEGORY_KEYS = Object.keys(WORD_CATEGORIES);

const HANGMAN_PARTS = [
  // Head
  (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.beginPath();
    ctx.arc(x, y - 60 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.stroke();
  },
  // Body
  (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 35 * scale);
    ctx.lineTo(x, y + 30 * scale);
    ctx.stroke();
  },
  // Left Arm
  (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 20 * scale);
    ctx.lineTo(x - 25 * scale, y + 10 * scale);
    ctx.stroke();
  },
  // Right Arm
  (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 20 * scale);
    ctx.lineTo(x + 25 * scale, y + 10 * scale);
    ctx.stroke();
  },
  // Left Leg
  (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + 30 * scale);
    ctx.lineTo(x - 20 * scale, y + 60 * scale);
    ctx.stroke();
  },
  // Right Leg
  (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y + 30 * scale);
    ctx.lineTo(x + 20 * scale, y + 60 * scale);
    ctx.stroke();
  },
];

const ALL_WORDS = Object.values(WORD_CATEGORIES).flat();

export default function HangmanGame() {
  const navigate = useNavigate();
  const { 
    room, 
    players, 
    currentPlayer, 
    timeLeft,
    leaveRoom: socketLeaveRoom, 
  } = useSocket();

  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [score, setScore] = useState(0);
  const [keyboardLayout] = useState([
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM',
  ]);

  const maxWrong = HANGMAN_PARTS.length;

  useEffect(() => {
    if (!selectedCategory && CATEGORY_KEYS.length > 0) {
      setSelectedCategory(CATEGORY_KEYS[0]);
    }
  }, [selectedCategory]);

  const startNewRound = useCallback(() => {
    const words = selectedCategory ? WORD_CATEGORIES[selectedCategory as keyof typeof WORD_CATEGORIES] : ALL_WORDS;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setWord(randomWord);
    setGuessedLetters(new Set());
    setWrongGuesses(0);
    setIsGameOver(false);
    setIsWinner(false);
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory) {
      startNewRound();
    }
  }, [selectedCategory, startNewRound]);

  const handleGuess = (letter: string) => {
    if (isGameOver || guessedLetters.has(letter)) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    if (!word.includes(letter)) {
      const newWrong = wrongGuesses + 1;
      setWrongGuesses(newWrong);
      
      if (newWrong >= maxWrong) {
        setIsGameOver(true);
        setIsWinner(false);
      }
    } else {
      // Check if won
      const isWinner = word.split('').every(l => newGuessed.has(l));
      if (isWinner) {
        setIsGameOver(true);
        setIsWinner(true);
        // Calculate score based on remaining time and wrong guesses
        const roundScore = Math.max(100 - (wrongGuesses * 10) + (timeLeft || 0), 10);
        setScore(prev => prev + roundScore);
      }
    }
  };

  const handleLeave = () => {
    socketLeaveRoom();
    navigate('/');
  };

  const getDisplayWord = () => {
    return word.split('').map(letter => guessedLetters.has(letter) ? letter : '_').join(' ');
  };

  // Draw hangman
  useEffect(() => {
    const canvas = document.getElementById('hangman-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const scale = w / 200;

    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Base
    ctx.beginPath();
    ctx.moveTo(20 * scale, h - 10 * scale);
    ctx.lineTo(180 * scale, h - 10 * scale);
    ctx.stroke();

    // Pole
    ctx.beginPath();
    ctx.moveTo(40 * scale, h - 10 * scale);
    ctx.lineTo(40 * scale, 20 * scale);
    ctx.lineTo(100 * scale, 20 * scale);
    ctx.lineTo(100 * scale, 35 * scale);
    ctx.stroke();

    // Rope
    ctx.beginPath();
    ctx.moveTo(100 * scale, 35 * scale);
    ctx.lineTo(100 * scale, 60 * scale);
    ctx.stroke();

    // Draw wrong parts
    for (let i = 0; i < wrongGuesses && i < HANGMAN_PARTS.length; i++) {
      HANGMAN_PARTS[i](ctx, 100 * scale, 75 * scale, scale);
    }
  }, [wrongGuesses]);

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-4">
          <h1 className="text-lg lg:text-xl font-bold">🏴 Hangman</h1>
          <span className="font-mono text-sm">{room.name}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-gray-700 px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-gray-400 text-sm ml-2">pts</span>
          </div>
          <button
            onClick={handleLeave}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
          >
            ✕ Exit
          </button>
        </div>
      </header>

      {/* Main Game */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Game Area */}
        <div className="flex-1 p-4 flex flex-col items-center">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-400 mb-2">Category:</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {CATEGORY_KEYS.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Hangman Canvas */}
          <canvas
            id="hangman-canvas"
            width={300}
            height={250}
            className="mb-6 bg-white rounded-xl"
          />

          {/* Word Display */}
          <div className="mb-8">
            <p className="text-gray-400 text-sm mb-2 text-center">
              {isGameOver && !isWinner && `The word was: ${word}`}
            </p>
            <p className="text-3xl md:text-4xl font-bold tracking-widest text-center">
              {getDisplayWord()}
            </p>
          </div>

          {/* Wrong Guesses */}
          <div className="mb-4 text-center">
            <p className="text-gray-400">
              Wrong guesses: <span className="text-red-400 font-bold">{wrongGuesses}</span> / {maxWrong}
            </p>
          </div>

          {/* Game Over Message */}
          {isGameOver && (
            <div className={`mb-6 p-4 rounded-xl text-center ${
              isWinner ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
            }`}>
              <p className="text-2xl font-bold">
                {isWinner ? '🎉 You Won!' : '💀 Game Over!'}
              </p>
              <p className="text-gray-300 mt-2">
                {isWinner ? `+${Math.max(100 - (wrongGuesses * 10) + (timeLeft || 0), 10)} points` : `The word was: ${word}`}
              </p>
              <button
                onClick={startNewRound}
                className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-400 rounded-lg font-bold"
              >
                Next Word →
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col max-h-[50vh] lg:max-h-none">
          {/* Keyboard */}
          <div className="p-4 flex-1 overflow-y-auto">
            <h3 className="font-bold mb-4">Keyboard</h3>
            <div className="space-y-2">
              {keyboardLayout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-1">
                  {row.split('').map(letter => {
                    const isGuessed = guessedLetters.has(letter);
                    const isCorrect = word.includes(letter);
                    let bgClass = 'bg-gray-700 hover:bg-gray-600';
                    
                    if (isGuessed) {
                      bgClass = isCorrect ? 'bg-green-500/30' : 'bg-red-500/30';
                    }
                    
                    return (
                      <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={isGuessed || isGameOver}
                        className={`w-8 h-10 md:w-10 md:h-12 rounded font-bold text-sm md:text-base transition-all ${
                          isGuessed ? 'opacity-50' : ''
                        } ${bgClass} ${!isGuessed && !isGameOver ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="p-4 border-t border-gray-700">
            <h3 className="font-bold mb-3">Players ({players.length})</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span>{player.name}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">You</span>
                    )}
                  </div>
                  <span className="font-bold text-purple-400">{player.score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
