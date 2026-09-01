'use client';

import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import css from './ModalMenu.module.css';
import Link from 'next/link';
import { useTranslations } from 'use-intl';
import { useAuthStore } from '@/lib/store/authStore';
import Button from '@/components/UI/Button/Button';
import LanguageButton from '@/components/LanguageSwitcher/LanguageSwitcher';
import NotificationBell from '../NotificationBell/NotificationBell';
import CreateFaultButton from '../CreateFaultButton/CreateFaultButton';
import PushToggle from '../PushToggle/PushToggle';
import { roleRoutes } from '@/constants/roleRoutes';
import { IS_DEMO } from '@/lib/config/demo';
import DemoRoleSwitcher from '../DemoRoleSwitcher/DemoRoleSwitcher';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import { canAccessMessages } from '@/lib/utils/canAccessMessages';

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
  const { canAccess: canAccessWarehouse } = useWarehouseAccess();
  const t = useTranslations('header');
  const tBacheca = useTranslations('BachecaPage');
  const handleBackdropClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (ev.target === ev.currentTarget) {
      onClose();
    }
  };

  // Role dashboard shortcut — only for logged-in users.
  const route = user ? roleRoutes[user.role]?.[0] : undefined;

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
      className={`${css.backdrop} ${IS_DEMO ? css.demo_backdrop : ''}`}
      role="dialog"
      aria-modal="true"
    >
      <div className={css.modal}>
        <div className="container">
          <div className={css.header_modal_menu_container}>
            <nav className={css.nav}>
              <LanguageButton />
              {/* Board sections are tabs on the home page; the nav keeps
                  the board link + the role dashboard shortcut for
                  authenticated users. */}
              <ul className={css.nav_list}>
                <li className={css.nav_list_item}>
                  <Link href="/" onClick={onClose}>
                    {tBacheca('title')}
                  </Link>
                </li>
                {isAuthenticated && route && (
                  <li className={css.nav_list_item}>
                    <Link href={`${route}`} onClick={onClose}>
                      {t('myArea')}
                    </Link>
                  </li>
                )}
                {canAccessWarehouse && (
                  <li className={css.nav_list_item}>
                    <Link href="/warehouse" onClick={onClose}>
                      {t('warehouse')}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
            <div className={css.user_container}>
              {isAuthenticated && (
                <>
                  <div className={css.btn_container}>
                    <CreateFaultButton onAfterClick={onClose} />
                  </div>
                  <div className={css.user_item_container}>
                    <div className={css.user}>
                      <svg className={css.user_icon} width="16" height="16">
                        <use href="/sprite.svg#user"></use>
                      </svg>
                      <p className={css.user_name}>{user?.fullName}</p>
                      {canAccessMessages(user) && (
                        <NotificationBell
                          enabled={isAuthenticated}
                          onClose={onClose}
                        />
                      )}
                      <PushToggle />
                    </div>
                    {/* In demo there is no real session to end — the role
                        switcher below takes the logout button's place. */}
                    {!IS_DEMO && (
                      <Button
                        className={`${css.exit_btn} button button--white`}
                        width={121}
                        onClick={handleLogout}
                      >
                        <svg className={css.exit_icon} width="16" height="16">
                          <use href="/sprite.svg#exit"></use>
                        </svg>
                        <span className={css.btn_text}>{t('exit')}</span>
                      </Button>
                    )}
                  </div>
                </>
              )}
              {IS_DEMO ? (
                <DemoRoleSwitcher onAfterSelect={onClose} />
              ) : (
                !isAuthenticated && (
                  <Button
                    type="button"
                    className="button button--white"
                    onClick={handleLoginClick}
                    width={121}
                  >
                    {t('login')}
                  </Button>
                )
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
