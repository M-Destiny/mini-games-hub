import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const HOW_TO_PLAY = {
  steps: [
    "A starting word is given.",
    "Players take turns saying words that start with the last letter of the previous word.",
    "For example: Apple → Elephant → Tiger → Rabbit → ...",
    "If you can't think of a word in 15 seconds, you lose a life!",
    "Each valid word earns you 10 points.",
    "Play multiple rounds - highest score wins!",
    "Use chat to type your word."
  ]
};

export default function WordChainGame() {
  const navigate = useNavigate();
  const {
    room,
    players,
    currentPlayer,
    messages,
    setMessages,
    timeLeft,
    isGameStarted,
    isHost,
    round: currentRound,
    totalRounds,
    socket,
    leaveRoom: socketLeaveRoom,
    startGame,
  } = useSocket();

  const [showHelp, setShowHelp] = useState(false);
  const [inputWord, setInputWord] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<{ id: string; name: string; score: number } | null>(null);
  const [chainWords, setChainWords] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [lastLetter, setLastLetter] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for game events
  useEffect(() => {
    if (!socket) return;

    socket.on('wordchain-start', ({ word }) => {
      setChainWords([word]);
      setLastLetter(word.slice(-1));
      setCurrentTurn(0);
    });

    socket.on('wordchain-word', ({ word, playerId, playerName, isValid, newChain }) => {
      if (isValid) {
        setChainWords(newChain || [...chainWords, word]);
        setLastLetter(word.slice(-1));
        setCurrentTurn(prev => (prev + 1) % players.length);
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId,
        playerName,
        message: word,
        isCorrect: isValid,
        timestamp: Date.now(),
      }]);
    });

    socket.on('wordchain-round-over', ({ word, winner, round, totalRounds }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '🎯',
        message: winner 
          ? `${winner.name} won this round! (+50 pts) - Round ${round}/${totalRounds}`
          : `No winner this round. Word was: ${word} - Round ${round}/${totalRounds}`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
    });

    socket.on('wordchain-game-over', ({ winner: w }) => {
      setIsGameOver(true);
      setWinner(w);
    });

    socket.on('next-round', ({ word }) => {
      setChainWords([word]);
      setLastLetter(word.slice(-1));
      setCurrentTurn(0);
    });

    return () => {
      socket.off('wordchain-start');
      socket.off('wordchain-word');
      socket.off('wordchain-round-over');
      socket.off('wordchain-game-over');
      socket.off('next-round');
    };
  }, [socket, players.length, chainWords]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLeave = () => {
    socketLeaveRoom();
    navigate('/');
  };

  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim() || !isGameStarted) return;
    
    const word = inputWord.trim().toUpperCase();
    
    // Validate word starts with last letter
    if (lastLetter && !word.startsWith(lastLetter)) {
      alert(`Word must start with "${lastLetter}"!`);
      return;
    }
    
    // Send word to server
    socket?.emit('wordchain-submit', { roomId: room?.id, word });
    setInputWord('');
  };

  const handleStart = () => {
    setIsGameOver(false);
    setWinner(null);
    setChainWords([]);
    startGame();
  };

  const getRoundInfo = () => {
    const msg = messages.find(m => m.message?.includes('Round'));
    if (msg) {
      const match = msg.message.match(/Round (\d+)\/(\d+)/);
      if (match) return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return { current: currentRound || 1, total: totalRounds || 3 };
  };

  const roundInfo = getRoundInfo();

  // Check if it's current player's turn
  const isMyTurn = players[currentTurn]?.id === currentPlayer?.id;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">🔤 Word Chain</h1>
          <span className="font-mono text-sm">{room?.name}</span>
          <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">{room?.id}</span>
          {roundInfo && (
            <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-xs">
              R{roundInfo.current}/{roundInfo.total}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => setShowHelp(true)} className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 text-sm">
            ❓ How to Play
          </button>
          {isGameStarted && (
            <div className="flex items-center gap-2 bg-gray-700 px-3 py-1 rounded-lg">
              <span className="text-xl">⏱️</span>
              <span className="text-xl font-bold">{timeLeft}</span>
            </div>
          )}
          <button onClick={handleLeave} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">
            ✕ Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Area */}
        <div className="flex-1 flex flex-col p-4 overflow-auto">
          {isGameStarted ? (
            <>
              {/* Current Word Chain */}
              <div className="bg-gray-800 rounded-xl p-4 mb-4">
                <h2 className="text-lg font-bold mb-3">📝 Word Chain</h2>
                
                {/* Chain Display */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {chainWords.map((word, i) => (
                    <div key={i} className="flex items-center">
                      <span className={`px-3 py-1.5 rounded-lg font-bold ${i === chainWords.length - 1 ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-300'}`}>
                        {word}
                      </span>
                      {i < chainWords.length - 1 && <span className="text-gray-500 mx-1">→</span>}
                    </div>
                  ))}
                </div>

                {/* Last Letter Indicator */}
                {lastLetter && (
                  <div className="text-center p-3 bg-purple-500/20 rounded-lg">
                    <p className="text-sm text-gray-400">Next word must start with:</p>
                    <p className="text-3xl font-bold text-purple-400">{lastLetter}</p>
                  </div>
                )}

                {/* Turn Indicator */}
                <div className="mt-4 text-center">
                  {isMyTurn ? (
                    <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg inline-block">
                      🎯 Your turn! Type a word starting with "{lastLetter}"
                    </div>
                  ) : (
                    <div className="text-gray-400">
                      Waiting for {players[currentTurn]?.name}...
                    </div>
                  )}
                </div>
              </div>

              {/* Word Input */}
              <form onSubmit={handleSubmitWord} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder={lastLetter ? `Type a word starting with "${lastLetter}"` : 'Wait for game to start...'}
                  disabled={!isMyTurn}
                  className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!isMyTurn || !inputWord.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-bold disabled:opacity-50"
                >
                  Send
                </button>
              </form>

              {/* Game Over */}
              {isGameOver && (
                <div className={`p-4 rounded-xl text-center mb-4 ${winner ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                  <p className="text-xl font-bold">{winner ? `🎉 ${winner.name} wins!` : 'Game Over!'}</p>
                  {winner && <p className="text-gray-300 mt-1">Score: {winner.score} pts</p>}
                  {roundInfo.current < roundInfo.total ? (
                    <p className="text-yellow-400 mt-2">Next round coming...</p>
                  ) : (
                    <button onClick={handleStart} className="mt-3 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 rounded-lg font-bold">
                      Play Again
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl mb-4">🔤</p>
                <p className="text-xl text-gray-400">Waiting for host to start the game...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Chat & Players */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          {/* Players */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-bold mb-2">Players</h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {players.map((player) => (
                <div key={player.id} className="flex items-center justify-between bg-gray-700/50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{player.name}</span>
                    {player.id === currentPlayer?.id && <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded">You</span>}
                    {player.id === room?.hostId && <span className="text-xs bg-yellow-500/30 px-2 py-0.5 rounded">👑</span>}
                  </div>
                  <span className="font-mono text-sm text-purple-400">{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <h3 className="font-bold p-4 pb-2">Chat</h3>
            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`px-3 py-2 rounded-lg text-sm ${msg.playerId === 'system' ? 'bg-gray-700/50 text-center' : msg.playerId === currentPlayer?.id ? 'bg-purple-500/20' : 'bg-gray-700/50'}`}>
                  <span className="font-bold">{msg.playerName}: </span>
                  <span>{msg.message}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
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
                <input type="text" value={room?.id} readOnly className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-2xl font-mono" />
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/wordchain/join?room=${room?.id}`)} className="px-4 bg-purple-500 hover:bg-purple-400 rounded-lg">📋</button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-gray-400 mb-2 text-sm">Players:</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {players.map((player) => (
                  <div key={player.id} className="flex items-center gap-2 bg-gray-700/50 px-4 py-2 rounded-lg">
                    <span>{player.name}</span>
                    {player.id === currentPlayer?.id && <span className="text-xs bg-purple-500/30 px-2 py-0.5 rounded">You</span>}
                    {player.id === room?.hostId && <span className="text-xs bg-yellow-500/30 px-2 py-0.5 rounded">👑 Host</span>}
                  </div>
                ))}
              </div>
            </div>

            {isHost ? (
              <button onClick={handleStart} disabled={players.length < 1} className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-bold disabled:opacity-50">
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

      {/* How to Play Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 text-center">🔤 How to Play Word Chain</h2>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">Connect words with your friends!</p>
              <ol className="list-decimal list-inside space-y-3">
                {HOW_TO_PLAY.steps.map((step, i) => (
                  <li key={i} className="text-base">{step}</li>
                ))}
              </ol>
              
              <div className="mt-6 p-4 bg-purple-500/20 rounded-lg">
                <p className="text-purple-300 font-bold">💡 Example:</p>
                <p className="text-sm mt-2">APPLE → ELEPHANT → TIGER → RABBIT → ...</p>
              </div>
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg font-bold">
              Let's Play! 🎮
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
