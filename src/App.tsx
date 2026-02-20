import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import ScribbleGame from './games/scribble/ScribbleGame';

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scribble" element={<Navigate to="/scribble/create" />} />
          <Route path="/scribble/create" element={<CreateRoom />} />
          <Route path="/scribble/join" element={<JoinRoom />} />
          <Route path="/scribble/room" element={<ScribbleGame />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
