import { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';

interface CodenamesCard {
  word: string;
  type: 'red' | 'blue' | 'neutral' | 'assassin';
  revealed: boolean;
}

export default function CodenamesGame() {
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('roomId');
  
  const { 
    socket, 
    room, 
    players, 
    isGameStarted,
    isHost 
  } = useContext(SocketContext)!;
  
  const [cards, setCards] = useState<CodenamesCard[]>([]);
  const [myTeam, setMyTeam] = useState<'red' | 'blue' | null>(null);
  const [isSpymaster, setIsSpymaster] = useState(false);
  const [clue, setClue] = useState<{word: string; number: number}>({ word: '', number: 1 });
  const [currentTurn, setCurrentTurn] = useState<'red' | 'blue'>('red');
  const [guessesLeft, setGuessesLeft] = useState(0);
  const [gameOver, setGameOver] = useState<{ winner: string | null; reason: string } | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('codenames-setup', (data: { cards: CodenamesCard[]; team: 'red' | 'blue'; isSpymaster: boolean }) => {
      setCards(data.cards);
      setMyTeam(data.team);
      setIsSpymaster(data.isSpymaster);
    });

    socket.on('codenames-turn', (data: { team: 'red' | 'blue'; guessesLeft: number; clue: { word: string; number: number } | null }) => {
      setCurrentTurn(data.team);
      setGuessesLeft(data.guessesLeft);
      if (data.clue) {
        setClue(data.clue);
      }
    });

    socket.on('codenames-card-revealed', (data: { index: number; type: string }) => {
      setCards(prev => prev.map((card, i) => 
        i === data.index ? { ...card, revealed: true } : card
      ));
    });

    socket.on('codenames-game-over', (data: { winner: string | null; reason: string }) => {
      setGameOver(data);
    });

    socket.on('codenames-correct-guess', (data: { guessesLeft: number }) => {
      setGuessesLeft(data.guessesLeft);
    });

    socket.on('room-updated', (updatedRoom: any) => {
      if (updatedRoom.gameType === 'codenames') {
        setCards(updatedRoom.cards || []);
      }
    });

    return () => {
      socket.off('codenames-setup');
      socket.off('codenames-turn');
      socket.off('codenames-card-revealed');
      socket.off('codenames-game-over');
      socket.off('codenames-correct-guess');
      socket.off('room-updated');
    };
  }, [socket]);

  const startGame = () => {
    socket?.emit('start-codenames', { roomId });
  };

  const giveClue = () => {
    if (clue.word && clue.number > 0) {
      socket?.emit('codenames-clue', { roomId, clue: { word: clue.word.toUpperCase(), number: clue.number } });
      setClue({ word: '', number: 1 });
    }
  };

  const guessWord = (index: number) => {
    socket?.emit('codenames-guess', { roomId, index });
  };

  const redScore = cards.filter(c => c.type === 'red' && c.revealed).length;
  const blueScore = cards.filter(c => c.type === 'blue' && c.revealed).length;
  const redRemaining = cards.filter(c => c.type === 'red' && !c.revealed).length;
  const blueRemaining = cards.filter(c => c.type === 'blue' && !c.revealed).length;

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">🎯 Codenames</h1>
          <div className="text-sm text-gray-400">Room: {room.id}</div>
        </div>
        
        {/* Score Board */}
        <div className="flex justify-center gap-8 mb-4">
          <div className={`text-center p-4 rounded-xl ${currentTurn === 'red' ? 'bg-red-600/30 ring-2 ring-red-500' : 'bg-gray-800'}`}>
            <div className="text-red-500 font-bold text-xl">🔴 Red Team</div>
            <div className="text-3xl font-bold">{redScore}/{redScore + redRemaining}</div>
            <div className="text-sm text-gray-400">remaining</div>
          </div>
          <div className={`text-center p-4 rounded-xl ${currentTurn === 'blue' ? 'bg-blue-600/30 ring-2 ring-blue-500' : 'bg-gray-800'}`}>
            <div className="text-blue-500 font-bold text-xl">🔵 Blue Team</div>
            <div className="text-3xl font-bold">{blueScore}/{blueScore + blueRemaining}</div>
            <div className="text-sm text-gray-400">remaining</div>
          </div>
        </div>

        {/* Current Turn & Clue */}
        {room.gameStarted && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4 text-center">
            <div className="text-lg mb-2">
              {currentTurn === 'red' ? '🔴' : '🔵'} {currentTurn === 'red' ? 'Red' : 'Blue'} Team's Turn
            </div>
            {guessesLeft > 0 && (
              <div className="text-amber-400 text-xl font-bold mb-2">
                Guesses left: {guessesLeft}
              </div>
            )}
            {clue.word && (
              <div className="text-green-400 text-2xl font-bold">
                Clue: "{clue.word}" - {clue.number}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Board */}
      {room.gameStarted ? (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="grid grid-cols-5 gap-2 mb-6">
            {cards.map((card, index) => (
              <button
                key={index}
                onClick={() => !card.revealed && guessWord(index)}
                disabled={card.revealed || myTeam !== currentTurn || isSpymaster}
                className={`
                  h-20 rounded-lg font-bold text-sm transition-all
                  ${card.revealed 
                    ? card.type === 'red' 
                      ? 'bg-red-600' 
                      : card.type === 'blue' 
                        ? 'bg-blue-600' 
                        : card.type === 'assassin'
                          ? 'bg-black'
                          : 'bg-gray-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                  }
                  ${!card.revealed && myTeam === currentTurn && !isSpymaster ? 'cursor-pointer' : 'cursor-default'}
                `}
              >
                {card.revealed ? (
                  <span className={card.type === 'assassin' ? 'text-red-500' : 'text-white'}>
                    {card.word}
                  </span>
                ) : (
                  <span className="text-white">{card.word}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto text-center mb-6">
          <p className="text-gray-400 mb-4">Waiting for host to start the game...</p>
          {isHost && (
            <button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl"
            >
              Start Game
            </button>
          )}
        </div>
      )}

      {/* Spymaster Controls */}
      {isSpymaster && room.gameStarted && currentTurn === myTeam && (
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl p-4 mb-6">
          <h3 className="font-bold text-lg mb-2">🎖️ Spymaster Controls</h3>
          <p className="text-sm text-gray-400 mb-4">Give your team a one-word clue!</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={clue.word}
              onChange={(e) => setClue({ ...clue, word: e.target.value })}
              placeholder="Clue word..."
              className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
            <input
              type="number"
              min="1"
              max="9"
              value={clue.number}
              onChange={(e) => setClue({ ...clue, number: parseInt(e.target.value) || 1 })}
              className="w-20 bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
            <button
              onClick={giveClue}
              className="bg-amber-600 hover:bg-amber-700 px-6 py-2 rounded-lg font-bold"
            >
              Give Clue
            </button>
          </div>
        </div>
      )}

      {/* Players */}
      <div className="max-w-4xl mx-auto">
        <h3 className="font-bold text-lg mb-2">👥 Players</h3>
        <div className="flex flex-wrap gap-2">
          {players.map((player) => (
            <div key={player.id} className="bg-gray-800 px-4 py-2 rounded-lg">
              {player.name}
            </div>
          ))}
        </div>
      </div>

      {/* Game Over */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <div className="bg-gray-800 p-8 rounded-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              {gameOver.winner === 'red' ? '🔴 Red' : gameOver.winner === 'blue' ? '🔵 Blue' : '😱'} {gameOver.winner === 'assassin' ? 'Assassin!' : 'Wins!'}
            </h2>
            <p className="text-gray-400 mb-4">{gameOver.reason}</p>
            <a href="/" className="text-blue-400 hover:underline">Back to Home</a>
          </div>
        </div>
      )}
    </div>
  );
}
