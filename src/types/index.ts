export interface Player {
  id: string;
  name: string;
  score: number;
  isReady: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  gameStarted: boolean;
}

export interface GameState {
  room: Room | null;
  currentPlayer: Player | null;
  isDrawer: boolean;
  word: string;
  hint: string;
  timeLeft: number;
  round: number;
  totalRounds: number;
}

export interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  width: number;
}

export type GamePhase = 'lobby' | 'drawing' | 'guessing' | 'roundEnd' | 'gameEnd';

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  isCorrect: boolean;
  timestamp: number;
}
