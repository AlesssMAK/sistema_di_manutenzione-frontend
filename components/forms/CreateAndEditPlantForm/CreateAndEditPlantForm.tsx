import Modal from '@/components/UI/Modal/Modal';
import css from '../CreateAndUpdateUserForm/CreateAndEditUserForm.module.css';
import css_form from './CreateAndEditPlantForm.module.css';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import { useTranslations } from 'next-intl';

interface CreateAndEditPlantFormProps {
  onClose: () => void;
  // initialData?: InitialData;
  isEditMode?: boolean;
}

const CreateAndEditPlantForm = ({
  onClose,
  isEditMode = false,
}: CreateAndEditPlantFormProps) => {
  const tBtn = useTranslations('btn');
  return (
    <Modal onClose={onClose}>
      <div className={css.form_container}>
        <div className={css.title_container}>
          <h1 className="title">
            {isEditMode ? 'Nuova Macchina' : 'Modifica Macchina'}
          </h1>
          <p className="subtitle">
            Gestisci le informazioni della macchina o impianto
          </p>
        </div>
        <form className={css.form}>
          <div className={css_form.plant_container}>
            <div className={css.form_item_container}>
              <p className={css.form_label}>
                Nome Macchina
                {isEditMode ? '' : ' *'}
              </p>
              <Input
                // {...register('namePlant')}
                type="text"
                style={{
                  height: '36px',
                  borderRadius: '6px',
                  background: '#f3f3f5',
                  border: 'none',
                }}
              />
              {/* {activeForm.formState.errors.namePlant && (
                <p className={css.error}>
                  {activeForm.formState.errors.namePlant.message}
                </p>
              )} */}
            </div>
            <div className={css.form_item_container}>
              <p className={css.form_label}>
                Codice
                {isEditMode ? '' : ' *'}
              </p>
              <Input
                // {...register('code')}
                type="text"
                style={{
                  height: '36px',
                  borderRadius: '6px',
                  background: '#f3f3f5',
                  border: 'none',
                }}
              />
              {/* {activeForm.formState.errors.code && (
                <p className={css.error}>
                  {activeForm.formState.errors.code.message}
                </p>
              )} */}
            </div>
            <div className={css.form_item_container}>
              <p className={css.form_label}>
                Ubicazione
                {isEditMode ? '' : ' *'}
              </p>
              <Input
                // {...register('location')}
                type="text"
                style={{
                  height: '36px',
                  borderRadius: '6px',
                  background: '#f3f3f5',
                  border: 'none',
                }}
              />
              {/* {activeForm.formState.errors.location && (
                <p className={css.error}>
                  {activeForm.formState.errors.location.message}
                </p>
              )} */}
            </div>
          </div>
          {!isEditMode && (
            <div className={css_form.plant_part_container}>
              <div className={css.title_container}>
                <h1 className={`${css_form.title} title`}>Parti di impianto</h1>
                <p className="subtitle">
                  Aggiungi le parti che compongono questo impianto
                </p>
              </div>
              <div className={css_form.plant_part_inputs_container}>
                <div className={css.form_item_container}>
                  <p className={css.form_label}>
                    Nome parte
                    {isEditMode ? '' : ' *'}
                  </p>
                  <Input
                    // {...register('namePlantPart')}
                    type="text"
                    style={{
                      height: '36px',
                      borderRadius: '6px',
                      background: '#f3f3f5',
                      border: 'none',
                    }}
                  />
                  {/* {activeForm.formState.errors.namePlantPart && (
                <p className={css.error}>
                  {activeForm.formState.errors.namePlantPart.message}
                </p>
              )} */}
                </div>
                <div className={css.form_item_container}>
                  <p className={css.form_label}>
                    Codice parte {isEditMode ? '' : ' *'}
                  </p>
                  <Input
                    // {...register('codePlantPart')}
                    type="text"
                    style={{
                      height: '36px',
                      borderRadius: '6px',
                      background: '#f3f3f5',
                      border: 'none',
                    }}
                  />
                  {/* {activeForm.formState.errors.codePlantPart && (
                <p className={css.error}>
                  {activeForm.formState.errors.codePlantPart.message}
                </p>
              )} */}
                </div>
              </div>
              <div className={css_form.add_btn_container}>
                <Button
                  type="button"
                  className={`${css_form.btn} button button--blue`}
                >
                  <svg width="16" height="16" className={css_form.btn_icon}>
                    <use href="/sprite.svg#plus"></use>
                  </svg>
                  Aggiungi
                </Button>
              </div>
            </div>
          )}
          <div className={css.btn_form_container}>
            <Button
              type="button"
              className="button button--white"
              width="100%"
              onClick={() => {
                onClose();
              }}
            >
              Annulla
            </Button>
            <Button type="submit" className="button button--blue" width="100%">
              Crea Macchina
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateAndEditPlantForm;
