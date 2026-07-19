'use client';

import { createPortal } from 'react-dom';
import css from './Modal.module.css';
import { useEffect, useSyncExternalStore } from 'react';

export interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

// Client-only gate for the portal: the server snapshot is false, the client
// snapshot is true, so the first client render already knows `document` exists
// without going through a setState-in-effect round trip.
const subscribeToNothing = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const Modal = ({ onClose, children }: ModalProps) => {
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    getClientSnapshot,
    getServerSnapshot
  );
  const handleBackdropClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (ev.target === ev.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.documentElement.style.overflow = '';
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
      <div className={css.modal}>
        <button type="button" className={css.close_btn} onClick={onClose}>
          <svg width="30" height="30" className={css.btn_icon}>
            <use href="/sprite.svg#close"></use>
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
