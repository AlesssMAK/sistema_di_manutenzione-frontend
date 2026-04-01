import React from 'react';
import css from './DateNow.module.css';

const DateNow = () => {
  const formattedDate = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format();

  return <p className={css.dateDisplay}>{formattedDate}</p>;
};

export default DateNow;
