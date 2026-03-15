'use client';

import { useRouter } from 'next/navigation';
import Button from '../UI/Button/Button';
import css from './Header.module.css';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { useState } from 'react';
import ModalMenu from './ModalMenu/ModalMenu';
import { useTranslations } from 'use-intl';
import { logout } from '@/lib/api/auth';

const Header = () => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const t = useTranslations('header');

  const { user, isAuthenticated, clearIsAuthenticated } = useAuthStore();
  const router = useRouter();

  const open = () => setIsOpenModal(true);
  const close = () => setIsOpenModal(false);

  const handleLoginClick = () => {
    router.push('/login');
    close();
  };

  const handleLogout = async () => {
    await logout();
    clearIsAuthenticated();
  };

  return (
    <header className={css.header}>
      <div className="container">
        <div className={css.header_container}>
          <Link href="/">
            <div className={css.logo_container}>
              <div className={css.logo}>SM</div>
              <div className={css.logo_title_container}>
                <h2 className={css.logo_title}>Sistema Manutenzione</h2>
                <p className={css.logo_page_name}>page</p>
              </div>
            </div>
          </Link>
          {isOpenModal ? (
            <Button type="button" onClick={close} className={css.close_btn}>
              <svg className={css.close_icon} width="32" height="32">
                <use href="/sprite.svg#close"></use>
              </svg>
            </Button>
          ) : (
            <Button type="button" onClick={open} className={css.menu_btn}>
              <svg className={css.menu_icon} width="32" height="32">
                <use href="/sprite.svg#menu"></use>
              </svg>
            </Button>
          )}
          <nav className={css.nav}>
            <ul className={css.nav_list}>
              <li className={css.nav_list_item}>
                <Link href="/" onClick={close}>
                  {t('navItem1')}{' '}
                </Link>
              </li>
              <li className={css.nav_list_item}>
                <Link href="/reports-and-communications" onClick={close}>
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
      {isOpenModal && (
        <ModalMenu
          onClose={close}
          handleLoginClick={handleLoginClick}
          handleLogout={handleLogout}
        />
      )}
    </header>
  );
};

export default Header;
