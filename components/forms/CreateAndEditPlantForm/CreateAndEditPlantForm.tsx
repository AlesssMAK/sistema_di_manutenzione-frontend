import Modal from '@/components/UI/Modal/Modal';
import css from '../CreateAndUpdateUserForm/CreateAndEditUserForm.module.css';
import css_form from './CreateAndEditPlantForm.module.css';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import { useTranslations } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CreatePlantAndPlantPartsFormValues,
  createPlantAndPlantPartsSchema,
} from '@/lib/validation/createAndUpdatePlantAndPalntPartsFormValidation';
import { useState } from 'react';

interface CreateAndEditPlantFormProps {
  onClose: () => void;
  // initialData?: InitialData;
  isEditMode?: boolean;
}

const CreateAndEditPlantForm = ({
  onClose,
  isEditMode = false,
}: CreateAndEditPlantFormProps) => {
  const [newPartName, setNewPartName] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const tBtn = useTranslations('btn');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlantAndPlantPartsFormValues>({
    resolver: yupResolver(createPlantAndPlantPartsSchema),
    defaultValues: {
      namePlant: '',
      code: '',
      location: '',
      description: '',
      parts: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'parts',
  });

  console.log(fields.length);

  const handleAddPart = () => {
    const name = newPartName.trim();
    const code = newPartCode.trim();

    if (!name || !code) {
      setAddError('Compila entrambi i campi');
      return;
    }

    if (fields.some(f => f.codePlantPart === code)) {
      setAddError('Codice già aggiunto');
      return;
    }

    append({ namePlantPart: name, codePlantPart: code });

    setNewPartName('');
    setNewPartCode('');
    setAddError(null);
  };

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
                {...register('namePlant')}
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
                {...register('code')}
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
                {...register('location')}
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
                    type="text"
                    value={newPartName}
                    onChange={e => setNewPartName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPart();
                      }
                    }}
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
                    type="text"
                    value={newPartCode}
                    onChange={e => setNewPartCode(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPart();
                      }
                    }}
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
                  onClick={handleAddPart}
                >
                  <svg width="16" height="16" className={css_form.btn_icon}>
                    <use href="/sprite.svg#plus"></use>
                  </svg>
                  Aggiungi
                </Button>
              </div>
              {fields.length > 0 && (
                <div className={css_form.parts_list}>
                  <p className={css_form.parts_list_title}>Parti aggiunte:</p>

                  {fields.map((field, index) => (
                    <div key={field.id} className={css_form.part_item}>
                      <span className={css_form.part_name}>
                        {field.namePlantPart}{' '}
                        <span className={css_form.part_code}>
                          ({field.codePlantPart})
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className={css_form.remove_btn}
                        aria-label="Rimuovi parte"
                      >
                        <svg width="14" height="14">
                          <use href="/sprite.svg#close"></use>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.parts && !Array.isArray(errors.parts) && (
                <p className={css.error}>{errors.parts.message}</p>
              )}
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
