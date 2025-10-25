// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Lobby from './pages/Lobby'; // ✅ updated import
import Room from './pages/Room';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} /> {/* ✅ updated route */}
        <Route path="/room/:sessionId/:name" element={<Room />} />
      </Routes>
    </Router>
  );
}

export default App;
