import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';

function Home({ socket }) {
  const navigate = useNavigate();

  useEffect(() => {
    socket.on(`createSessionServer`, ({ sessionId }) => {
      sessionStorage.setItem(`${sessionId}`, `admin`);

      navigate(`/session/${sessionId}`);
    });

    // eslint-disable-next-line
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