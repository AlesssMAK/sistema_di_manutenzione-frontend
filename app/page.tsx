import Link from 'next/link';
import css from './page.module.css';

export default function Home() {
  return (
    <main className={css.main}>
      <div className="container">
        <h1 className={css.title}>Sistema di Manutenzione e Segnalazioni</h1>
        <p className={css.text}>Seleziona il tuo ruolo per accedere</p>
        <div className={css.list}>
          <Link href="/segnalazione" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_segnalazione}`}
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
          <Link href="/responsabile" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_responsabile}`}
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
          <Link href="/manutentori" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_manutentori}`}
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
          <Link href="/sicurezza" className={css.card}>
            <div className={css.list_item}>
              <div
                className={`${css.icon_container} ${css.icon_color_sicurezza}`}
              >
                <svg width="40" height="40" className={css.icon}>
                  <use href="/sprite.svg#shield-check">df</use>
                </svg>
              </div>
              <h3 className={css.list_title}>Manutentore</h3>
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
