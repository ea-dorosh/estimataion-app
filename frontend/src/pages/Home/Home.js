import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';

function Home({ socket }) {
  const navigate = useNavigate();

  useEffect(() => {
    socket.on(`createSessionServer`, ({session, sessionId}) => {
      console.log(`createSessionServer`, session);

      sessionStorage.setItem(`${sessionId}`, `admin`);

      navigate(`/session/${sessionId}`);
    });
  }, []);

  const createSession = () => {
    const sessionId = Date.now().toString();

    socket.emit(`createSession`, { sessionId });
  };

  return (
    <div>
      <button onClick={createSession}>Create Session</button>
    </div>
  );
}

export default Home;