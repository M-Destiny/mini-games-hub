import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import type { Player, Room, DrawingPoint, ChatMessage } from '../types';

interface GameSettings {
  customWords: string[];
  rounds: number;
  roundTime: number;
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
  gameSettings: GameSettings | null;
  
  // Actions
  createRoom: (playerName: string, roomName: string, settings?: Partial<GameSettings>) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  sendDraw: (point: DrawingPoint) => void;
  sendGuess: (guess: string) => void;
  sendMessage: (message: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

// Use environment variable or default to the deployed server
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://mini-games-server.onrender.com';

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
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

    socket.on('game-started', ({ room: newRoom, drawerId, word, round: r, timeLeft: t }) => {
      setRoom(newRoom);
      setIsGameStarted(true);
      setRound(r);
      setCurrentWord(word);
      setTimeLeft(t);
      setIsDrawer(drawerId === socket.id);
      setMessages([]);
    });

    socket.on('next-round', ({ round: r, drawerId, word, timeLeft: t }) => {
      setRound(r);
      setCurrentWord(word);
      setTimeLeft(t);
      setIsDrawer(drawerId === socket.id);
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
      // Handle incoming drawing from other players
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.width / 2, 0, Math.PI * 2);
      ctx.fill();
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

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const createRoom = (playerName: string, roomName: string, settings?: Partial<GameSettings>) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('create-room', { 
      playerName, 
      roomName, 
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
      gameSettings,
      createRoom,
      joinRoom,
      leaveRoom,
      startGame,
      sendDraw,
      sendGuess,
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
