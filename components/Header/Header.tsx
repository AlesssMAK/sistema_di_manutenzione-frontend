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
import LanguageButton from '../LanguageSwitcher/LanguageSwitcher';
import NotificationBell from './NotificationBell/NotificationBell';
import PushToggle from './PushToggle/PushToggle';
import CreateFaultButton from './CreateFaultButton/CreateFaultButton';
import { roleRoutes } from '@/constants/roleRoutes';
import { IS_DEMO } from '@/lib/config/demo';
import DemoRoleSwitcher from './DemoRoleSwitcher/DemoRoleSwitcher';
import { useWarehouseAccess } from '@/lib/hooks/useWarehouseAccess';
import Image from 'next/image';

const Header = () => {
  const [isOpenModal, setIsOpenModal] = useState(false);
  const t = useTranslations('header');
  const tBacheca = useTranslations('BachecaPage');

  const { user, isAuthenticated, clearIsAuthenticated } = useAuthStore();
  const { canAccess: canAccessWarehouse } = useWarehouseAccess();
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
    window.location.href = '/';
  };

  const route = user ? roleRoutes[user.role]?.[0] : undefined;

  return (
    <header className={css.header}>
      <div className="container">
        <div className={css.header_container}>
          <Link href={isAuthenticated ? `${route}` : '/'}>
            <div className={css.logo_container}>
              <div className={css.logo}>
                <Image
                  src="/images/logo_tansparent.png"
                  width={150}
                  height={44}
                  alt="SYLLERT logo"
                />
              </div>
              <div className={css.logo_title_container}>
                {/* <h2 className={css.logo_title}> */}
                {/* <Image
                  src="/images/syllert-logo-text.png"
                  width={120}
                  height={14}
                  alt="SYLLERT logo"
                /> */}
                {/* </h2> */}
                {/* <p className={css.logo_page_name}>{pageTitle}</p> */}
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
            {/* Board sections (Annunci, Consegne, Comunicazioni,
                Segnalazioni) are now tabs on the home page, so the nav
                keeps just the board link + the role dashboard shortcut
                for authenticated users. */}
            <ul className={css.nav_list}>
              <li className={css.nav_list_item}>
                <Link href="/" onClick={close}>
                  {tBacheca('title')}
                </Link>
              </li>
              {isAuthenticated && route && (
                <li className={css.nav_list_item}>
                  <Link href={`${route}`} onClick={close}>
                    {t('myArea')}
                  </Link>
                </li>
              )}
              {canAccessWarehouse && (
                <li className={css.nav_list_item}>
                  <Link href="/warehouse" onClick={close}>
                    {t('warehouse')}
                  </Link>
                </li>
              )}
            </ul>
          </nav>
          <div className={css.user_container}>
            <LanguageButton />
            {isAuthenticated && (
              <>
                <CreateFaultButton />

                <div className={css.user}>
                  <svg className={css.user_icon} width="16" height="16">
                    <use href="/sprite.svg#user"></use>
                  </svg>
                  <p className={css.user_name}>{user?.fullName}</p>
                  <NotificationBell enabled={isAuthenticated} />
                  <PushToggle />
                </div>
              </>
            )}
            {IS_DEMO ? (
              <DemoRoleSwitcher />
            ) : isAuthenticated ? (
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
            ) : (
              <Button
                type="button"
                className="button button--white"
                onClick={handleLoginClick}
                width={121}
              >
                {t('login')}
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
