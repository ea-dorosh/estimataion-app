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


  const isAdmin = useMemo(() => {
    const sessionValue = sessionStorage.getItem(`${sessionId}`);

    if (sessionValue && sessionValue === `admin`) {
      return true;
    }

    return false;
  }, [sessionId]);

  const currentUserIdFE = useMemo(() => {
    return users?.FE.find((user) => user.name === name)?.id || null;
  }, [users, name]);

  const currentUserIdBE = useMemo(() => {
    return users?.BE.find((user) => user.name === name)?.id || null;
  }, [users, name]);


  useEffect(() => {
    socket.emit(`getUsers`, { sessionId });

    socket.on(`updateUsers`, (users) => {
      setUsers(users);
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
    socket.emit(`joinSessionFE`, { sessionId, name });
    setHasJoinedFE(true);
  };

  const handleBackendJoin = () => {
    socket.emit(`joinSessionBE`, { sessionId, name });
    setHasJoinedBE(true);
  };

  const onSaveNameClick = () => {
    sessionStorage.setItem(`${sessionId}`, name);
    setHasName(true);
  }

  return (
    <div>
      {!isAdmin && !hasName && <div style={{display: `flex`, gap:`2rem`}}>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
        />

        <Button onClick={onSaveNameClick}>
          Save Name
        </Button>
      </div>}

      <div className={style.pageWrapper}>
        <VoteSection
          handleJoin={handleFrontendJoin}
          isAdmin={isAdmin}
          currentUserId={currentUserIdFE}
          hasJoined={hasJoinedFE}
          groupName="Frontend"
          setValue={(value)=>{
            socket.emit(`setValueFE`, {
              sessionId, 
              userId: currentUserIdFE, 
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
          currentUserId={currentUserIdBE}
          hasJoined={hasJoinedBE}
          groupName="Backend"
          setValue={(value)=>{
            socket.emit(`setValueBE`, {
              sessionId, 
              userId: currentUserIdBE, 
              value,
            });
          }}
          shouldShowResults={shouldShowBEResults}
          userId={currentUserIdBE}
          showAndResetResults={() => {
            if(!shouldShowBEResults) {
              socket.emit(`showResultsBE`, { sessionId });
            } else {
              socket.emit(`resetResultsBE`, { sessionId });
            }
          }}
          users={users?.BE || []}
        />
      </div>
    </div>
  );
}

export default Admin;
