import css from './Header.module.css';

const Header = () => {
  return (
    <header className={css.header}>
      <div className="container">
        <div className={css.header_container}>
          <div className={css.logo_container}>
            <div className={css.logo}>SM</div>
            <div className={css.logo_title_container}>
              <h2 className={css.logo_title}>Sistema Manutenzione</h2>
              <p className={css.logo_page_name}>page</p>
            </div>
          </div>
          <div className={css.user_container}>
            <div className={css.user}>
              <svg className={css.user_icon} width="16" height="16">
                <use href="/sprite.svg#user"></use>
              </svg>
              <p className={css.user_name}>User</p>
            </div>
            <button className={css.exit_btn}>
              <svg className={css.exit_icon} width="16" height="16">
                <use href="/sprite.svg#exit"></use>
              </svg>
              <span className={css.btn_text}>Esci</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
