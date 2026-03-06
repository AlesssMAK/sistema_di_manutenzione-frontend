import SegnalazioneForm from '@/components/SegnalazioneForm/SegnalazioneForm';
import css from './SegnalazionePage.module.css';

const SegnalazionePage = () => {
  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className={css.title}>Nuova Segnalazione</h1>
          <p className={css.text}>
            Compila il modulo per segnalare un guasto o anomalia
          </p>
          <SegnalazioneForm />
        </div>
      </section>
    </main>
  );
};

export default SegnalazionePage;
