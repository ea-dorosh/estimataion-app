import { useNavigate } from 'react-router-dom';
import React, { useEffect } from 'react';
import Button from '../../components/Button/Button';
import style from './home.module.scss';

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
    <div className={style.buttonWrapper}>
      <Button
        primary
        onClick={createSession}
      >
        Create Session
      </Button>
    </div>
  );
}

export default Home;