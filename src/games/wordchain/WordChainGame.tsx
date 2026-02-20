import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../context/SocketContext';

const HOW_TO_PLAY = {
  steps: [
    "A starting word is given.",
    "Take turns saying words starting with last letter.",
    "Example: Apple → Elephant → Tiger → ...",
    "10 points per valid word!"
  ]
};

export default function WordChainGame() {
  const navigate = useNavigate();
  const { room, players, currentPlayer, messages, timeLeft, isGameStarted, isHost, socket, leaveRoom: socketLeaveRoom, startGame } = useSocket();
  const [showHelp, setShowHelp] = useState(false);
  const [inputWord, setInputWord] = useState('');
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<{ id: string; name: string; score: number } | null>(null);
  const [chainWords, setChainWords] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [lastLetter, setLastLetter] = useState('');

  useEffect(() => {
    if (!socket) return;
    socket.on('wordchain-start', ({ word }) => {
      setChainWords([word]);
      setLastLetter(word.slice(-1));
      setCurrentTurn(0);
    });
    socket.on('wordchain-word', ({ word, newChain }) => {
      if (newChain) setChainWords(newChain);
      setLastLetter(word.slice(-1));
      setCurrentTurn(prev => (prev + 1) % players.length);
    });
    socket.on('wordchain-game-over', ({ winner: w }) => { setIsGameOver(true); setWinner(w); });
    return () => { socket.off('wordchain-start'); socket.off('wordchain-word'); socket.off('wordchain-game-over'); };
  }, [socket, players.length]);

  const handleLeave = () => { socketLeaveRoom(); navigate('/'); };
  const handleSubmitWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim() || !isGameStarted) return;
    const word = inputWord.trim().toUpperCase();
    if (lastLetter && !word.startsWith(lastLetter)) { alert(`Start with "${lastLetter}"!`); return; }
    socket?.emit('wordchain-submit', { roomId: room?.id, word });
    setInputWord('');
  };
  const handleStart = () => { setIsGameOver(false); setWinner(null); startGame(); };
  const isMyTurn = players[currentTurn]?.id === currentPlayer?.id;

  if (!room) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <header className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">🔤 Word Chain</h1>
          <span className="text-gray-400 text-sm">{room.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {isGameStarted && <span className="text-purple-400 font-bold">{timeLeft}s</span>}
          <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-white">❓</button>
          <button onClick={handleLeave} className="text-gray-400 hover:text-red-400">✕</button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          {isGameStarted ? (
            <>
              <p className="text-gray-400 text-sm mb-4">Chain: {chainWords.join(' → ')}</p>
              <p className="text-4xl font-bold text-purple-400 mb-4">Next: {lastLetter}</p>
              <p className="text-gray-400 mb-4">{isMyTurn ? "🎯 Your turn!" : `Waiting for ${players[currentTurn]?.name}...`}</p>
              <form onSubmit={handleSubmitWord} className="flex gap-2 w-full max-w-md">
                <input value={inputWord} onChange={e => setInputWord(e.target.value)} placeholder={lastLetter ? `Word starting with "${lastLetter}"` : '...'} disabled={!isMyTurn}
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-xl font-bold uppercase" />
                <button type="submit" disabled={!isMyTurn} className="px-6 bg-purple-500 rounded-lg font-bold disabled:opacity-50">Send</button>
              </form>
            </>
          ) : (
            <p className="text-gray-400">Waiting for host to start...</p>
          )}
          {isGameOver && <div className="mt-6 text-center"><p className="text-2xl font-bold">{winner ? `${winner.name} wins!` : 'Game Over!'}</p><button onClick={handleStart} className="mt-4 px-6 py-2 bg-emerald-500 rounded-lg">Play Again</button></div>}
        </div>

        <div className="w-64 bg-gray-800 p-4 flex flex-col">
          <h3 className="font-bold mb-3">Players</h3>
          <div className="space-y-2 mb-4">
            {players.map((p) => <div key={p.id} className="flex justify-between bg-gray-700/50 px-3 py-2 rounded"><span>{p.name}</span><span className="text-purple-400">{p.score}</span></div>)}
          </div>
          <h3 className="font-bold mb-3">Chat</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {messages.map((msg) => <div key={msg.id} className="text-sm bg-gray-700/50 px-2 py-1 rounded"><span className="font-bold">{msg.playerName}: </span><span>{msg.message}</span></div>)}
          </div>
        </div>
      </div>

      {!isGameStarted && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">Room</h2>
            <div className="mb-4">
              <p className="text-gray-400 mb-2 text-sm">Code:</p>
              <div className="flex gap-2">
                <input type="text" value={room.id} readOnly className="flex-1 px-4 py-3 bg-gray-700 rounded-lg text-center text-2xl font-mono" />
                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/wordchain/join?room=${room.id}`)} className="px-4 bg-purple-500 rounded-lg">📋</button>
              </div>
            </div>
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {players.map((p) => <div key={p.id} className="bg-gray-700/50 px-4 py-2 rounded-lg">{p.name}</div>)}
            </div>
            {isHost ? <button onClick={handleStart} className="w-full py-3 bg-emerald-500 rounded-lg font-bold">Start</button> : <div className="w-full py-3 bg-gray-700 text-center text-gray-400">Waiting...</div>}
          </div>
        </div>
      )}

      {showHelp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">{HOW_TO_PLAY.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
            <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-3 bg-purple-500 rounded-lg font-bold">Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}
