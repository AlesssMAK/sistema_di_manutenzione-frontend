import css from './FaultCardsList.module.css';

const FaultCardsList = () => {
  return (
    <div className={css.container}>
      <h3 className={css.datanowForList}>Data</h3>
      <ul className={css.faultList}></ul>
    </div>
  );
};
export default FaultCardsList;
