import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import CreateHangmanRoom from './pages/CreateHangmanRoom';
import JoinHangmanRoom from './pages/JoinHangmanRoom';
import CreateWordChainRoom from './pages/CreateWordChainRoom';
import JoinWordChainRoom from './pages/JoinWordChainRoom';
import CreateTriviaRoom from './pages/CreateTriviaRoom';
import JoinTriviaRoom from './pages/JoinTriviaRoom';
import ScribbleGame from './games/scribble/ScribbleGame';
import HangmanGame from './games/hangman/HangmanGame';
import WordChainGame from './games/wordchain/WordChainGame';
import TriviaGame from './games/trivia/TriviaGame';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Scribble */}
          <Route path="/scribble" element={<Navigate to="/scribble/create" />} />
          <Route path="/scribble/create" element={<CreateRoom />} />
          <Route path="/scribble/join" element={<JoinRoom />} />
          <Route path="/scribble/room" element={<ScribbleGame />} />
          
          {/* Hangman */}
          <Route path="/hangman" element={<Navigate to="/hangman/create" />} />
          <Route path="/hangman/create" element={<CreateHangmanRoom />} />
          <Route path="/hangman/join" element={<JoinHangmanRoom />} />
          <Route path="/hangman/room" element={<HangmanGame />} />
          
          {/* Word Chain */}
          <Route path="/wordchain" element={<Navigate to="/wordchain/create" />} />
          <Route path="/wordchain/create" element={<CreateWordChainRoom />} />
          <Route path="/wordchain/join" element={<JoinWordChainRoom />} />
          <Route path="/wordchain/room" element={<WordChainGame />} />
          
          {/* Trivia Quiz */}
          <Route path="/trivia" element={<Navigate to="/trivia/create" />} />
          <Route path="/trivia/create" element={<CreateTriviaRoom />} />
          <Route path="/trivia/join" element={<JoinTriviaRoom />} />
          <Route path="/trivia/room" element={<TriviaGame />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
