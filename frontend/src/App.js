import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Admin from './pages/Admin/Admin';
import style from './app.module.scss';
import io from 'socket.io-client';

const socket = io(`/api/`);

function App() {
  return (
    <div className={style.app}>
      <Routes>
        <Route path="/" element={<Home socket={socket} />} />
        <Route path="/session/:id" element={<Admin socket={socket} />} />
      </Routes>
    </div>
  );
}

export default App;
