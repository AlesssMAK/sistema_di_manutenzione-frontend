'use client';

import Link from 'next/link';
import css from './AdminSidebar.module.css';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

const AdminSidebar = () => {
  const t = useTranslations('AdminSidebar');

  const pathname = usePathname();
  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  return (
    <div className={css.sidebar_container}>
      <ul className={css.list}>
        <li className={css.list_item}>
          <Link className={css.list_item_link} href="/admin/users">
            <svg
              width="20"
              height="20"
              className={`${css.icon} ${isActive('/admin/users') ? css.active : ''}`}
            >
              <use href="/sprite.svg#users"></use>
            </svg>
            <span
              className={`${css.list_item_text} ${isActive('/admin/users') ? css.active : ''}`}
            >
              {t('users')}
            </span>
          </Link>
        </li>
        <li className={css.list_item}>
          <Link className={css.list_item_link} href="/admin/plants">
            <svg
              width="20"
              height="20"
              className={`${css.icon} ${isActive('/admin/plants') ? css.active : ''}`}
            >
              <use href="/sprite.svg#wrench"></use>
            </svg>
            <span
              className={`${css.list_item_text} ${isActive('/admin/plants') ? css.active : ''}`}
            >
              {t('plants')}
            </span>
          </Link>
        </li>
        <li className={css.list_item}>
          <Link className={css.list_item_link} href="/admin/notifications">
            <svg
              width="20"
              height="20"
              className={`${css.icon} ${isActive('/admin/notifications') ? css.active : ''}`}
            >
              <use href="/sprite.svg#mail"></use>
            </svg>
            <span
              className={`${css.list_item_text} ${isActive('/admin/notifications') ? css.active : ''}`}
            >
              {t('notifications')}
            </span>
          </Link>
        </li>
        <li className={css.list_item}>
          <Link className={css.list_item_link} href="/admin/logs-audit">
            <svg
              width="20"
              height="20"
              className={`${css.icon} ${isActive('/admin/logs-audit') ? css.active : ''}`}
            >
              <use href="/sprite.svg#document"></use>
            </svg>
            <span
              className={`${css.list_item_text} ${isActive('/admin/logs-audit') ? css.active : ''}`}
            >
              {t('logsAudit')}
            </span>
          </Link>
        </li>
        <li className={css.list_item}>
          <Link className={css.list_item_link} href="/admin/system-settings">
            <svg
              width="20"
              height="20"
              className={`${css.icon} ${isActive('/admin/system-settings') ? css.active : ''}`}
            >
              <use href="/sprite.svg#tooth"></use>
            </svg>
            <span
              className={`${css.list_item_text} ${isActive('/admin/system-settings') ? css.active : ''}`}
            >
              {t('systemSettings')}
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default AdminSidebar;
