import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Player, Room, DrawingPoint, ChatMessage } from '../types';

interface GameSettings {
  customWords: string[];
  rounds: number;
  roundTime: number;
}

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

const DEFAULT_WORDS = [
  'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house',
  'island', 'jungle', 'kite', 'lamp', 'mountain', 'notebook', 'ocean', 'pizza',
  'queen', 'rainbow', 'sunflower', 'tree', 'umbrella', 'volcano', 'waterfall', 'xylophone',
  'yacht', 'zebra', 'airplane', 'butterfly', 'castle', 'dragon', 'fireworks', 'galaxy',
];

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
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
    setIsConnected(true);
  }, []);

  const getRandomWord = () => {
    const words = gameSettings?.customWords || DEFAULT_WORDS;
    return words[Math.floor(Math.random() * words.length)].toUpperCase();
  };

  const createRoom = (playerName: string, roomName: string, settings?: Partial<GameSettings>) => {
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
    
    const finalSettings: GameSettings = {
      customWords: settings?.customWords || DEFAULT_WORDS,
      rounds: settings?.rounds || 3,
      roundTime: settings?.roundTime || 80,
    };
    
    setRoom(newRoom);
    setCurrentPlayer(newPlayer);
    setPlayers([newPlayer]);
    setGameSettings(finalSettings);
  };

  const joinRoom = (roomId: string, playerName: string) => {
    const newPlayer: Player = {
      id: 'player-' + Math.random().toString(36).substr(2, 9),
      name: playerName,
      score: 0,
      isReady: true,
    };
    
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
    
    // Try to load settings from session
    const stored = sessionStorage.getItem('gameSettings');
    if (stored) {
      try {
        setGameSettings(JSON.parse(stored));
      } catch {
        // Ignore
      }
    }
  };

  const leaveRoom = () => {
    setRoom(null);
    setCurrentPlayer(null);
    setPlayers([]);
    setMessages([]);
    setIsGameStarted(false);
    setCurrentWord('');
    setRound(1);
    sessionStorage.removeItem('gameSettings');
  };

  const startGame = () => {
    setIsGameStarted(true);
    setIsDrawer(true);
    setCurrentWord(getRandomWord());
    setTimeLeft(gameSettings?.roundTime || 80);
    setRound(1);
  };

  const sendDraw = (point: DrawingPoint) => {
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
      
      // Update score
      setPlayers(prev => prev.map(p => 
        p.id === currentPlayer?.id 
          ? { ...p, score: p.score + (gameSettings?.roundTime || 80) * 10 }
          : p
      ));
      
      // Next round after delay
      setTimeout(() => {
        nextRound();
      }, 2000);
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

  const nextRound = () => {
    const currentRoundNum = round;
    const totalRounds = gameSettings?.rounds || 3;
    
    if (currentRoundNum >= totalRounds) {
      // Game over - find winner
      const winner = [...players].sort((a, b) => b.score - a.score)[0];
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '🎉',
        message: `Game Over! ${winner?.name || 'Unknown'} wins with ${winner?.score || 0} points!`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
      setIsGameStarted(false);
      return;
    }
    
    setRound(currentRoundNum + 1);
    setIsDrawer(!isDrawer);
    setCurrentWord(getRandomWord());
    setTimeLeft(gameSettings?.roundTime || 80);
  };

  // Timer countdown
  useEffect(() => {
    if (!isGameStarted || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          nextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameStarted, timeLeft, round, isDrawer]);

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
