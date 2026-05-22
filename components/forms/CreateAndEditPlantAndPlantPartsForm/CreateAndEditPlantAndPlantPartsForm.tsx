import Modal from '@/components/UI/Modal/Modal';
import css from '../CreateAndUpdateUserForm/CreateAndEditUserForm.module.css';
import css_form from './CreateAndEditPlantAndPlantPartsForm.module.css';
import Input from '@/components/UI/Input/Input';
import Button from '@/components/UI/Button/Button';
import { useTranslations } from 'next-intl';
import {
  Resolver,
  useFieldArray,
  useForm,
  UseFormRegister,
} from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  CreatePlantAndPlantPartsFormValues,
  createPlantAndPlantPartsSchema,
  updatePlantPartSchema,
  updatePlantSchema,
} from '@/lib/validation/createAndUpdatePlantAndPalntPartsFormValidation';
import { useState } from 'react';
import { UpdatePlantPart } from '@/types/partPlant';
import { UpdatePlant } from '@/types/plantType';
import { createPlant } from '@/lib/api/plants';
import { createPlantPart } from '@/lib/api/plantsParts';
import { da } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface CreateAndEditPlantAndPlantPartsFormProps {
  onClose: () => void;
  // initialData?: InitialData;
  isPlantEditMode?: boolean;
  isPlantPartsEditMode?: boolean;
}

const CreateAndEditPlantAndPlantPartsForm = ({
  onClose,
  isPlantEditMode = false,
  isPlantPartsEditMode = false,
}: CreateAndEditPlantAndPlantPartsFormProps) => {
  const [newPartName, setNewPartName] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const tBtn = useTranslations('btn');
  const tStatus = useTranslations('Statuses');

  const createPlantAndPlantPartsForm =
    useForm<CreatePlantAndPlantPartsFormValues>({
      resolver: yupResolver(createPlantAndPlantPartsSchema),
      mode: 'onSubmit',
      defaultValues: {
        namePlant: '',
        code: '',
        location: '',
        description: '',
        parts: [],
      },
    });

  const updatePlantForm = useForm<UpdatePlant>({
    resolver: yupResolver(updatePlantSchema) as Resolver<UpdatePlant>,
    mode: 'onSubmit',
  });

  const statusPlant = updatePlantForm.watch('status');
  const isActivePlant = statusPlant === 'active';

  const updatePlantPartForm = useForm<UpdatePlantPart>({
    resolver: yupResolver(updatePlantPartSchema) as Resolver<UpdatePlantPart>,
    mode: 'onSubmit',
  });

  const statusPlantPart = updatePlantForm.watch('status');
  const isActivePlantPart = statusPlantPart === 'active';

  const { fields, append, remove } = useFieldArray({
    control: createPlantAndPlantPartsForm.control,
    name: 'parts',
  });
  console.log(createPlantAndPlantPartsForm.formState.errors);

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

  const onCreatePlantAndPlantPartsSubmit = async (
    data: CreatePlantAndPlantPartsFormValues
  ) => {
    try {
      const plant = await createPlant({
        namePlant: data.namePlant,
        code: data.code,
        location: data.location,
        description: data.description,
      });

      const plantId = plant._id;

      await createPlantPart({
        plantId: plantId,
        parts: data.parts,
      });

      toast.success('Plant and plant parts successfully created');
      createPlantAndPlantPartsForm.reset();

      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const onUpdatePlantSubmit = (data: UpdatePlant) => {
    console.log('UPDATE PLANT', data);
  };

  const onUpdatePlantPartSubmit = (data: UpdatePlantPart) => {
    console.log('UPDATE PLANT PART', data);
  };

  const registerPlant = isPlantEditMode
    ? (updatePlantForm.register as UseFormRegister<any>)
    : (createPlantAndPlantPartsForm.register as UseFormRegister<any>);

  const activeForm = isPlantEditMode
    ? updatePlantForm
    : createPlantAndPlantPartsForm;

  const activePlantSubmit = isPlantEditMode
    ? updatePlantForm.handleSubmit(onUpdatePlantSubmit)
    : createPlantAndPlantPartsForm.handleSubmit(
        onCreatePlantAndPlantPartsSubmit
      );

  const activePlantPartsSubmit = isPlantPartsEditMode
    ? updatePlantPartForm.handleSubmit(onUpdatePlantPartSubmit)
    : createPlantAndPlantPartsForm.handleSubmit(
        onCreatePlantAndPlantPartsSubmit
      );

  return (
    <Modal onClose={onClose}>
      <div className={css.form_container}>
        <div className={css.title_container}>
          <h1 className="title">
            {isPlantEditMode ? 'Nuova Macchina' : 'Modifica Macchina'}
          </h1>
          <p className="subtitle">
            Gestisci le informazioni della macchina o impianto
          </p>
        </div>
        <form
          className={css.form}
          onSubmit={
            isPlantEditMode ? activePlantSubmit : activePlantPartsSubmit
          }
        >
          {!isPlantPartsEditMode && (
            <div className={css_form.plant_container}>
              <div className={css.form_item_container}>
                <p className={css.form_label}>
                  Nome Macchina
                  {isPlantEditMode ? '' : ' *'}
                </p>
                <Input
                  {...registerPlant('namePlant')}
                  type="text"
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f3f3f5',
                    border: 'none',
                  }}
                />
                {activeForm.formState.errors.namePlant && (
                  <p className={css.error}>
                    {activeForm.formState.errors.namePlant.message}
                  </p>
                )}
              </div>
              <div className={css.form_item_container}>
                <p className={css.form_label}>
                  Codice
                  {isPlantEditMode ? '' : ' *'}
                </p>
                <Input
                  {...registerPlant('code')}
                  type="text"
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f3f3f5',
                    border: 'none',
                  }}
                />
                {activeForm.formState.errors.code && (
                  <p className={css.error}>
                    {activeForm.formState.errors.code.message}
                  </p>
                )}
              </div>
              <div className={css.form_item_container}>
                <p className={css.form_label}>
                  Ubicazione
                  {isPlantEditMode ? '' : ' *'}
                </p>
                <Input
                  {...registerPlant('location')}
                  type="text"
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    background: '#f3f3f5',
                    border: 'none',
                  }}
                />
                {activeForm.formState.errors.location && (
                  <p className={css.error}>
                    {activeForm.formState.errors.location.message}
                  </p>
                )}
              </div>
              {isPlantEditMode && (
                <div className={css.form_item_container}>
                  <p className={css.form_label}>status</p>
                  <div className={css.label_container}>
                    <input
                      onChange={e =>
                        updatePlantForm.setValue(
                          'status',
                          e.target.checked ? 'active' : 'deactivated',
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                          }
                        )
                      }
                      type="checkbox"
                      className={css.status_input}
                      checked={isActivePlant}
                      id="user-stauts"
                    />
                    <label htmlFor="user-stauts" className={css.status_label} />
                    <p className={css.status_label_text}>
                      status
                      {isActivePlant
                        ? tStatus('active')
                        : tStatus('deactivated')}
                    </p>
                  </div>
                  {updatePlantForm.formState.errors.status && (
                    <p className={css.error}>
                      {updatePlantForm.formState.errors.status.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {!isPlantEditMode && (
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
                    {isPlantEditMode ? '' : ' *'}
                  </p>
                  <Input
                    {...updatePlantPartForm.register('namePlantPart')}
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
                  {updatePlantPartForm.formState.errors.namePlantPart && (
                    <p className={css.error}>
                      {
                        updatePlantPartForm.formState.errors.namePlantPart
                          .message
                      }
                    </p>
                  )}
                </div>
                <div className={css.form_item_container}>
                  <p className={css.form_label}>
                    Codice parte {isPlantEditMode ? '' : ' *'}
                  </p>
                  <Input
                    {...updatePlantPartForm.register('codePlantPart')}
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
                  {updatePlantPartForm.formState.errors.codePlantPart && (
                    <p className={css.error}>
                      {
                        updatePlantPartForm.formState.errors.codePlantPart
                          .message
                      }
                    </p>
                  )}
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
                <div className={css_form.parts}>
                  <p className={css_form.parts_list_title}>Parti aggiunte:</p>

                  <ul className={css_form.parts_list}>
                    {fields.map((field, index) => (
                      <li key={field.id} className={css_form.parts_list_item}>
                        <span className={css_form.part_name}>
                          {field.namePlantPart}
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
                          <svg
                            width="18"
                            height="18"
                            className={css_form.btn_close_icon}
                          >
                            <use href="/sprite.svg#close"></use>
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {createPlantAndPlantPartsForm.formState.errors.parts &&
                !Array.isArray(
                  createPlantAndPlantPartsForm.formState.errors.parts
                ) && (
                  <p className={css.error}>
                    {
                      createPlantAndPlantPartsForm.formState.errors.parts
                        .message
                    }
                  </p>
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

export default CreateAndEditPlantAndPlantPartsForm;
