'use client';

import { createPortal } from 'react-dom';
import css from './Modal.module.css';
import { useEffect, useState } from 'react';

export interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ onClose, children }: ModalProps) => {
  const [mounted, setMounted] = useState(false);
  const handleBackdropClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (ev.target === ev.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={css.backdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className={css.modal}>{children}</div>
    </div>,
    document.body
  );
};

export default Modal;
