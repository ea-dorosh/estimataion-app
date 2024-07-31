import React from 'react';
import style from './button.module.scss';
import classNames from 'classnames';

function Button({ onClick, children, disabled, primary, secondary }) {

  const buttonClass = classNames({
    [style.button]: true,
    [style.primary]: primary,
    [style.secondary]: secondary,
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonClass}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;