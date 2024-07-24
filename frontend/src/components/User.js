import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';

const socket = io(`http://localhost:4000`);

function User() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState(``);
  const [hasJoined, setHasJoined] = useState(false);
  const [shouldShowResults, setShouldShowResults] = useState(false);

  const currentUserId = useMemo(() => {
    return users?.find((user) => user.name === name)?.id || null;
  }, [users]);

  console.log(`currentUserId`, currentUserId);

  const { id: sessionId } = useParams();

  useEffect(() => {
    socket.on(`updateUsers`, (users) => {
      setUsers(users);
    });

    socket.on(`showResultsServer`, () => {
      setShouldShowResults(true);
    });

    socket.on(`resetResultsServer`, (users) => {
      console.log(`resetResults`, users);
      setShouldShowResults(false);
      setUsers(users);
    });

    socket.emit(`getUsers`, { sessionId });
  }, []);


  const handleJoin = () => {
    socket.emit(`joinSession`, { sessionId, name });
    setHasJoined(true);
  };

  return (
    <div>
      <h2>Session ID: {sessionId}</h2>

      {!hasJoined &&
      <div>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
        />

        <button onClick={handleJoin}>Join</button>
      </div>
      }

      {hasJoined &&
      <div style={{ display: `flex` }}>
        <button
          onClick={()=>{
            socket.emit(`setValue`, {
              sessionId, 
              userId: currentUserId, 
              value: `0.5`,
            });
          }}
          disabled={shouldShowResults}
        >
          0.5
        </button>
        <button 
          onClick={()=>{
            socket.emit(`setValue`, {
              sessionId, 
              userId: currentUserId, 
              value: `1`,
            });
          }}
          disabled={shouldShowResults}
        >
          1
        </button>
        <button
          onClick={()=>{
            socket.emit(`setValue`, {
              sessionId, 
              userId: currentUserId, 
              value: `2`,
            });
          }}
          disabled={shouldShowResults}
        >
          2
        </button>
      </div>
      }

      <div>
        <h3>Active Users:</h3>
        <ul>
          {users.map((user) => (
            <li 
              key={user.id}
              style={{ display: `flex`, gap: `20px` }}
            >
              <span
                style={{ width: `100px` }}
              >
                {user.name}
              </span>

              <span style={{ display: `flex` }}>
                {!shouldShowResults && 
                  <div>
                    {user.id === currentUserId && (user.value ? user.value : `?`)}
                    {user.id !== currentUserId && (user.value ? `ready` : `?`)}
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
  );
}

export default User;
