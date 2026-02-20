import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Player, Room, DrawingPoint, ChatMessage } from '../types';

interface GameSettings {
  customWords?: string[];
  rounds: number;
  roundTime: number;
  category?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  room: Room | null;
  currentPlayer: Player | null;
  players: Player[];
  messages: ChatMessage[];
  currentWord: string;
  timeLeft: number;
  round: number;
  isDrawer: boolean;
  isGameStarted: boolean;
  isHost: boolean;
  gameType: string;
  guessedLetters: string[];
  wrongGuesses: number;
  gameSettings: GameSettings | null;
  
  // Actions
  createRoom: (playerName: string, roomName: string, gameType?: string, settings?: Partial<GameSettings>) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  sendDraw: (point: DrawingPoint) => void;
  sendGuess: (guess: string) => void;
  sendHangmanGuess: (letter: string) => void;
  sendMessage: (message: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// Use environment variable or default to the deployed server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://mini-games-hub.onrender.com';

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [gameType] = useState('scribble');
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);

  useEffect(() => {
    // Connect to socket server
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    // Room events
    socket.on('player-joined', ({ players: newPlayers }) => {
      setPlayers(newPlayers);
    });

    socket.on('player-left', ({ players: newPlayers }) => {
      setPlayers(newPlayers);
    });

    socket.on('new-host', ({ hostId }) => {
      setIsHost(hostId === socket.id);
    });

    socket.on('game-started', ({ room: newRoom, drawerId, word, round: r, timeLeft: t }) => {
      setRoom(newRoom);
      setIsGameStarted(true);
      setRound(r);
      setCurrentWord(word);
      setTimeLeft(t);
      setIsDrawer(drawerId === socket.id);
      setMessages([]);
      lastDrawPointRef.current = null;
    });

    socket.on('next-round', ({ round: r, drawerId, word, timeLeft: t }) => {
      setRound(r);
      setCurrentWord(word);
      setTimeLeft(t);
      setIsDrawer(drawerId === socket.id);
      lastDrawPointRef.current = null;
    });

    socket.on('timer-update', ({ timeLeft: t }) => {
      setTimeLeft(t);
    });

    socket.on('new-message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('correct-guess', ({ playerId, score }) => {
      setPlayers(prev => prev.map(p => 
        p.id === playerId ? { ...p, score: p.score + score } : p
      ));
    });

    socket.on('draw', (point: DrawingPoint) => {
      // Handle incoming drawing from other players - draw smooth lines
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw line from last point to current point for smooth drawing
      if (lastDrawPointRef.current) {
        ctx.strokeStyle = point.color;
        ctx.lineWidth = point.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastDrawPointRef.current.x, lastDrawPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else {
        // First point - draw a dot
        ctx.fillStyle = point.color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.width / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      lastDrawPointRef.current = { x: point.x, y: point.y };
    });

    socket.on('game-over', ({ winner, scores }) => {
      setIsGameStarted(false);
      setPlayers(scores);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '🎉',
        message: `Game Over! ${winner?.name || 'Unknown'} wins with ${winner?.score || 0} points!`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
    });

    // Hangman events
    socket.on('hangman-update', ({ guessedLetters: letters, wrongGuesses: wrong, playerId, playerName, letter, isCorrect }) => {
      setGuessedLetters(letters);
      setWrongGuesses(wrong);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId,
        playerName,
        message: `${letter} - ${isCorrect ? '✓' : '✗'}`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
    });

    socket.on('hangman-round-over', ({ word, winner, round, totalRounds }) => {
      setCurrentWord(word);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '🎯',
        message: winner 
          ? `${winner.name} got it! (+100 pts) - Round ${round}/${totalRounds}`
          : `Time's up! Word was: ${word} - Round ${round}/${totalRounds}`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
    });

    socket.on('hangman-game-over', ({ word, winner }) => {
      setIsGameStarted(false);
      setCurrentWord(word);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '🎉',
        message: winner 
          ? `${winner.name} wins!` 
          : `Game Over! The word was: ${word}`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = (playerName: string, roomName: string, gameType: string = 'scribble', settings?: Partial<GameSettings>) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('create-room', { 
      playerName, 
      roomName, 
      gameType,
      settings: {
        customWords: settings?.customWords || [],
        rounds: settings?.rounds || 3,
        roundTime: settings?.roundTime || 80,
      }
    }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
        setCurrentPlayer({ id: response.playerId, name: playerName, score: 0, isReady: true });
        setPlayers(response.room.players);
        setIsHost(true);
        setGameSettings({
          customWords: settings?.customWords || [],
          rounds: settings?.rounds || 3,
          roundTime: settings?.roundTime || 80,
        });
      }
    });
  };

  const joinRoom = (roomId: string, playerName: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('join-room', { roomId, playerName }, (response: any) => {
      if (response.success) {
        setRoom(response.room);
        setCurrentPlayer({ id: response.playerId, name: playerName, score: 0, isReady: true });
        setPlayers(response.room.players);
        setIsHost(response.room.hostId === response.playerId);
        setGameSettings({
          customWords: response.room.customWords || [],
          rounds: response.room.totalRounds || 3,
          roundTime: response.room.roundTime || 80,
        });
      } else {
        alert(response.error || 'Failed to join room');
      }
    });
  };

  const leaveRoom = () => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave-room');
    setRoom(null);
    setCurrentPlayer(null);
    setPlayers([]);
    setMessages([]);
    setIsGameStarted(false);
    setCurrentWord('');
    setRound(1);
    setIsHost(false);
  };

  const startGame = () => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('start-game', { roomId: room.id }, (response: any) => {
      if (!response.success) {
        alert(response.error || 'Failed to start game');
      }
    });
  };

  const sendDraw = (point: DrawingPoint) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('draw', { roomId: room.id, point });
  };

  const sendGuess = (guess: string) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('guess', { roomId: room.id, guess });
  };

  const sendHangmanGuess = (letter: string) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('hangman-guess', { roomId: room.id, letter });
  };

  const sendMessage = (message: string) => {
    // For chat messages (not guesses)
    const msg: ChatMessage = {
      id: Date.now().toString(),
      playerId: currentPlayer?.id || '',
      playerName: currentPlayer?.name || '',
      message,
      isCorrect: false,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      room,
      currentPlayer,
      players,
      messages,
      currentWord,
      timeLeft,
      round,
      isDrawer,
      isGameStarted,
      isHost,
      gameType,
      guessedLetters,
      wrongGuesses,
      gameSettings,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      sendDraw,
      sendGuess,
      sendHangmanGuess,
      sendMessage,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
