const { Server } = require('socket.io');
const { createServer } = require('http');

const httpServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', players: io.engine.clientsCount }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

// Word lists for different games
const WORD_LISTS = {
  scribble: ['apple', 'banana', 'car', 'dog', 'elephant', 'flower', 'guitar', 'house', 'island', 'jungle', 'kite', 'lamp', 'mountain', 'notebook', 'ocean', 'pizza', 'queen', 'rainbow', 'sunflower', 'tree', 'umbrella', 'volcano', 'waterfall', 'xylophone'],
  wordchain: ['APPLE', 'BANANA', 'CAT', 'DOG', 'ELEPHANT', 'FISH', 'GRAPE', 'HOUSE', 'ICE', 'JUMP', 'KITE', 'LION', 'MOON', 'NEST', 'OCEAN', 'PIZZA', 'QUEEN', 'RAIN', 'STAR', 'TREE', 'UMBRELLA', 'VIOLIN', 'WATER', 'YELLOW', 'ZEBRA'],
  trivia: [
    { q: "What is the capital of France?", options: ["A) London", "B) Paris", "C) Berlin", "D) Madrid"], answer: "B" },
    { q: "Which planet is known as Red Planet?", options: ["A) Venus", "B) Mars", "C) Jupiter", "D) Saturn"], answer: "B" },
    { q: "What is 5 + 7?", options: ["A) 10", "B) 11", "C) 12", "D) 13"], answer: "C" },
    { q: "Which animal is King of Jungle?", options: ["A) Tiger", "B) Lion", "C) Elephant", "D) Bear"], answer: "B" },
    { q: "What color do you get mixing Red + Blue?", options: ["A) Green", "B) Orange", "C) Purple", "D) Yellow"], answer: "C" },
    { q: "How many days in a week?", options: ["A) 5", "B) 6", "C) 7", "D) 8"], answer: "C" },
    { q: "Which is the largest ocean?", options: ["A) Atlantic", "B) Indian", "C) Arctic", "D) Pacific"], answer: "D" },
    { q: "What is H2O?", options: ["A) Salt", "B) Sugar", "C) Water", "D) Oxygen"], answer: "C" },
    { q: "Which country has the most people?", options: ["A) USA", "B) India", "C) China", "D) Russia"], answer: "B" },
    { q: "What is the square of 4?", options: ["A) 8", "B) 12", "C) 16", "D) 20"], answer: "C" },
    { q: "Which fruit is yellow?", options: ["A) Apple", "B) Banana", "C) Grape", "D) Orange"], answer: "B" },
    { q: "How many legs does a spider have?", options: ["A) 6", "B) 8", "C) 10", "D) 12"], answer: "B" },
    { q: "What is the fastest land animal?", options: ["A) Lion", "B) Cheetah", "C) Tiger", "D) Horse"], answer: "B" },
    { q: "Which element has symbol 'O'?", options: ["A) Gold", "B) Oxygen", "C) Osmium", "D) Iron"], answer: "B" },
    { q: "What is 10 × 5?", options: ["A) 40", "B) 45", "C) 50", "D) 55"], answer: "C" },
  ],
  hangman: {
    animals: ['ELEPHANT', 'GIRAFFE', 'DOLPHIN', 'PENGUIN', 'KANGAROO', 'BUTTERFLY', 'RHINOCEROS', 'CROCODILE', 'HIPPOPOTAMUS', 'OCTOPUS'],
    fruits: ['APPLE', 'BANANA', 'ORANGE', 'WATERMELON', 'STRAWBERRY', 'PINEAPPLE', 'BLUEBERRY', 'RASPBERRY', 'CHERRY', 'MANGO'],
    countries: ['AMERICA', 'CANADA', 'BRAZIL', 'GERMANY', 'AUSTRALIA', 'JAPAN', 'CHINA', 'INDIA', 'FRANCE', 'ITALY'],
    movies: ['AVENGERS', 'TITANIC', 'FROZEN', 'SPIDERMAN', 'BATMAN', 'IRONMAN', 'JURASSIC', 'STARWARS', 'MATRIX', 'GLADIATOR'],
    sports: ['FOOTBALL', 'CRICKET', 'TENNIS', 'BASKETBALL', 'BASEBALL', 'HOCKEY', 'GOLF', 'SWIMMING', 'BOXING', 'RUGBY'],
  }
};

function getRandomWord(gameType, category = null) {
  let words;
  if (gameType === 'hangman') {
    if (category && WORD_LISTS.hangman[category]) {
      words = WORD_LISTS.hangman[category];
    } else {
      const categories = Object.values(WORD_LISTS.hangman);
      words = categories[Math.floor(Math.random() * categories.length)];
    }
  } else if (gameType === 'wordchain') {
    words = WORD_LISTS.wordchain;
  } else {
    words = WORD_LISTS.scribble || [];
  }
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

function getRandomTriviaQuestion() {
  const questions = WORD_LISTS.trivia;
  return questions[Math.floor(Math.random() * questions.length)];
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('create-room', ({ playerName, roomName, gameType = 'scribble', settings = {} }, callback) => {
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const room = {
      id: roomId,
      name: roomName,
      gameType,
      hostId: socket.id,
      players: [{ id: socket.id, name: playerName, score: 0 }],
      gameStarted: false,
      currentWord: null,
      isDrawer: null,
      round: 0,
      totalRounds: settings.rounds || 3,
      roundTime: settings.roundTime || 80,
      timeLeft: 0,
      category: settings.category || 'animals',
      guessedLetters: [],
      wrongGuesses: 0,
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = playerName;
    socket.data.gameType = gameType;
    
    callback({ success: true, room, playerId: socket.id });
    console.log(`Room ${roomId} (${gameType}) created by ${playerName}`);
  });

  socket.on('join-room', ({ roomId, playerName }, callback) => {
    const room = rooms.get(roomId.toUpperCase());
    
    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }
    
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (existingPlayer) {
      callback({ success: true, room, playerId: socket.id });
      return;
    }
    
    room.players.push({ id: socket.id, name: playerName, score: 0 });
    
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.playerName = playerName;
    socket.data.gameType = room.gameType;
    
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
    room.guessedLetters = [];
    room.wrongGuesses = 0;
    
    if (room.gameType === 'scribble') {
      room.isDrawer = room.players[0].id;
      room.currentWord = getRandomWord('scribble');
    } else if (room.gameType === 'hangman') {
      room.isDrawer = null;
      room.currentWord = getRandomWord('hangman', room.category);
    } else if (room.gameType === 'wordchain') {
      room.isDrawer = null;
      room.currentWord = WORD_LISTS.wordchain[Math.floor(Math.random() * WORD_LISTS.wordchain.length)];
      room.chainWords = [room.currentWord];
      room.lastLetter = room.currentWord.slice(-1);
      room.currentPlayerIndex = 0;
      room.wordChainTime = 20;
    } else if (room.gameType === 'trivia') {
      room.isDrawer = null;
      room.triviaQuestionIndex = 0;
      room.currentWord = ''; // Not used for trivia
      room.currentQuestion = getRandomTriviaQuestion();
      room.triviaAnswers = {};
      room.triviaRevealed = false;
    }
    room.timeLeft = room.roundTime;
    
    io.to(roomId).emit('game-started', {
      room,
      word: room.currentWord,
      round: room.round,
      timeLeft: room.timeLeft,
    });
    
    // Emit Word Chain specific event
    if (room.gameType === 'wordchain') {
      io.to(roomId).emit('wordchain-start', {
        word: room.currentWord,
        startedBy: socket.id,
      });
    }
    
    // Emit Trivia specific event
    if (room.gameType === 'trivia') {
      io.to(roomId).emit('trivia-start', {
        question: room.currentQuestion,
      });
    }
    
    callback({ success: true });
  });

  // Scribble events
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
    
    if (isCorrect && room.gameType === 'scribble') {
      const points = room.timeLeft * 10;
      const player = room.players.find(p => p.id === socket.id);
      if (player) player.score += points;
      
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

  // Hangman events
  socket.on('hangman-guess', ({ roomId, letter }, callback) => {
    const room = rooms.get(roomId);
    if (!room || room.gameType !== 'hangman') return;
    
    const letterUpper = letter.toUpperCase();
    if (room.guessedLetters.includes(letterUpper)) {
      if (callback) callback({ success: false, error: 'Already guessed' });
      return;
    }
    
    room.guessedLetters.push(letterUpper);
    
    const isCorrect = room.currentWord.includes(letterUpper);
    
    io.to(roomId).emit('hangman-update', {
      guessedLetters: room.guessedLetters,
      wrongGuesses: room.wrongGuesses,
      playerId: socket.id,
      playerName: socket.data.playerName,
      letter: letterUpper,
      isCorrect,
    });
    
    if (!isCorrect) {
      room.wrongGuesses++;
      if (room.wrongGuesses >= 6) {
        // Round over - move to next round or game over
        io.to(roomId).emit('hangman-round-over', {
          word: room.currentWord,
          winner: null,
          round: room.round,
          totalRounds: room.totalRounds,
        });
        nextHangmanRound(roomId, room);
      }
    } else {
      // Check if won
      const won = room.currentWord.split('').every(l => room.guessedLetters.includes(l));
      if (won) {
        const player = room.players.find(p => p.id === socket.id);
        if (player) player.score += 100;
        
        io.to(roomId).emit('hangman-round-over', {
          word: room.currentWord,
          winner: { id: socket.id, name: socket.data.playerName, score: 100 },
          round: room.round,
          totalRounds: room.totalRounds,
        });
        nextHangmanRound(roomId, room);
      }
    }
    
    if (callback) callback({ success: true, isCorrect });
  });

  // Word Chain events
  socket.on('wordchain-submit', ({ roomId, word }, callback) => {
    const room = rooms.get(roomId);
    if (!room || room.gameType !== 'wordchain') return;
    
    const wordUpper = word.toUpperCase().trim();
    const currentPlayer = room.players[room.currentPlayerIndex];
    
    // Only the current player can submit
    if (currentPlayer.id !== socket.id) {
      if (callback) callback({ success: false, error: 'Not your turn' });
      return;
    }
    
    // Validate word starts with last letter
    if (room.lastLetter && !wordUpper.startsWith(room.lastLetter)) {
      if (callback) callback({ success: false, error: `Word must start with "${room.lastLetter}"` });
      return;
    }
    
    // Check if word was already used
    if (room.chainWords.includes(wordUpper)) {
      if (callback) callback({ success: false, error: 'Word already used!' });
      return;
    }
    
    // Add word to chain
    room.chainWords.push(wordUpper);
    room.lastLetter = wordUpper.slice(-1);
    
    // Award points
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.score += 10;
    
    // Move to next player
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    
    io.to(roomId).emit('wordchain-word', {
      word: wordUpper,
      playerId: socket.id,
      playerName: socket.data.playerName,
      isValid: true,
      newChain: room.chainWords,
    });
    
    // Check if round should end (chain gets too long or players want to continue)
    // For now, just continue indefinitely until host ends
    
    if (callback) callback({ success: true });
  });

  // Trivia events
  socket.on('trivia-submit', ({ roomId, answer }, callback) => {
    const room = rooms.get(roomId);
    if (!room || room.gameType !== 'trivia') return;
    
    const answerUpper = answer.toUpperCase().trim();
    
    // Already answered this round
    if (room.triviaAnswers && room.triviaAnswers[socket.id]) {
      if (callback) callback({ success: false, error: 'Already answered' });
      return;
    }
    
    if (!room.triviaAnswers) room.triviaAnswers = {};
    const isCorrect = answerUpper === room.currentQuestion.answer;
    room.triviaAnswers[socket.id] = { answer: answerUpper, isCorrect };
    
    // Award points if correct
    if (isCorrect) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) player.score += 100;
    }
    
    io.to(roomId).emit('trivia-answer', {
      playerId: socket.id,
      playerName: socket.data.playerName,
      answer: answerUpper,
      isCorrect,
    });
    
    // Check if all players answered or enough time passed
    const totalPlayers = room.players.length;
    const answeredCount = Object.keys(room.triviaAnswers).length;
    
    if (answeredCount >= totalPlayers || (isCorrect && answeredCount >= Math.ceil(totalPlayers / 2))) {
      // Reveal answer and move to next round
      room.triviaRevealed = true;
      io.to(roomId).emit('trivia-reveal', { answer: room.currentQuestion.answer });
      
      // Find winner for this round
      let roundWinner = null;
      for (const [playerId, data] of Object.entries(room.triviaAnswers)) {
        if (data.isCorrect) {
          const player = room.players.find(p => p.id === playerId);
          if (player) {
            roundWinner = { id: playerId, name: player.name, score: player.score };
            break;
          }
        }
      }
      
      // Emit round over
      setTimeout(() => {
        io.to(roomId).emit('trivia-round-over', {
          winner: roundWinner,
          round: room.round,
          totalRounds: room.totalRounds,
        });
        
        // Move to next round
        nextTriviaRound(roomId, room);
      }, 2000);
    }
    
    if (callback) callback({ success: true });
  });

  socket.on('leave-room', () => handleLeave(socket));
  socket.on('disconnect', () => handleLeave(socket));
});

function nextRound(roomId, room) {
  if (room.round >= room.totalRounds) {
    room.gameStarted = false;
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    io.to(roomId).emit('game-over', { winner, scores: room.players });
    return;
  }
  
  room.round++;
  room.guessedLetters = [];
  room.wrongGuesses = 0;
  
  if (room.gameType === 'scribble') {
    const currentDrawerIndex = room.players.findIndex(p => p.id === room.isDrawer);
    room.isDrawer = room.players[(currentDrawerIndex + 1) % room.players.length].id;
    room.currentWord = getRandomWord('scribble');
  } else if (room.gameType === 'hangman') {
    room.currentWord = getRandomWord('hangman', room.category);
  } else if (room.gameType === 'wordchain') {
    room.currentWord = WORD_LISTS.wordchain[Math.floor(Math.random() * WORD_LISTS.wordchain.length)];
    room.chainWords = [room.currentWord];
    room.lastLetter = room.currentWord.slice(-1);
    room.currentPlayerIndex = 0;
  }
  room.timeLeft = room.roundTime;
  
  io.to(roomId).emit('next-round', {
    round: room.round,
    word: room.currentWord,
    timeLeft: room.timeLeft,
  });
}

function nextHangmanRound(roomId, room) {
  if (room.round >= room.totalRounds) {
    // Game over - show final standings
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
  room.guessedLetters = [];
  room.wrongGuesses = 0;
  room.currentWord = getRandomWord('hangman', room.category);
  
  io.to(roomId).emit('next-round', {
    round: room.round,
    word: room.currentWord,
  });
}

function nextTriviaRound(roomId, room) {
  if (room.round >= room.totalRounds) {
    // Game over - show final standings
    room.gameStarted = false;
    const winner = [...room.players].sort((a, b) => b.score - a.score)[0];
    io.to(roomId).emit('trivia-game-over', {
      winner,
      scores: room.players,
    });
    return;
  }
  
  // Next round
  room.round++;
  room.triviaAnswers = {};
  room.triviaRevealed = false;
  room.currentQuestion = getRandomTriviaQuestion();
  
  io.to(roomId).emit('next-round', {
    round: room.round,
    question: room.currentQuestion,
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
    console.log(`Room ${roomId} deleted`);
  } else {
    if (wasHost && room.players.length > 0) {
      room.hostId = room.players[0].id;
      io.to(roomId).emit('new-host', { hostId: room.hostId });
    }
    
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
