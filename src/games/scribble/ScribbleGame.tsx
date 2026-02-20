import { useState, useRef, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import type { DrawingPoint } from '../../types';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
  '#FF0088', '#00FF88',
];

const BRUSH_SIZES = [2, 4, 6, 8, 12];

export default function ScribbleGame() {
  const { 
    room, 
    players, 
    currentPlayer, 
    messages, 
    currentWord, 
    timeLeft, 
    isDrawer,
    isGameStarted,
    leaveRoom, 
    startGame,
    sendDraw,
    sendGuess,
    // sendMessage,
  } = useSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [guess, setGuess] = useState('');
  const [showWord, setShowWord] = useState(false);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    setIsDrawing(true);
    
    const point = getCanvasPoint(e);
    const drawPoint: DrawingPoint = {
      x: point.x,
      y: point.y,
      color: currentColor,
      width: brushSize,
    };
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    sendDraw(drawPoint);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    const drawPoint: DrawingPoint = {
      x: point.x,
      y: point.y,
      color: currentColor,
      width: brushSize,
    };
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    sendDraw(drawPoint);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    sendGuess(guess.trim());
    setGuess('');
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/scribble/join?room=${room?.id}`;
    navigator.clipboard.writeText(link);
    alert('Room link copied to clipboard!');
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">🎨 Scribble</h1>
          <span className="text-gray-400">|</span>
          <span className="font-mono text-lg">{room.name}</span>
          <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
            {room.id}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {isGameStarted && (
            <div className="flex items-center gap-2 bg-gray-700 px-4 py-2 rounded-lg">
              <span className="text-2xl">⏱️</span>
              <span className="text-2xl font-bold">{timeLeft}</span>
            </div>
          )}
          <button
            onClick={leaveRoom}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <div className="flex-1 flex">
        {/* Canvas Area */}
        <div className="flex-1 p-4 flex flex-col">
          {isGameStarted && isDrawer && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mb-4 text-center">
              <p className="text-purple-300">You're drawing!</p>
              <p className="text-2xl font-bold mt-1">
                {showWord ? currentWord : currentWord.replace(/./g, '_ ')}
              </p>
              <button
                onClick={() => setShowWord(!showWord)}
                className="text-sm text-purple-400 mt-2 underline"
              >
                {showWord ? 'Hide' : 'Show'} Word
              </button>
            </div>
          )}

          {isGameStarted && !isDrawer && (
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-4 text-center">
              <p className="text-blue-300">Guess the word!</p>
              <p className="text-2xl font-bold mt-1">
                {currentWord.replace(/./g, '_ ')}
              </p>
            </div>
          )}

          <div className="flex-1 bg-white rounded-xl overflow-hidden">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className={`w-full h-full ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'}`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Drawing Tools */}
          {isDrawer && isGameStarted && (
            <div className="mt-4 flex items-center gap-4 bg-gray-800 p-4 rounded-xl">
              {/* Colors */}
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      currentColor === color ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="w-px h-8 bg-gray-600"></div>

              {/* Brush Sizes */}
              <div className="flex gap-2">
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      brushSize === size ? 'bg-purple-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className="rounded-full bg-white"
                      style={{ width: size * 2, height: size * 2 }}
                    />
                  </button>
                ))}
              </div>

              <div className="w-px h-8 bg-gray-600"></div>

              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
              >
                🗑️ Clear
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Players */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold mb-3">Players ({players.length})</h3>
            <div className="space-y-2">
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

          {/* Chat / Guessing */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-bold">
                {isGameStarted && !isDrawer ? 'Make a Guess!' : 'Chat'}
              </h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`px-3 py-2 rounded-lg ${
                    msg.isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : msg.playerId === currentPlayer?.id
                      ? 'bg-purple-500/20'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <span className="font-bold text-sm">{msg.playerName}: </span>
                  <span>{msg.message}</span>
                  {msg.isCorrect && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleGuess} className="p-4 border-t border-gray-700">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={isGameStarted && !isDrawer ? 'Type your guess...' : 'Type a message...'}
                disabled={isDrawer && isGameStarted}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Lobby (when game hasn't started) */}
      {!isGameStarted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-center">Room Lobby</h2>
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2">Share this code with friends:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={room.id}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-2xl font-mono tracking-widest"
                />
                <button
                  onClick={copyRoomLink}
                  className="px-4 py-3 bg-purple-500 hover:bg-purple-400 rounded-lg"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-400 mb-2">Players waiting:</p>
              <div className="space-y-2">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg"
                  >
                    <span>{player.name}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">You</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startGame}
              disabled={players.length < 2}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Game 🚀
            </button>

            <p className="text-center text-gray-500 text-sm mt-4">
              Need at least 2 players to start
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
