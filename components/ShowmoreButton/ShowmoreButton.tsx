import React from 'react';
import Button from '@/components/UI/Button/Button';
import css from './ShowmoreButton.module.css';
interface ShowMoreButtonProps {
  isLoading: boolean;
  onShowMore: () => void;
}

const ShowMoreButton: React.FC<ShowMoreButtonProps> = ({
  isLoading,
  onShowMore,
}) => {
  return (
    <div className={css.container}>
      <Button
        type="button"
        className="button--blue"
        width={200}
        height={40}
        onClick={onShowMore}
        disabled={isLoading}
      >
        {isLoading ? 'Caricamento...' : 'Visualizza dettagli'}
      </Button>
    </div>
  );
};

export default ShowMoreButton;
