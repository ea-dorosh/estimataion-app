import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Admin from './components/Admin';
import User from './components/User';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:id" element={<Admin />} />
        <Route path="/session-user/:id" element={<User />} />
      </Routes>
    </div>
  );
}

export default App;
