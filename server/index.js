import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Game state
// interface Player {
//   id: string;
//   name: string;
//   score: number;
// }

// interface Room {
//   id: string;
//   name: string;
//   players: Player[];
//   gameStarted: boolean;
//   currentWord: string | null;
//   isDrawer: string | null;
//   round: number;
//   totalRounds: number;
//   roundTime: number;
//   timeLeft: number;
//   customWords: string[];
// }

const rooms = new Map<string, Room>();

const DEFAULT_WORDS = [
  'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house',
  'island', 'jungle', 'kite', 'lamp', 'mountain', 'notebook', 'ocean', 'pizza',
  'queen', 'rainbow', 'sunflower', 'tree', 'umbrella', 'volcano', 'waterfall', 'xylophone',
];

function getRandomWord(words: string[]) {
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('create-room', ({ playerName, roomName, settings }, callback) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const room: Room = {
      id: roomId,
      name: roomName,
      players: [{
        id: socket.id,
        name: playerName,
        score: 0,
      }],
      gameStarted: false,
      currentWord: null,
      isDrawer: null,
      round: 0,
      totalRounds: settings?.rounds || 3,
      roundTime: settings?.roundTime || 80,
      timeLeft: 0,
      customWords: settings?.customWords || DEFAULT_WORDS,
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = playerName;
    
    callback({ success: true, room, playerId: socket.id });
    console.log(`Room ${roomId} created by ${playerName}`);
  });

  socket.on('join-room', ({ roomId, playerName }, callback) => {
    const room = rooms.get(roomId.toUpperCase());
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    if (room.gameStarted) {
      callback({ success: false, error: 'Game already started' });
      return;
    }
    
    room.players.push({
      id: socket.id,
      name: playerName,
      score: 0,
    });
    
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = playerName;
    
    // Notify others
    io.to(roomId).emit('player-joined', { 
      players: room.players,
      playerId: socket.id,
      playerName,
    });
    
    callback({ success: true, room, playerId: socket.id });
    console.log(`${playerName} joined room ${roomId}`);
  });

  socket.on('start-game', ({ roomId }, callback) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    if (room.players.length < 1) {
      callback({ success: false, error: 'Need at least 1 player' });
      return;
    }
    
    room.gameStarted = true;
    room.round = 1;
    room.isDrawer = room.players[0].id;
    room.currentWord = getRandomWord(room.customWords);
    room.timeLeft = room.roundTime;
    
    io.to(roomId).emit('game-started', {
      room,
      drawerId: room.isDrawer,
      word: room.currentWord,
      round: room.round,
      timeLeft: room.timeLeft,
    });
    
    // Start timer
    const timer = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r || !r.gameStarted) {
        clearInterval(timer);
        return;
      }
      
      r.timeLeft--;
      
      if (r.timeLeft <= 0) {
        // Next round
        nextRound(roomId, r);
      }
      
      io.to(roomId).emit('timer-update', { timeLeft: r.timeLeft });
    }, 1000);
    
    callback({ success: true });
  });

  socket.on('draw', ({ roomId, point }) => {
    // Broadcast drawing to other players in room
    socket.to(roomId).emit('draw', point);
  });

  socket.on('guess', ({ roomId, guess }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const isCorrect = guess.toUpperCase() === room.currentWord?.toUpperCase();
    
    // Broadcast guess to all
    io.to(roomId).emit('new-message', {
      id: Date.now().toString(),
      playerId: socket.id,
      playerName: socket.data.playerName,
      message: guess,
      isCorrect,
    });
    
    if (isCorrect) {
      // Calculate score
      const points = room.timeLeft * 10;
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.score += points;
      }
      
      io.to(roomId).emit('correct-guess', {
        playerId: socket.id,
        playerName: socket.data.playerName,
        score: points,
        word: room.currentWord,
      });
      
      // Next round
      nextRound(roomId, room);
    }
    
    if (callback) callback({ success: true, isCorrect });
  });

  socket.on('leave-room', () => {
    handleLeave(socket);
  });

  socket.on('disconnect', () => {
    handleLeave(socket);
  });
});

function nextRound(roomId: string, room: Room) {
  // Check if game over
  if (room.round >= room.totalRounds) {
    // Game over
    room.gameStarted = false;
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    
    io.to(roomId).emit('game-over', {
      winner,
      scores: room.players,
    });
    return;
  }
  
  // Next round
  room.round++;
  // Rotate drawer
  const currentDrawerIndex = room.players.findIndex(p => p.id === room.isDrawer);
  room.isDrawer = room.players[(currentDrawerIndex + 1) % room.players.length].id;
  room.currentWord = getRandomWord(room.customWords);
  room.timeLeft = room.roundTime;
  
  io.to(roomId).emit('next-round', {
    round: room.round,
    drawerId: room.isDrawer,
    word: room.currentWord,
    timeLeft: room.timeLeft,
  });
}

function handleLeave(socket: any) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  // Remove player
  room.players = room.players.filter(p => p.id !== socket.id);
  
  if (room.players.length === 0) {
    // Delete room
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
  } else {
    // If drawer left, assign new drawer
    if (room.isDrawer === socket.id && room.gameStarted) {
      room.isDrawer = room.players[0].id;
    }
    
    io.to(roomId).emit('player-left', {
      playerId: socket.id,
      playerName: socket.data.playerName,
      players: room.players,
    });
  }
  
  socket.leave(roomId);
  console.log(`${socket.data.playerName} left room ${roomId}`);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🎮 Server running on port ${PORT}`);
});
