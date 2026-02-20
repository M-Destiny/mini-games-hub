import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const COLORS = [
  '#1a1a2e', '#ffffff', '#e74c3c', '#2ecc71', '#3498db',
  '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22', '#e91e63',
  '#795548', '#607d8b',
];

const BRUSH_SIZES = [4, 6, 10, 16, 24];

export default function ScribbleGame() {
  const navigate = useNavigate();
  const { 
    room, 
    players, 
    currentPlayer, 
    messages, 
    currentWord, 
    timeLeft, 
    isDrawer,
    isGameStarted,
    isHost,
    round: currentRound,
    leaveRoom: socketLeaveRoom, 
    startGame,
    sendDraw,
    sendGuess,
  } = useSocket();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#1a1a2e');
  const [brushSize, setBrushSize] = useState(10);
  const [guess, setGuess] = useState('');
  const [showWord, setShowWord] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Get hint based on time
  const getHint = () => {
    if (!currentWord || isDrawer) return '';
    const len = currentWord.length;
    if (timeLeft > 60) return `${len} letters`;
    if (timeLeft > 40) return `Starts with "${currentWord[0]}"`;
    if (timeLeft > 20) return `Ends with "${currentWord[len-1]}"`;
    return '';
  };

  // Responsive canvas - bigger!
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth - 32;
        const h = window.innerHeight - 280;
        const size = Math.min(w, h, 800);
        setCanvasSize({ width: size, height: size * 0.75 });
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
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [canvasSize]);

  // Handle incoming drawing from socket - handled by SocketContext

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

  const drawLine = useCallback((from: { x: number; y: number }, to: { x: number; y: number }, color: string, width: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  const handleLeave = () => {
    socketLeaveRoom();
    navigate('/');
  };

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawer) return;
    e.preventDefault();
    setIsDrawing(true);
    
    const point = getCanvasPoint(e);
    lastPointRef.current = point;
    
    // Draw initial dot
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.fillStyle = currentColor;
      ctx.beginPath();
      ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Send point to others
    sendDraw({ x: point.x, y: point.y, color: currentColor, width: brushSize });
  }, [isDrawer, getCanvasPoint, currentColor, brushSize, sendDraw]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawer) return;
    e.preventDefault();
    
    const point = getCanvasPoint(e);
    
    if (lastPointRef.current) {
      // Draw smooth line
      drawLine(lastPointRef.current, point, currentColor, brushSize);
      // Send both points for smooth drawing on other screens
      sendDraw({ x: point.x, y: point.y, color: currentColor, width: brushSize });
    }
    
    lastPointRef.current = point;
  }, [isDrawing, isDrawer, getCanvasPoint, drawLine, currentColor, brushSize, sendDraw]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    lastPointRef.current = null;
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
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">🎨 Scribble</h1>
          <span className="text-gray-400 hidden sm:inline">|</span>
          <span className="font-mono text-sm">{room.name}</span>
          <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">
            {room.id}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {isGameStarted && (
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-xl">⏱️</span>
              <span className="text-xl font-bold">{timeLeft}</span>
              <span className="text-gray-400 text-sm hidden sm:inline">R{currentRound || 1}</span>
            </div>
          )}
          <button onClick={handleLeave} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">
            ✕ Exit
          </button>
        </div>
      </header>

      {/* Main - Canvas + Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col p-3 overflow-auto">
          {/* Word Display */}
          {isGameStarted && (
            <div className={`rounded-lg p-3 mb-3 text-center ${isDrawer ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-blue-500/20 border border-blue-500/30'}`}>
              <p className="text-sm text-gray-300">{isDrawer ? "Draw this word!" : 'Guess the word!'}</p>
              <p className="text-2xl font-bold mt-1 tracking-wider">
                {showWord || isDrawer ? currentWord : currentWord.replace(/./g, '_ ')}
              </p>
              {!isDrawer && getHint() && (
                <p className="text-yellow-400 text-sm mt-1">💡 {getHint()}</p>
              )}
              {isDrawer && (
                <button onClick={() => setShowWord(!showWord)} className="text-purple-400 text-xs mt-1 underline">
                  {showWord ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
          )}

          {/* Canvas */}
          <div ref={containerRef} className="flex-1 flex items-center justify-center bg-white rounded-xl overflow-hidden">
            <canvas
              id="game-canvas"
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

          {/* Tools */}
          {isDrawer && isGameStarted && (
            <div className="mt-3 flex items-center gap-4 bg-gray-800 p-3 rounded-xl flex-wrap justify-center">
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      currentColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="w-px h-8 bg-gray-600"></div>
              <div className="flex gap-2">
                {BRUSH_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setBrushSize(size)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      brushSize === size ? 'bg-purple-500' : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    <div className="rounded-full bg-white" style={{ width: size, height: size }} />
                  </button>
                ))}
              </div>
              <div className="w-px h-8 bg-gray-600"></div>
              <button onClick={clearCanvas} className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
                🗑️ Clear
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Players */}
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-bold mb-2">Players ({players.length})</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{player.name}</span>
                    {player.id === currentPlayer?.id && (
                      <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded">You</span>
                    )}
                  </div>
                  <span className="font-bold text-purple-400">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <h3 className="font-bold">{isGameStarted && !isDrawer ? 'Guess!' : 'Chat'}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`px-3 py-2 rounded-lg text-sm ${msg.isCorrect ? 'bg-green-500/20 text-green-400' : msg.playerId === currentPlayer?.id ? 'bg-purple-500/20' : 'bg-gray-700/50'}`}>
                  <span className="font-bold">{msg.playerName}: </span>
                  <span>{msg.message}</span>
                  {msg.isCorrect && <span className="ml-2">✓</span>}
                </div>
              ))}
            </div>

            <form onSubmit={handleGuess} className="p-3 border-t border-gray-700">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={isGameStarted && !isDrawer ? 'Type guess...' : 'Message...'}
                disabled={isDrawer && isGameStarted}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </form>
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
                <button onClick={copyRoomLink} className="px-4 bg-purple-500 hover:bg-purple-400 rounded-lg">📋</button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-2 text-sm">Players:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg">
                    <span>{player.name}</span>
                    {player.id === currentPlayer?.id && <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">You</span>}
                    {player.id === room?.hostId && <span className="text-xs bg-yellow-500/30 text-yellow-300 px-2 py-0.5 rounded">👑 Host</span>}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button onClick={() => startGame()} disabled={players.length < 1} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-bold disabled:opacity-50">
                Start Game 🚀
              </button>
            ) : (
              <div className="w-full py-3 bg-gray-700 rounded-lg font-bold text-center text-gray-400">
                Waiting for host to start...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
