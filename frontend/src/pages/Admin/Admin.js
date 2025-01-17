import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import style from './admin.module.scss';
import Button from '../../components/Button/Button';
import VoteSection from '../../components/VoteSection/VoteSection';

const generateUUID = () => {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0,
      v = c === `x` ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function Admin({ socket, letItSnow }) {
  const [users, setUsers] = useState(null);
  const { id: sessionId } = useParams();
  const [shouldShowFEResults, setShouldShowFEResults] = useState(false);
  const [shouldShowBEResults, setShouldShowBEResults] = useState(false);
  const [isFeButtonDisabled, setIsFeButtonDisabled] = useState(false);
  const [isBeButtonDisabled, setIsBeButtonDisabled] = useState(false);

  const [hasJoinedFE, setHasJoinedFE] = useState(false);
  const [hasJoinedBE, setHasJoinedBE] = useState(false);
  const [name, setName] = useState(``);
  const [hasName, setHasName] = useState(false);

  const [isSessionExpired, setIsSessionExpired] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const userId = useMemo(() => {
    let storedUserId = sessionStorage.getItem(`userId`);
    if (!storedUserId) {
      storedUserId = generateUUID();
      sessionStorage.setItem(`userId`, storedUserId);
    }
    return storedUserId;
  }, []);

  const isAdmin = useMemo(() => {
    const sessionValue = sessionStorage.getItem(`${sessionId}`);

    if (sessionValue && sessionValue === `admin`) {
      return true;
    }

    return false;
  }, [sessionId]);

  const keyBufferRef = useRef(``);

  useEffect(() => {
    const savedUserName = localStorage.getItem(`userName`);
    const savedHasJoinedFE = sessionStorage.getItem(`hasJoinedFE`);
    const savedHasJoinedBE = sessionStorage.getItem(`hasJoinedBE`);

    if (savedUserName) {
      setName(savedUserName);
      setHasName(true);
    }

    if (savedHasJoinedFE === `true`) {
      setHasJoinedFE(true);
    }

    if (savedHasJoinedBE === `true`) {
      setHasJoinedBE(true);
    }
    
    socket.emit(`getUsers`, { sessionId });

    const handleUpdateUsers = (users) => {
      setUsers(users);
      setHasJoinedFE(users.FE.some(user => user.id === userId));
      setHasJoinedBE(users.BE.some(user => user.id === userId));
      setIsLoading(false);
    };

    const handleSessionExpired = () => {
      setIsSessionExpired(true);
      setIsLoading(false);
    };

    const handleShowResultsFE = () => {
      setShouldShowFEResults(true);

      /* disable Admin button to prevent double click */
      setIsFeButtonDisabled(true);

      /* enable Admin button in 1.5sec */
      setTimeout(() => {
        setIsFeButtonDisabled(false);
      }, 1500);
    };

    const handleResetResultsFE = (users) => {
      setShouldShowFEResults(false);
      setUsers(users);
    };

    const handleShowResultsBE = () => {
      setShouldShowBEResults(true);

      /* disable Admin button to prevent double click */
      setIsBeButtonDisabled(true);

      /* enable Admin button in 1.5sec */
      setTimeout(() => {
        setIsBeButtonDisabled(false);
      }, 1500);
    };

    const handleResetResultsBE = (users) => {
      setShouldShowBEResults(false);
      setUsers(users);
    };

    const handleSnowEffect = () => {
      if (letItSnow && typeof letItSnow === `function`) {
        letItSnow();
      }
    };

    socket.on(`updateUsers`, handleUpdateUsers);
    socket.on(`sessionExpiredServer`, handleSessionExpired);
    socket.on(`showResultsFEServer`, handleShowResultsFE);
    socket.on(`resetResultsFEServer`, handleResetResultsFE);
    socket.on(`showResultsBEServer`, handleShowResultsBE);
    socket.on(`resetResultsBEServer`, handleResetResultsBE);
    socket.on(`snowEffect`, handleSnowEffect);

    socket.emit(`register`, { sessionId, userId, role: isAdmin ? `admin` : `user`, name: isAdmin ? `` : name });

    const handleReconnect = (attemptNumber) => {
      socket.emit(`register`, { sessionId, userId, role: isAdmin ? `admin` : `user`, name: isAdmin ? `` : name });
    };

    socket.on(`reconnect`, handleReconnect);

    if (!isAdmin && (savedHasJoinedFE === `true` || savedHasJoinedBE === `true`)) {
      if (savedHasJoinedFE === `true`) {
        socket.emit(`joinSessionFE`, { sessionId, name, userId });
      }
      if (savedHasJoinedBE === `true`) {
        socket.emit(`joinSessionBE`, { sessionId, name, userId });
      }
    }

    const handleTabClose = () => {
      if (!isAdmin) {
        socket.emit(`leaveSession`, { sessionId, userId });
      }
    };

    window.addEventListener(`beforeunload`, handleTabClose);

    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      keyBufferRef.current += key;

      if (keyBufferRef.current.length > 4) {
        keyBufferRef.current = keyBufferRef.current.slice(-4);
      }

      if (keyBufferRef.current === `snow`) {
        socket.emit(`triggerSnow`, { sessionId });
        keyBufferRef.current = ``;
      }
    };

    window.addEventListener(`keydown`, handleKeyDown);

    return () => {
      socket.off(`updateUsers`, handleUpdateUsers);
      socket.off(`sessionExpiredServer`, handleSessionExpired);
      socket.off(`showResultsFEServer`, handleShowResultsFE);
      socket.off(`resetResultsFEServer`, handleResetResultsFE);
      socket.off(`showResultsBEServer`, handleShowResultsBE);
      socket.off(`resetResultsBEServer`, handleResetResultsBE);
      socket.off(`snowEffect`, handleSnowEffect);
      socket.off(`reconnect`, handleReconnect);
      window.removeEventListener(`beforeunload`, handleTabClose);
      window.removeEventListener(`keydown`, handleKeyDown);
    };

    // eslint-disable-next-line
  }, [sessionId, isAdmin, userId, socket, name, letItSnow]);

  const handleRemoveUser = (userIdToRemove) => {
    socket.emit(`removeUser`, { sessionId, userId: userIdToRemove });
  };

  const handleFrontendJoin = () => {
    const handleJoinSessionFE = (userIdServer) => {
      if (userIdServer === userId) {
        setHasJoinedFE(true);
        sessionStorage.setItem(`hasJoinedFE`, `true`);
      }
    };

    socket.on(`joinSessionFeServer`, handleJoinSessionFE);

    socket.emit(`joinSessionFE`, { sessionId, name, userId });

    return () => {
      socket.off(`joinSessionFeServer`, handleJoinSessionFE);
    };
  };

  const handleBackendJoin = () => {
    const handleJoinSessionBE = (userIdServer) => {
      if (userIdServer === userId) {
        setHasJoinedBE(true);
        sessionStorage.setItem(`hasJoinedBE`, `true`);
      }
    };

    socket.on(`joinSessionBeServer`, handleJoinSessionBE);

    socket.emit(`joinSessionBE`, { sessionId, name, userId });

    return () => {
      socket.off(`joinSessionBeServer`, handleJoinSessionBE);
    };
  };

  const onSaveNameClick = () => {
    localStorage.setItem(`userName`, name);
    setHasName(true);
  }

  if (isLoading) {
    return <div className={style.loading}>Loading...</div>;
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
            handleRemoveUser={isAdmin ? handleRemoveUser : null}
            isAdmin={isAdmin}
            currentUserId={userId}
            hasJoined={hasJoinedFE}
            groupName="Frontend"
            setValue={(value)=>{
              socket.emit(`setValueFE`, {
                sessionId, 
                userId: userId, 
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
            isButtonDisabled={isFeButtonDisabled}
            users={users?.FE || []}
          />

          <VoteSection
            handleJoin={handleBackendJoin}
            handleRemoveUser={isAdmin ? handleRemoveUser : null}
            isAdmin={isAdmin}
            currentUserId={userId}
            hasJoined={hasJoinedBE}
            groupName="Backend"
            setValue={(value)=>{
              socket.emit(`setValueBE`, {
                sessionId, 
                userId: userId, 
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
            isButtonDisabled={isBeButtonDisabled}
            users={users?.BE || []}
          />
        </div>}
      </div>}
    </div>
  );
}

export default Admin;
