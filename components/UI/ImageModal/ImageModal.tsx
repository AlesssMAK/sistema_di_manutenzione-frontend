'use client';

import React from 'react';
import css from './ImageModal.module.css';

interface ImageModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className={css.overlay} onClick={onClose}>
      <div className={css.modalContent} onClick={e => e.stopPropagation()}>
        <button className={css.closeBtn} onClick={onClose} aria-label="Close">
          &times;
        </button>
        <img
          src={imageUrl}
          alt="Visualizzazione ingrandita"
          className={css.image}
        />
      </div>
    </div>
  );
};

export default ImageModal;
