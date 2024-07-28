import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import style from './admin.module.scss';
import Button from '../../components/Button/Button';

const socket = io(`http://localhost:4000`);

function Admin() {
  const [users, setUsers] = useState([]);
  const { id: sessionId } = useParams();
  const [shouldShowResults, setShouldShowResults] = useState(false);

  const sessionUserUrl = useMemo(() => {
    return window.location.href.replace(`session`, `session-user`);
  }, []);

  useEffect(() => {
    console.log(`shouldShowResults`, shouldShowResults);
  }, [shouldShowResults]);


  useEffect(() => {
    socket.emit(`joinSession`, { sessionId, name: `Admin` });

    socket.on(`updateUsers`, (users) => {
      setUsers(users);
    });

    socket.on(`showResultsServer`, () => {
      setShouldShowResults(true);
    });

    socket.on(`resetResultsServer`, (users) => {
      console.log(`resetResultsServer`, users);
      setShouldShowResults(false);
      setUsers(users);
    });

    // Fetch users again when admin reconnects
    socket.emit(`getUsers`, { sessionId });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sessionUserUrl)
      .catch((err) => {
        alert(`Failed to copy: `, err);
      });
  };

  return (
    <div>
      <div className={style.sessionUrl}>
        <h4>{sessionUserUrl}</h4>

        <Button 
          onClick={handleCopyUrl}
          primary
        >
          Copy Link
        </Button>
      </div>

      <div>
        <div>
          <div className={style.subtitleWrapper}>
            <h3 className={style.subtitle}>Frontend</h3>

            <Button
              primary
              onClick={() => {
                if(!shouldShowResults) {
                  socket.emit(`showResults`, { sessionId });
                } else {
                  socket.emit(`resetResults`, { sessionId });
                }
              }} 
            >
              {!shouldShowResults ? `Show Results` : `Reset Results`}
            </Button>
          </div>

          <ul>
            {users.map((user) => (
              <li 
                key={user.id}
                className={style.user}
              >
                <span
                  className={style.userName}
                >
                  {user.name}
                </span>

                <span className={style.userValue}>
                  {!shouldShowResults && 
                    <div>
                      {user.value ? `ready` : `?`}
                    </div>
                  }

                  {shouldShowResults && 
                    <div>
                      {user.value}
                    </div>
                  }
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Admin;
