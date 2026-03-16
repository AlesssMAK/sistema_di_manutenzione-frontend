'use client';

import Link from 'next/link';
import css from './page.module.css';
import { useAuthStore } from '@/lib/store/authStore';
import { useTranslations } from 'next-intl';
import { usePageStore } from '@/lib/store/pageStore';
import { useEffect } from 'react';

export default function RolesClient() {
  const t = useTranslations('RolesPage');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);

  return (
    <main className={css.main}>
      <div className="container">
        <h1 className={css.title}>Sistema di Manutenzione e Segnalazioni</h1>
        <p className={css.text}>Seleziona il tuo ruolo per accedere</p>
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
              <h3 className={css.list_title}>Operatore</h3>
              <p className={css.list_text}>
                Crea nuove segnalazioni di guasti e anomalie
              </p>
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
              <h3 className={css.list_title}>Responsabile</h3>
              <p className={css.list_text}>
                Gestisci segnalazioni e pianifica interventi
              </p>
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
              <h3 className={css.list_title}>Manutentore</h3>
              <p className={css.list_text}>
                Visualizza pianificazione ed esegui interventi
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
              <h3 className={css.list_title}>Sicurezza (HSE)</h3>
              <p className={css.list_text}>
                Monitora segnalazioni di sicurezza
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
