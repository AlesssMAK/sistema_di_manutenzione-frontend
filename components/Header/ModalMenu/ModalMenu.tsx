'use client';

import { createPortal } from 'react-dom';
import { useEffect, useTransition } from 'react';
import css from './ModalMenu.module.css';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { useAuthStore } from '@/lib/store/authStore';
import Button from '@/components/UI/Button/Button';

export interface ModalMenuProps {
  onClose: () => void;
  handleLoginClick: () => void;
  handleLogout: () => void;
}

const ModalMenu = ({
  onClose,
  handleLoginClick,
  handleLogout,
}: ModalMenuProps) => {
  const { user, isAuthenticated } = useAuthStore();
  const t = useTranslations('header');
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

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className={css.backdrop}
      role="dialog"
      aria-modal="true"
    >
      <div className={css.modal}>
        <div className="container">
          <div className={css.header_modal_menu_container}>
            <nav>
              <ul className={css.nav_list}>
                <li className={css.nav_list_item}>
                  <Link href="/" onClick={onClose}>
                    {t('navItem1')}{' '}
                  </Link>
                </li>
                <li className={css.nav_list_item}>
                  <Link href="/reports-and-communications" onClick={onClose}>
                    {t('navItem2')}
                  </Link>
                </li>
              </ul>
            </nav>
            <div className={css.user_container}>
              {isAuthenticated ? (
                <>
                  <div className={css.user}>
                    <svg className={css.user_icon} width="16" height="16">
                      <use href="/sprite.svg#user"></use>
                    </svg>
                    <p className={css.user_name}>{user?.fullName}</p>
                  </div>
                  <Button
                    className={`${css.exit_btn} button button--white`}
                    width={121}
                    onClick={handleLogout}
                  >
                    <svg className={css.exit_icon} width="16" height="16">
                      <use href="/sprite.svg#exit"></use>
                    </svg>
                    <span className={css.btn_text}>Esci</span>
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="button button--white"
                  onClick={handleLoginClick}
                  width={121}
                >
                  login
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalMenu;
