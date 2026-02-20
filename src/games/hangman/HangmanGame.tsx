import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const HANGMAN_PARTS = [
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.arc(x, y - 40, 20, 0, Math.PI * 2); ctx.stroke(); },
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x, y + 30); ctx.stroke(); },
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x - 20, y + 15); ctx.stroke(); },
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y - 10); ctx.lineTo(x + 20, y + 15); ctx.stroke(); },
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x - 15, y + 55); ctx.stroke(); },
  (ctx: CanvasRenderingContext2D, x: number, y: number) => { ctx.beginPath(); ctx.moveTo(x, y + 30); ctx.lineTo(x + 15, y + 55); ctx.stroke(); },
];

const HOW_TO_PLAY = {
  steps: [
    "One person thinks of a word.",
    "The word is shown as blank lines.",
    "Everyone guesses letters.",
    "6 wrong guesses = game over!",
    "Correct guess = 100 points!"
  ]
};

export default function HangmanGame() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const { 
    room, players, currentPlayer, messages, currentWord, timeLeft,
    isGameStarted, isHost, guessedLetters, wrongGuesses,
    leaveRoom: socketLeaveRoom, startGame, sendHangmanGuess,
  } = useSocket();

  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<{name: string, score: number} | null>(null);

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

    ctx.beginPath();
    ctx.moveTo(20, h - 10);
    ctx.lineTo(180, h - 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(40, h - 10);
    ctx.lineTo(40, 30);
    ctx.lineTo(100, 30);
    ctx.lineTo(100, 50);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(100, 50);
    ctx.lineTo(100, 70);
    ctx.stroke();

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
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">🏴 Hangman</h1>
          <span className="text-gray-400 text-sm">{room.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {isGameStarted && <span className="text-red-400 font-bold">{timeLeft}s</span>}
          <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-white">❓</button>
          <button onClick={handleLeave} className="text-gray-400 hover:text-red-400">✕</button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <p className="text-gray-400 text-sm mb-2">Guess: {getDisplayWord()}</p>
          <p className="text-red-400 text-sm mb-4">Wrong: {wrongGuesses}/6</p>
          
          <canvas ref={canvasRef} width={350} height={300} className="bg-white rounded-xl mb-6" />

          <div className="flex flex-wrap justify-center gap-1 max-w-md">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => {
              const isGuessed = guessedLetters.includes(letter);
              const isWrong = !currentWord.includes(letter) && isGuessed;
              return (
                <button key={letter} onClick={() => handleGuess(letter)} disabled={isGuessed || isGameOver}
                  className={`w-10 h-10 rounded font-bold text-sm ${isGuessed ? (isWrong ? 'bg-red-600' : 'bg-green-600') : 'bg-gray-700 hover:bg-gray-600'}`}>
                  {letter}
                </button>
              );
            })}
          </div>

          {isGameOver && (
            <div className="mt-6 text-center">
              <p className="text-2xl font-bold">{winner ? `${winner.name} wins!` : 'Game Over!'}</p>
              <p className="text-gray-400 mt-2">Word: {currentWord}</p>
              <button onClick={handleStart} className="mt-4 px-6 py-2 bg-emerald-500 rounded-lg font-bold">Play Again</button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-64 bg-gray-800 p-4 flex flex-col">
          <h3 className="font-bold mb-3">Players</h3>
          <div className="space-y-2 mb-4">
            {players.map((p) => (
              <div key={p.id} className="flex justify-between bg-gray-700/50 px-3 py-2 rounded">
                <span>{p.name}</span>
                <span className="text-purple-400">{p.score}</span>
              </div>
            ))}
          </div>
          
          <h3 className="font-bold mb-3">Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((msg) => (
              <div key={msg.id} className="text-sm bg-gray-700/50 px-2 py-1 rounded">
                <span className="font-bold">{msg.playerName}: </span>
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lobby */}
      {!isGameStarted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">Room Lobby</h2>
            <div className="mb-4">
              <p className="text-gray-400 mb-2 text-sm">Room Code:</p>
              <div className="flex gap-2">
                <input type="text" value={room.id} readOnly className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-2xl font-mono" />
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/hangman/join?room=${room.id}`)} className="px-4 bg-purple-500 rounded-lg">📋</button>
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
              <button onClick={handleStart} disabled={players.length < 1} className="w-full py-3 bg-emerald-500 rounded-lg font-bold disabled:opacity-50">Start</button>
            ) : (
              <div className="w-full py-3 bg-gray-700 rounded-lg text-center text-gray-400">Waiting...</div>
            )}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              {HOW_TO_PLAY.steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
            <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-3 bg-blue-500 rounded-lg font-bold">Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}
