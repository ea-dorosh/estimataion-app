import React, { useMemo } from 'react';
import style from './voteSection.module.scss';
import Button from '../../components/Button/Button';
import classNames from 'classnames';

const storyPointsValues = [`0.5`, `1`, `2`, `3`, `5`, `8`, `13`, `21`, `34`, `∞`];

function VoteSection({ 
  handleJoin,
  isAdmin,
  hasJoined,
  groupName,
  setValue,
  shouldShowResults,
  showAndResetResults,
  users,
  currentUserId,
}) {


  const isShowResultsButtonDisabled = useMemo(() => {
    return users?.some((user) => Boolean(!user.value));
  }, [users]);

  const handleSetValue = (event) => {
    setValue(event.target.value);
  };

  return (
    <div className={style.wrapper}>  
      <div className={style.subtitleWrapper}>
        <h3 className={style.subtitle}>{ groupName }</h3>

        {isAdmin && 
          <Button
            primary
            onClick={showAndResetResults}
            disabled={isShowResultsButtonDisabled}
          >
            {!shouldShowResults ? `Reveal` : `Reset`}
          </Button>
        }

        {!isAdmin && !hasJoined &&
          <Button 
            onClick={handleJoin}
            secondary
          >
            Join
          </Button>
        }
      </div>

      {!isAdmin && hasJoined && <div  className={style.storyPointsWrapper}>
        {storyPointsValues.map((value) => (
          <button
            key={value}
            onClick={handleSetValue}
            value={value}
            disabled={shouldShowResults}
            className={style.storyPointsButton}
          >
            {value}
          </button>
        ))}
   
      </div>}

      <ul className={style.userList}>
        {users?.map((user) => {

          const userValueClass = classNames({
            [style.userValue]: true,
            [style.ready]: Boolean(user.value),
          });


          return <li 
            key={user.id}
            className={style.userWrapper}
          >
            <span className={style.userName}>
              {user.name}   {user.id}
            </span>

            <span className={userValueClass}>
              {!shouldShowResults && 
                <div>
                  {user.id === currentUserId && (user.value ? user.value : `?`)}
                  {user.id !== currentUserId && (user.value ? `✓` : `?`)}
                </div>
              }

              {shouldShowResults && 
                <div>
                  {user.value}
                </div>
              }
            </span>
          </li>
        })}
      </ul>
    </div>
  );
}

export default VoteSection;
