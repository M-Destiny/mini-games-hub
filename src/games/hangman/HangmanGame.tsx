import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const HANGMAN_PARTS = [
  // Head
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.arc(x, y - 40, 20, 0, Math.PI * 2); ctx.stroke(); },
  // Body
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 30); ctx.stroke(); },
  // Left Arm
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x - 20, y + 15); ctx.stroke(); },
  // Right Arm
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 20, y + 15); ctx.stroke(); },
  // Left Leg
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x - 15, y + 55); ctx.stroke(); },
  // Right Leg
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x + 15, y + 55); ctx.stroke(); },
];

export default function HangmanGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    room, players, currentPlayer, messages, currentWord,
    isGameStarted, isHost, guessedLetters, wrongGuesses,
    leaveRoom: socketLeaveRoom, startGame, sendHangmanGuess,
  } = useSocket();

  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<{name: string, score: number} | null>(null);
  
  const keyboardLayout = [
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM',
  ];

  // Draw hangman
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e74c3c';
    ctx.lineCap = 'round';

    // Base
    ctx.beginPath();
    ctx.moveTo(20, h - 10);
    ctx.lineTo(180, h - 10);
    ctx.stroke();

    // Pole
    ctx.beginPath();
    ctx.moveTo(40, h - 10);
    ctx.lineTo(40, 30);
    ctx.lineTo(100, 30);
    ctx.lineTo(100, 50);
    ctx.stroke();

    // Rope
    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(100, 70);
    ctx.stroke();

    // Draw wrong parts
    for (let i = 0; i < wrongGuesses && i < HANGMAN_PARTS.length; i++) {
      HANGMAN_PARTS[i](ctx, 100, 90);
    }
  }, [wrongGuesses]);

  const handleLeave = () => {
    socketLeaveRoom();
    navigate('/');
  };

  const handleGuess = (letter: string) => {
    if (guessedLetters.includes(letter) || isGameOver) return;
    sendHangmanGuess(letter);
  };

  const getDisplayWord = () => {
    if (!currentWord) return '';
    return currentWord.split('').map(l => guessedLetters.includes(l) ? l : '_').join(' ');
  };

  const handleStart = () => {
    setIsGameOver(false);
    setWinner(null);
    startGame();
  };

  // Check for game over from messages
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.message?.includes('wins') || lastMsg?.message?.includes('Game Over')) {
      setIsGameOver(true);
      if (lastMsg.message.includes('wins')) {
        const name = lastMsg.message.split(' wins')[0];
        setWinner({ name, score: 100 });
      }
    }
  }, [messages]);

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">🏴 Hangman</h1>
          <span className="font-mono text-sm">{room.name}</span>
          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs">{room.id}</span>
        </div>
        <button onClick={handleLeave} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">
          ✕ Exit
        </button>
      </header>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Area */}
        <div className="flex-1 p-4 flex flex-col items-center">
          {/* Word */}
          <div className="mb-4">
            <p className="text-gray-400 text-sm">Guess the word:</p>
            <p className="text-3xl font-bold tracking-widest mt-1">{getDisplayWord()}</p>
            <p className="text-red-400 text-sm mt-1">Wrong guesses: {wrongGuesses}/6</p>
          </div>

          {/* Canvas */}
          <canvas ref={canvasRef} width={200} height={180} className="bg-white rounded-xl mb-4" />

          {/* Game Over */}
          {isGameOver && (
            <div className={`p-4 rounded-xl text-center mb-4 ${winner ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
              <p className="text-xl font-bold">{winner ? `🎉 ${winner.name} wins!` : 'Game Over!'}</p>
              <p className="text-gray-300 mt-1">Word: {currentWord}</p>
              <button onClick={handleStart} className="mt-3 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-bold">
                Play Again
              </button>
            </div>
          )}

          {/* Keyboard */}
          {!isGameOver && (
            <div className="space-y-2">
              {keyboardLayout.map((row, i) => (
                <div key={i} className="flex justify-center gap-1">
                  {row.split('').map(letter => {
                    const isGuessed = guessedLetters.includes(letter);
                    return (
                      <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={isGuessed || isGameOver}
                        className={`w-10 h-12 rounded font-bold ${
                          isGuessed 
                            ? (currentWord?.includes(letter) ? 'bg-green-500/50' : 'bg-red-500/50')
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        {letter}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-bold">Players ({players.length})</h3>
            <div className="space-y-1 mt-2 max-h-32 overflow-y-auto">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.id === currentPlayer?.id && <span className="text-xs bg-purple-500/30 px-1.5 py-0.5 rounded">You</span>}
                    {p.id === room.hostId && <span className="text-xs bg-yellow-500/30 text-yellow-300 px-1.5 py-0.5 rounded">👑</span>}
                  </div>
                  <span className="font-bold text-emerald-400">{p.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`px-3 py-2 rounded-lg text-sm ${msg.playerId === 'system' ? 'bg-gray-700/50 text-center' : msg.playerId === currentPlayer?.id ? 'bg-purple-500/20' : 'bg-gray-700/50'}`}>
                <span className="font-bold">{msg.playerName}: </span>
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lobby */}
      {!isGameStarted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-center">Room Lobby</h2>
            
            <div className="mb-4">
              <p className="text-gray-400 mb-2 text-sm">Room Code:</p>
              <div className="flex gap-2">
                <input type="text" value={room.id} readOnly className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-2xl font-mono" />
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/hangman/join?room=${room.id}`)} className="px-4 bg-purple-500 hover:bg-purple-400 rounded-lg">📋</button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-2 text-sm">Players:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg">
                    <span>{p.name}</span>
                    {p.id === currentPlayer?.id && <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded">You</span>}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button onClick={handleStart} disabled={players.length < 1} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-lg font-bold disabled:opacity-50">
                Start Game 🚀
              </button>
            ) : (
              <div className="w-full py-3 bg-gray-700 rounded-lg font-bold text-center text-gray-400">
                Waiting for host...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
