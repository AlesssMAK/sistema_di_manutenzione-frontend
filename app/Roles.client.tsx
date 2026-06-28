'use client';

import Link from 'next/link';
import css from './page.module.css';
import { useAuthStore } from '@/lib/store/authStore';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';

export default function RolesClient() {
  const t = useTranslations('RolesPage');
  const { user } = useAuthStore();
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);

  return (
    <main className={css.main}>
      <div className="container">
        <h1 className={css.title}>{t('title')}</h1>
        <p className={css.text}>{t('subtitle')}</p>
        <div className={css.list}>
          <Link href="/operator" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_operator}`}
              >
                <svg width="40" height="40" className={css.icon}>
                  <use href="/sprite.svg#clipboard">df</use>
                </svg>
              </div>
              <h3 className={css.list_title}>{t('roles.operator.title')}</h3>
              <p className={css.list_text}>{t('roles.operator.description')}</p>
            </div>
          </Link>
          <Link href="/manager" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_manager}`}
              >
                <svg width="40" height="40" className={css.icon}>
                  <use href="/sprite.svg#squares">df</use>
                </svg>
              </div>
              <h3 className={css.list_title}>{t('roles.manager.title')}</h3>
              <p className={css.list_text}>{t('roles.manager.description')}</p>
            </div>
          </Link>
          <Link href="/maintenance-worker" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_maintenance}`}
              >
                <svg width="40" height="40" className={css.icon}>
                  <use href="/sprite.svg#crewdriver">df</use>
                </svg>
              </div>
              <h3 className={css.list_title}>
                {t('roles.maintenanceWorker.title')}
              </h3>
              <p className={css.list_text}>
                {t('roles.maintenanceWorker.description')}
              </p>
            </div>
          </Link>
          <Link href="/safety" className={css.card}>
            <div className={css.list_item}>
              <div className={`${css.icon_container} ${css.icon_color_safety}`}>
                <svg width="40" height="40" className={css.icon}>
                  <use href="/sprite.svg#shield-check">df</use>
                </svg>
              </div>
              <h3 className={css.list_title}>{t('roles.safety.title')}</h3>
              <p className={css.list_text}>{t('roles.safety.description')}</p>
            </div>
          </Link>
          {user?.role === 'admin' && (
            <Link href="/admin" className={css.card}>
              <div className={css.list_item}>
                <div
                  className={`${css.icon_container} ${css.icon_color_admin}`}
                >
                  <svg width="40" height="40" className={css.icon}>
                    <use href="/sprite.svg#tooth">df</use>
                  </svg>
                </div>
                <h3 className={css.list_title}>{t('roles.admin.title')}</h3>
                <p className={css.list_text}>{t('roles.admin.description')}</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
