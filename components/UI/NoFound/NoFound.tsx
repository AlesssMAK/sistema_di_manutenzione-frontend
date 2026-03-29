import css from './NoFound.module.css';

interface NoFoundProps {
  title: string;
  message: string;
}

const NoFound = ({ title, message }: NoFoundProps) => {
  return (
    <div className={css.noFound}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="90"
        height="90"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--primary-color)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
      <h3 className={css.noFoundTitle}>{title}</h3>
      <p className={css.noFoundMessage}>{message}</p>
    </div>
  );
};

export default NoFound;
