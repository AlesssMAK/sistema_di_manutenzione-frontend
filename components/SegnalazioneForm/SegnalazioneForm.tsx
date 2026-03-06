import css from './SegnalazioneForm.module.css';

const SegnalazioneForm = () => {
  return (
    <div className={css.segnalazione_form_container}>
      <ul className={css.info_list}>
        <li className={css.info_list_item}>
          <h3 className={css.info_title}>ID Segnalazione</h3>
          <p className={css.info_text}>Info</p>
        </li>
        <li className={css.info_list_item}>
          <h3 className={css.info_title}>Operatore</h3>
          <p className={css.info_text}>Info</p>
        </li>
        <li className={css.info_list_item}>
          <h3 className={css.info_title}>Data</h3>
          <p className={css.info_text}>Info</p>
        </li>
        <li className={css.info_list_item}>
          <h3 className={css.info_title}>Ora</h3>
          <p className={css.info_text}>Info</p>
        </li>
      </ul>
      <form action="">
        <div className={css.form_item}>
          <h3 className={css.form_title}>Impianto / Macchina *</h3>
        </div>
        <div className={css.form_item}>
          <h3 className={css.form_title}>Parte di impianto *</h3>
        </div>

        {/* Tipologia */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>Tipologia *</h3>
          <div className={css.form_item_tipologia}>
            <label className={css.tipologia_label}>
              <input
                type="radio"
                name="status"
                className={css.tipologia_input}
                value="produzione"
              />
              <p className={css.tipologia_text}>Produzione</p>
            </label>
            <label className={css.tipologia_label}>
              <input
                type="radio"
                name="status"
                className={css.tipologia_input}
                value="sicurezza"
              />
              <p className={css.tipologia_text}>Sicurezza</p>
            </label>
          </div>
        </div>
        {/* Note e Descrizione */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>Note e Descrizione *</h3>
          <label>
            <textarea
              name="name"
              required
              className={css.textarea}
              placeholder="Descrivi il problema riscontrato..."
            />
          </label>
        </div>
        {/* Immagini */}
        <div className={css.form_item}>
          <h3 className={css.form_title}>Immagini</h3>
          <label className={css.upload_label}>
            <input type="file" className={css.upload_input} accept="image/*" />
            <div className={css.upload_text_container}>
              <svg width="32" height="32" className={css.upload_icon}>
                <use href="/sprite.svg#load"></use>
              </svg>
              <p className={css.upload_text}>Clicca per caricare immagini</p>
            </div>
          </label>
        </div>
      </form>
    </div>
  );
};

export default SegnalazioneForm;
