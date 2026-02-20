const { Server } = require('socket.io');
const { createServer } = require('http');

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

const DEFAULT_WORDS = [
  'apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house',
  'island', 'jungle', 'kite', 'lamp', 'mountain', 'notebook', 'ocean', 'pizza',
  'queen', 'rainbow', 'sunflower', 'tree', 'umbrella', 'volcano', 'waterfall', 'xylophone',
];

function getRandomWord(words) {
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('create-room', ({ playerName, roomName, settings }, callback) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const room = {
      id: roomId,
      name: roomName,
      hostId: socket.id,
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
    
    // Check if player already in room
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (existingPlayer) {
      callback({ success: true, room, playerId: socket.id });
      return;
    }
    
    // Add player (can join mid-game)
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
    
    // Only host can start
    if (room.hostId !== socket.id) {
      callback({ success: false, error: 'Only host can start the game' });
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
    
    callback({ success: true });
  });

  socket.on('draw', ({ roomId, point }) => {
    socket.to(roomId).emit('draw', point);
  });

  socket.on('guess', ({ roomId, guess }, callback) => {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const isCorrect = guess.toUpperCase() === room.currentWord?.toUpperCase();
    
    io.to(roomId).emit('new-message', {
      id: Date.now().toString(),
      playerId: socket.id,
      playerName: socket.data.playerName,
      message: guess,
      isCorrect,
    });
    
    if (isCorrect) {
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

function nextRound(roomId, room) {
  if (room.round >= room.totalRounds) {
    room.gameStarted = false;
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    
    io.to(roomId).emit('game-over', {
      winner,
      scores: room.players,
    });
    return;
  }
  
  room.round++;
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

function handleLeave(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  
  const room = rooms.get(roomId);
  if (!room) return;
  
  const wasHost = room.hostId === socket.id;
  room.players = room.players.filter(p => p.id !== socket.id);
  
  if (room.players.length === 0) {
    rooms.delete(roomId);
    console.log(`Room ${roomId} deleted (empty)`);
  } else {
    // If host left, assign new host
    if (wasHost && room.players.length > 0) {
      room.hostId = room.players[0].id;
      io.to(roomId).emit('new-host', { hostId: room.hostId });
    }
    
    // If drawer left mid-game, assign new drawer
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
  console.log(`Server running on port ${PORT}`);
});
