import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Admin from './pages/Admin/Admin';
import style from './app.module.scss';
import io from 'socket.io-client';
import SnowfallEffect from './components/SnowfallEffect/SnowfallEffect';

const socket = io(process.env.REACT_APP_BACKEND_URL, {
  withCredentials: true,
  transports: [`websocket`, `polling`],
});

function App() {
  return (
    <div className={style.app}>
      <Routes>
        <Route path="/" element={<Home socket={socket} />} />
        <Route path="/session/:id" element={<Admin socket={socket} />} />
      </Routes>

      <SnowfallEffect />
    </div>
  );
}

export default App;
