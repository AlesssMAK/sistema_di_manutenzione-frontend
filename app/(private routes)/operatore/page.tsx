// import SegnalazioneForm from '@/components/SegnalazioneForm/SegnalazioneForm';
import LoginForm from '@/components/forms/LoginForm/LoginForm';
import css from './OperatorePage.module.css';

const SperatorePage = async () => {
  return (
    <main>
      <section className="section">
        <div className="container">
          <h1 className={css.title}>Nuova Segnalazione</h1>
          <p className={css.text}>
            Compila il modulo per segnalare un guasto o anomalia
          </p>
          {/* <SegnalazioneForm /> */}
        </div>
      </section>
    </main>
  );
};

export default SperatorePage;
