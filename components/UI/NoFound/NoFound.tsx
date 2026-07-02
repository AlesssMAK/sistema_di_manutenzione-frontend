import css from './NoFound.module.css';

interface NoFoundProps {
  title: string;
  message: string;
  isVisible?: boolean;
}

const NoFound = ({ title, message, isVisible = false }: NoFoundProps) => {
  return (
    <div className={css.noFound}>
      {!isVisible && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="110"
          height="110"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      )}
      <h3 className={css.noFoundTitle}>{title}</h3>
      <p className={css.noFoundMessage}>{message}</p>
    </div>
  );
};

export default NoFound;
