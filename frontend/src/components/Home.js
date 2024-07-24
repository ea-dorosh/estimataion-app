import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  const createSession = () => {
    const sessionId = Date.now().toString(); // Простой способ создания уникального ID сессии
    navigate(`/session/${sessionId}`);
  };

  return (
    <div>
      <button onClick={createSession}>Create Session</button>
    </div>
  );
}

export default Home;
