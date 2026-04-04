import React from 'react';
import Button from '@/components/UI/Button/Button';
import css from './LoadMoreButton.module.css';

interface LoadMoreButtonProps {
  page: number;
  totalPage: number;
  isLoading: boolean;
  onLoadMore: () => void;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
  page,
  totalPage,
  isLoading,
  onLoadMore,
}) => {
  const hasMore = totalPage > 1 && page < totalPage;

  if (!hasMore) return null;

  return (
    <div className={css.container}>
      <Button
        type="button"
        className="button--blue"
        width={200}
        height={40}
        onClick={onLoadMore}
        disabled={isLoading}
      >
        {isLoading ? 'Caricamento...' : 'Load more'}
      </Button>
    </div>
  );
};

export default LoadMoreButton;
