import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import style from './admin.module.scss';
import Button from '../../components/Button/Button';
import VoteSection from '../../components/VoteSection/VoteSection';


function Admin({ socket }) {
  const [users, setUsers] = useState(null);
  const { id: sessionId } = useParams();
  const [shouldShowFEResults, setShouldShowFEResults] = useState(false);
  const [shouldShowBEResults, setShouldShowBEResults] = useState(false);

  const [hasJoinedFE, setHasJoinedFE] = useState(false);
  const [hasJoinedBE, setHasJoinedBE] = useState(false);
  const [name, setName] = useState(``);
  const [hasName, setHasName] = useState(false);

  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const socketId = useMemo(() => {
    return socket.id;
  }, [socket.id]);

  const isAdmin = useMemo(() => {
    const sessionValue = sessionStorage.getItem(`${sessionId}`);

    if (sessionValue && sessionValue === `admin`) {
      return true;
    }

    return false;
  }, [sessionId]);

  useEffect(() => {
    socket.emit(`getUsers`, { sessionId });

    socket.on(`updateUsers`, (users) => {
      setUsers(users);
    });

    socket.on(`sessionExpiredServer`, () => {
      setIsSessionExpired(true);
    });

    socket.on(`showResultsFEServer`, () => {
      setShouldShowFEResults(true);
    });

    socket.on(`resetResultsFEServer`, (users) => {
      setShouldShowFEResults(false);
      setUsers(users);
    });

    socket.on(`showResultsBEServer`, () => {
      setShouldShowBEResults(true);
    });

    socket.on(`resetResultsBEServer`, (users) => {
      setShouldShowBEResults(false);
      setUsers(users);
    });

    return () => {
      socket.disconnect();
    };

    // eslint-disable-next-line
  }, [sessionId]);

  const handleFrontendJoin = () => {
    socket.on(`joinSessionFeServer`, (socketIdServer) => {
      console.log(`handleFrontendJoin socketIdServer`, socketIdServer);
      if (socketIdServer === socketId) {
        setHasJoinedFE(true);
      }
    });

    socket.emit(`joinSessionFE`, { sessionId, name, socketId });
  };

  const handleBackendJoin = () => {
    socket.on(`joinSessionBeServer`, (socketIdServer) => {
      console.log(`handleBackendJoin socketIdServer`, socketIdServer);
      if (socketIdServer === socketId) {
        setHasJoinedBE(true);
      }
    });

    socket.emit(`joinSessionBE`, { sessionId, name, socketId });
  };

  const onSaveNameClick = () => {
    sessionStorage.setItem(`${sessionId}`, name);
    setHasName(true);
  }

  return (
    <div>
      {isSessionExpired && <div>
        <p style={{padding: `20px`, color: `white`}}>
          Session not found or expired
        </p>
      </div>}

      {!isSessionExpired && <div>
        {!isAdmin && !hasName && <div className={style.nameWrapper}>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            className={style.input}
          />

          <Button
            primary
            onClick={onSaveNameClick}
          >
            Save Name
          </Button>
        </div>}

        {(isAdmin || hasName) && <div className={style.pageWrapper}>
          <VoteSection
            handleJoin={handleFrontendJoin}
            isAdmin={isAdmin}
            currentUserId={socketId}
            hasJoined={hasJoinedFE}
            groupName="Frontend"
            setValue={(value)=>{
              socket.emit(`setValueFE`, {
                sessionId, 
                userId: socketId, 
                value,
              });
            }}
            shouldShowResults={shouldShowFEResults}
            showAndResetResults={() => {
              if(!shouldShowFEResults) {
                socket.emit(`showResultsFE`, { sessionId });
              } else {
                socket.emit(`resetResultsFE`, { sessionId });
              }
            }}
            users={users?.FE || []}
          />

          <VoteSection
            handleJoin={handleBackendJoin}
            isAdmin={isAdmin}
            currentUserId={socketId}
            hasJoined={hasJoinedBE}
            groupName="Backend"
            setValue={(value)=>{
              socket.emit(`setValueBE`, {
                sessionId, 
                userId: socketId, 
                value,
              });
            }}
            shouldShowResults={shouldShowBEResults}
            showAndResetResults={() => {
              if(!shouldShowBEResults) {
                socket.emit(`showResultsBE`, { sessionId });
              } else {
                socket.emit(`resetResultsBE`, { sessionId });
              }
            }}
            users={users?.BE || []}
          />
        </div>}
      </div>}
    </div>
  );
}

export default Admin;
