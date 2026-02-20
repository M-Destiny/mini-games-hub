import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const HOW_TO_PLAY = {
  steps: [
    "A question will be displayed on the screen.",
    "Players have multiple choice answers (A, B, C, D).",
    "Type your answer in the chat (A, B, C, or D).",
    "First correct answer gets 100 points!",
    "Wrong answer = 0 points.",
    "Play multiple rounds - highest score wins!",
    "Work together or compete - it's up to you!"
  ]
};

export default function TriviaGame() {
  const navigate = useNavigate();
  const {
    room,
    players,
    currentPlayer,
    messages,
    setMessages,
    isGameStarted,
    isHost,
    round: currentRound,
    totalRounds,
    socket,
    leaveRoom: socketLeaveRoom,
    startGame,
  } = useSocket();

  const [showHelp, setShowHelp] = useState(false);
  const [inputAnswer, setInputAnswer] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<{ id: string; name: string; score: number } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{ q: string; options: string[]; answer: string } | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for game events
  useEffect(() => {
    if (!socket) return;

    socket.on('trivia-start', ({ question }) => {
      setCurrentQuestion(question);
      setShowAnswer(false);
      setHasAnswered(false);
    });

    socket.on('trivia-answer', ({ playerId, playerName, answer, isCorrect }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId,
        playerName,
        message: `answered ${answer} ${isCorrect ? '✓' : '✗'}`,
        isCorrect,
        timestamp: Date.now(),
      }]);
    });

    socket.on('trivia-reveal', ({ answer: _answer }) => {
      setShowAnswer(true);
    });

    socket.on('trivia-round-over', ({ winner, round, totalRounds }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        playerId: 'system',
        playerName: '🎯',
        message: winner 
          ? `${winner.name} won this round! (+100 pts) - Round ${round}/${totalRounds}`
          : `No winner this round - Round ${round}/${totalRounds}`,
        isCorrect: false,
        timestamp: Date.now(),
      }]);
    });

    socket.on('trivia-game-over', ({ winner: w }) => {
      setIsGameOver(true);
      setWinner(w);
    });

    socket.on('next-round', ({ question }) => {
      setCurrentQuestion(question);
      setShowAnswer(false);
      setHasAnswered(false);
    });

    return () => {
      socket.off('trivia-start');
      socket.off('trivia-answer');
      socket.off('trivia-reveal');
      socket.off('trivia-round-over');
      socket.off('trivia-game-over');
      socket.off('next-round');
    };
  }, [socket, setMessages]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLeave = () => {
    socketLeaveRoom();
    navigate('/');
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnswer.trim() || !isGameStarted || hasAnswered || !currentQuestion) return;
    
    const answer = inputAnswer.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(answer)) {
      alert('Please enter A, B, C, or D');
      return;
    }
    
    socket?.emit('trivia-submit', { roomId: room?.id, answer });
    setHasAnswered(true);
    setInputAnswer('');
  };

  const handleStart = () => {
    setIsGameOver(false);
    setWinner(null);
    setCurrentQuestion(null);
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

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">❓ Trivia Quiz</h1>
          <span className="font-mono text-sm">{room?.name}</span>
          <span className="bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full text-xs">{room?.id}</span>
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
          <button onClick={handleLeave} className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 text-sm">
            ✕ Exit
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Game Area */}
        <div className="flex-1 flex flex-col p-4 overflow-auto">
          {isGameStarted && currentQuestion ? (
            <>
              {/* Question Card */}
              <div className="bg-gray-800 rounded-xl p-6 mb-4">
                <div className="text-center mb-6">
                  <p className="text-sm text-gray-400 mb-2">Question</p>
                  <h2 className="text-2xl font-bold">{currentQuestion.q}</h2>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {currentQuestion.options.map((option, i) => {
                    const letter = ['A', 'B', 'C', 'D'][i];
                    const isCorrect = currentQuestion.answer === letter;
                    const showCorrect = showAnswer && isCorrect;
                    
                    return (
                      <div 
                        key={i}
                        className={`p-4 rounded-lg text-center font-medium transition ${
                          showCorrect 
                            ? 'bg-green-500 border-2 border-green-400' 
                            : 'bg-gray-700'
                        }`}
                      >
                        {option}
                        {showCorrect && <span className="ml-2">✓</span>}
                      </div>
                    );
                  })}
                </div>

                {/* Answer Status */}
                {showAnswer && (
                  <div className="text-center p-3 bg-amber-500/20 rounded-lg">
                    <p className="font-bold text-amber-400">Answer: {currentQuestion.answer}</p>
                  </div>
                )}

                {hasAnswered && !showAnswer && (
                  <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                    <p className="text-blue-400">✓ Answer submitted! Wait for others...</p>
                  </div>
                )}
              </div>

              {/* Answer Input */}
              {!showAnswer && (
                <form onSubmit={handleSubmitAnswer} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    placeholder={hasAnswered ? "Wait for answer..." : "Type A, B, C, or D"}
                    disabled={hasAnswered}
                    maxLength={1}
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 text-center text-xl font-bold uppercase"
                  />
                  <button
                    type="submit"
                    disabled={hasAnswered || !inputAnswer.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-lg font-bold disabled:opacity-50"
                  >
                    Submit
                  </button>
                </form>
              )}

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
                <p className="text-4xl mb-4">❓</p>
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
                  <span className="font-mono text-sm text-amber-400">{player.score}</span>
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
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/trivia/join?room=${room?.id}`)} className="px-4 bg-amber-500 hover:bg-amber-400 rounded-lg">📋</button>
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
              <button onClick={handleStart} disabled={players.length < 1} className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-bold disabled:opacity-50">
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
            <h2 className="text-2xl font-bold mb-4 text-center">❓ How to Play Trivia Quiz</h2>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">Test your knowledge with friends!</p>
              <ol className="list-decimal list-inside space-y-3">
                {HOW_TO_PLAY.steps.map((step, i) => (
                  <li key={i} className="text-base">{step}</li>
                ))}
              </ol>
              
              <div className="mt-6 p-4 bg-amber-500/20 rounded-lg">
                <p className="text-amber-300 font-bold">🏆 Scoring:</p>
                <ul className="list-disc list-inside mt-2 text-sm">
                  <li>Correct answer: 100 points</li>
                  <li>Wrong answer: 0 points</li>
                  <li>First to answer correctly wins!</li>
                </ul>
              </div>
            </div>

            <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg font-bold">
              Let's Play! 🎮
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
