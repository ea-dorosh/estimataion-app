import React, { useState, useEffect, useMemo } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';

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
      <h2>Session ID: {sessionId}</h2>

      <div style={{ display: `flex`, alignItems: `center` }}>
        <h4>{sessionUserUrl}</h4>

        <button 
          onClick={handleCopyUrl} 
          style={{ cursor: `pointer`, marginLeft: `10px` }} 
          title="Copy URL"
        >Copy Link</button>
      </div>

      <div>
        <h3>Active Users:</h3>

        <button 
          onClick={() => {
            if(!shouldShowResults) {
              socket.emit(`showResults`, { sessionId });
            } else {
              socket.emit(`resetResults`, { sessionId });
            }
          }} 
        >
          {!shouldShowResults ? `Show Results` : `Reset Results`}
        </button>

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
  );
}

export default Admin;
