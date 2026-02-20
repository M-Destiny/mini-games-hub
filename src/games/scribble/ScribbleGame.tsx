import { useState, useRef, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import type { DrawingPoint } from '../../types';

const COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
  '#FF0088', '#00FF88',
];

const BRUSH_SIZES = [2, 4, 6, 8, 12];

interface Props {
  customWords?: string[];
  rounds?: number;
  roundTime?: number;
}

export default function ScribbleGame({ rounds = 3, roundTime = 80 }: Props) {
  const { 
    room, 
    players, 
    currentPlayer, 
    messages, 
    currentWord, 
    timeLeft, 
    isDrawer,
    isGameStarted,
    round: currentRound,
    leaveRoom, 
    startGame,
    sendDraw,
    sendGuess,
  } = useSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [guess, setGuess] = useState('');
  const [showWord, setShowWord] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Responsive canvas
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth - 32, 800);
        const height = Math.min(width * 0.75, 600);
        setCanvasSize({ width, height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [canvasSize]);

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, []);

  const drawPoint = useCallback((point: DrawingPoint) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = point.color;
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    setIsDrawing(true);
    
    const point = getCanvasPoint(e);
    const drawPointData: DrawingPoint = {
      x: point.x,
      y: point.y,
      color: currentColor,
      width: brushSize,
    };
    
    drawPoint(drawPointData);
    sendDraw(drawPointData);
  }, [isDrawer, getCanvasPoint, currentColor, brushSize, drawPoint, sendDraw]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    const drawPointData: DrawingPoint = {
      x: point.x,
      y: point.y,
      color: currentColor,
      width: brushSize,
    };
    
    drawPoint(drawPointData);
    sendDraw(drawPointData);
  }, [isDrawing, isDrawer, getCanvasPoint, currentColor, brushSize, drawPoint, sendDraw]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    sendGuess(guess.trim());
    setGuess('');
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}/scribble/join?room=${room?.id}`;
    navigator.clipboard.writeText(link);
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col h-screen lg:h-auto">
      {/* Header - Responsive */}
      <header className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 lg:gap-4 overflow-hidden">
          <h1 className="text-lg lg:text-xl font-bold whitespace-nowrap">🎨 Scribble</h1>
          <span className="hidden sm:inline text-gray-400">|</span>
          <span className="font-mono text-sm lg:text-lg truncate max-w-[100px] lg:max-w-none">{room.name}</span>
          <span className="bg-purple-500/20 text-purple-400 px-2 lg:px-3 py-0.5 rounded-full text-xs lg:text-sm whitespace-nowrap">
            {room.id}
          </span>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {isGameStarted && (
            <div className="flex items-center gap-1 lg:gap-2 bg-gray-700 px-2 lg:px-4 py-1 lg:py-2 rounded-lg">
              <span className="text-lg lg:text-2xl">⏱️</span>
              <span className="text-lg lg:text-2xl font-bold">{timeLeft}</span>
              <span className="hidden lg:inline text-gray-400 text-sm">
                / R{currentRound || 1}
              </span>
            </div>
          )}
          <button
            onClick={leaveRoom}
            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm lg:text-base"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Main Game Area - Responsive flex */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-2 lg:p-4 flex flex-col min-h-0">
          {/* Word Display */}
          {isGameStarted && (
            <div className={`rounded-lg p-2 lg:p-3 mb-2 lg:mb-4 text-center ${
              isDrawer 
                ? 'bg-purple-500/20 border border-purple-500/30' 
                : 'bg-blue-500/20 border border-blue-500/30'
            }`}>
              <p className="text-xs lg:text-sm text-gray-300">
                {isDrawer ? "You're drawing!" : 'Guess the word!'}
              </p>
              <p className="text-xl lg:text-2xl font-bold mt-1 tracking-wider">
                {showWord || isDrawer ? currentWord : currentWord.replace(/./g, '_ ')}
              </p>
              {isDrawer && (
                <button
                  onClick={() => setShowWord(!showWord)}
                  className="text-xs lg:text-sm text-purple-400 mt-1 lg:mt-2 underline"
                >
                  {showWord ? 'Hide' : 'Show'} Word
                </button>
              )}
            </div>
          )}

          {/* Canvas Container */}
          <div 
            ref={containerRef}
            className="flex-1 bg-white rounded-xl overflow-hidden min-h-[200px] lg:min-h-0"
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className={`w-full h-full ${isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'} touch-none`}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>

          {/* Drawing Tools - Responsive */}
          {isDrawer && isGameStarted && (
            <div className="mt-2 lg:mt-4 flex items-center gap-2 lg:gap-4 bg-gray-800 p-2 lg:p-4 rounded-xl overflow-x-auto">
              {/* Colors - Scrollable on mobile */}
              <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-6 h-6 lg:w-8 lg:h-8 rounded-full border-2 flex-shrink-0 ${
                      currentColor === color ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>

              <div className="w-px h-6 lg:h-8 bg-gray-600 flex-shrink-0 hidden sm:block"></div>

              {/* Brush Sizes */}
              <div className="flex gap-1 lg:gap-2 flex-shrink-0">
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center ${
                      brushSize === size ? 'bg-purple-500' : 'bg-gray-700'
                    }`}
                    aria-label={`Brush size ${size}`}
                  >
                    <div
                      className="rounded-full bg-white"
                      style={{ width: Math.min(size * 2, 16), height: Math.min(size * 2, 16) }}
                    />
                  </button>
                ))}
              </div>

              <div className="w-px h-6 lg:h-8 bg-gray-600 flex-shrink-0 hidden sm:block"></div>

              <button
                onClick={clearCanvas}
                className="px-2 lg:px-4 py-1.5 lg:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm lg:text-base flex-shrink-0"
              >
                🗑️ <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar - Responsive: bottom sheet on mobile, side on desktop */}
        <div className="w-full lg:w-80 bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700 flex flex-col max-h-[40vh] lg:max-h-none">
          {/* Players */}
          <div className="p-2 lg:p-4 border-b border-gray-700 flex-shrink-0">
            <h3 className="font-bold text-sm lg:text-base">
              Players ({players.length})
            </h3>
            <div className="space-y-1 lg:space-y-2 mt-2 max-h-[100px] lg:max-h-none overflow-y-auto">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-700/50 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-1 lg:gap-2 min-w-0">
                    <span className="truncate">{player.name}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded flex-shrink-0">You</span>
                    )}
                  </div>
                  <span className="font-bold text-purple-400 text-sm">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat / Guessing */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="p-2 lg:p-4 border-b border-gray-700 flex-shrink-0">
              <h3 className="font-bold text-sm lg:text-base">
                {isGameStarted && !isDrawer ? 'Make a Guess!' : 'Chat'}
              </h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-2 lg:p-4 space-y-1 lg:space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-sm ${
                    msg.isCorrect
                      ? 'bg-green-500/20 text-green-400'
                      : msg.playerId === currentPlayer?.id
                      ? 'bg-purple-500/20'
                      : 'bg-gray-700/50'
                  }`}
                >
                  <span className="font-bold text-xs lg:text-sm">{msg.playerName}: </span>
                  <span>{msg.message}</span>
                  {msg.isCorrect && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleGuess} className="p-2 lg:p-4 border-t border-gray-700 flex-shrink-0">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={isGameStarted && !isDrawer ? 'Type your guess...' : 'Type a message...'}
                disabled={isDrawer && isGameStarted}
                className="w-full px-3 lg:px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm lg:text-base"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Lobby Modal */}
      {!isGameStarted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 lg:p-8 max-w-md w-full">
            <h2 className="text-xl lg:text-2xl font-bold mb-4 text-center">Room Lobby</h2>
            
            <div className="mb-6">
              <p className="text-gray-400 mb-2 text-sm lg:text-base">Share this code with friends:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={room.id}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-xl lg:text-2xl font-mono tracking-widest"
                />
                <button
                  onClick={copyRoomLink}
                  className="px-4 py-3 bg-purple-500 hover:bg-purple-400 rounded-lg text-lg"
                  aria-label="Copy room link"
                >
                  📋
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-400 mb-2 text-sm lg:text-base">Players waiting:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
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
              onClick={() => startGame()}
              disabled={players.length < 1}
              className="w-full py-3 lg:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold text-base lg:text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Game 🚀
            </button>

            <p className="text-center text-gray-500 text-xs lg:text-sm mt-4">
              {rounds} rounds • {roundTime}s per round
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
