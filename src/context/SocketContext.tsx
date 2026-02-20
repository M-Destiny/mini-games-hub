import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
// import { io, Socket } from 'socket.io-client';
import type { Player, Room, DrawingPoint, ChatMessage } from '../types';

interface SocketContextType {
  socket: unknown;
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
  
  // Actions
  createRoom: (playerName: string, roomName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  leaveRoom: () => void;
  startGame: () => void;
  sendDraw: (point: DrawingPoint) => void;
  sendGuess: (guess: string) => void;
  sendMessage: (message: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  // const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  // const [round, setRound] = useState(1);
  const [isDrawer, setIsDrawer] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);

  useEffect(() => {
    // In production, connect to socket server
    // const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001');
    // setSocket(newSocket);
    
    // For now, we'll use a mock mode
    setIsConnected(true);
    
    // return () => {
    //   socket?.disconnect();
    // };
  }, []);

  const createRoom = (playerName: string, roomName: string) => {
    const newPlayer: Player = {
      id: 'player-' + Math.random().toString(36).substr(2, 9),
      name: playerName,
      score: 0,
      isReady: true,
    };
    
    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: roomName,
      players: [newPlayer],
      maxPlayers: 8,
      gameStarted: false,
    };
    
    setRoom(newRoom);
    setCurrentPlayer(newPlayer);
    setPlayers([newPlayer]);
  };

  const joinRoom = (roomId: string, playerName: string) => {
    const newPlayer: Player = {
      id: 'player-' + Math.random().toString(36).substr(2, 9),
      name: playerName,
      score: 0,
      isReady: true,
    };
    
    // In real app, this would come from server
    const existingRoom: Room = {
      id: roomId,
      name: 'Room ' + roomId,
      players: [newPlayer],
      maxPlayers: 8,
      gameStarted: false,
    };
    
    setRoom(existingRoom);
    setCurrentPlayer(newPlayer);
    setPlayers([newPlayer]);
  };

  const leaveRoom = () => {
    setRoom(null);
    setCurrentPlayer(null);
    setPlayers([]);
    setMessages([]);
    setIsGameStarted(false);
    setCurrentWord('');
  };

  const startGame = () => {
    setIsGameStarted(true);
    // Start first round as drawer
    setIsDrawer(true);
    setCurrentWord('EXAMPLE');
    setTimeLeft(80);
  };

  const sendDraw = (point: DrawingPoint) => {
    // In real app, emit to socket
    console.log('Drawing:', point);
  };

  const sendGuess = (guess: string) => {
    if (guess.toUpperCase() === currentWord.toUpperCase()) {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        playerId: currentPlayer?.id || '',
        playerName: currentPlayer?.name || '',
        message: guess,
        isCorrect: true,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    } else {
      const msg: ChatMessage = {
        id: Date.now().toString(),
        playerId: currentPlayer?.id || '',
        playerName: currentPlayer?.name || '',
        message: guess,
        isCorrect: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, msg]);
    }
  };

  const sendMessage = (message: string) => {
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
      socket: null,
      isConnected,
      room,
      currentPlayer,
      players,
      messages,
      currentWord,
      timeLeft,
      round: 1,
      isDrawer,
      isGameStarted,
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
