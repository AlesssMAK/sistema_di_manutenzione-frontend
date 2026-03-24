import css from './FilterPriorityBar.module.css';

const FilterPriorityBar = () => {
  return (
    <div>
      <h3 className={css.headersFilter}>Legenda Priorità</h3>
      <ul className={css.listPriority}>
        <li className={css.buttonBassa}>
          <button className={css.bassa}>
            <span className={css.bassaSpan}></span>Priorità Bassa
          </button>
        </li>
        <li className={css.buttonMedia}>
          <button className={css.media}>
            <span className={css.mediaSpan}></span>Priorità Media
          </button>
        </li>
        <li className={css.buttonAll}></li>
      </ul>
    </div>
  );
};
export default FilterPriorityBar;
