import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Admin from './pages/Admin/Admin';
import User from './pages/User/User';
import style from './app.module.scss';


function App() {
  return (
    <div className={style.app}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:id" element={<Admin />} />
        <Route path="/session-user/:id" element={<User />} />
      </Routes>
    </div>
  );
}

export default App;
