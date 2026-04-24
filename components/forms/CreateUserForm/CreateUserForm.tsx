'use client';

import Modal from '@/components/UI/Modal/Modal';
import css from './CreateUserForm.module.css';
import { getRoleOptions } from '@/constants/roleType';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { getStatusOptions } from '@/constants/userStatus';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import { useState } from 'react';
import Input from '@/components/UI/Input/Input';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Button from '@/components/UI/Button/Button';
import { generatePassword, generatePersonalCode } from '@/lib/api/generate';
import { createUserSchema } from '@/lib/validation/createUserFormValidation';
import { CreateUserValues, UserRoles } from '@/types/userTypes';
import { Resolver } from 'react-hook-form';
import { registerUser } from '@/lib/api/auth';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';

interface CreateUserFormProps {
  onClose: () => void;
}

const CreateUserForm = ({ onClose }: CreateUserFormProps) => {
  const [role, setRole] = useState<string>('');
  const [personalCode, setPersonalCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [manual, setManual] = useState(false);

  const t = useTranslations('ReportForm');

  const roleOptions = getRoleOptions().slice(1);
  const roleMapper = createOptionMapper(roleOptions);

  const operator = role === 'operator';

  const statusOptions = getStatusOptions();
  const statusMapper = createOptionMapper(statusOptions);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserValues>({
    resolver: yupResolver(createUserSchema) as Resolver<CreateUserValues>,
  });

  const handleGeneratePersonalCode = async () => {
    const personalCode = await generatePersonalCode();
    setManual(false);
    setPersonalCode(personalCode);
    setValue('personalCode', personalCode, { shouldValidate: true });
  };

  const handleGeneratePassword = async () => {
    const password = await generatePassword();
    setManual(false);
    setPassword(password);
    setValue('password', password, { shouldValidate: true });
  };

  const onCreateUserSubmit = async (data: CreateUserValues) => {
    console.log(data);

    try {
      await registerUser({
        role: data.role,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        personalCode: data.personalCode,
        avatar: data.avatar,
      });
      toast.success('Utente creato con successo');
      reset();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className={css.form_container}>
        <div className={css.title_container}>
          <h1 className="title">Nuovo Utente</h1>
          <p className="subtitle">
            Compila tutti i campi e genera un codice di accesso per il nuovo
            utente
          </p>
        </div>
        <form onSubmit={handleSubmit(onCreateUserSubmit)} className={css.form}>
          <div className={css.form_item_container}>
            <p className={css.form_label}>Ruolo *</p>
            <SelectDropdown
              selectedValue={roleMapper.getLabelByValue(role) ?? ''}
              options={roleMapper.labelsArray}
              onSelect={label => {
                const value = roleMapper.getValueByLabel(label) as UserRoles;
                setRole(value);
                setValue('role', value);
              }}
            />
            <Input type="hidden" {...register('role')} />
            {errors.role && <p className={css.error}>{errors.role.message}</p>}
          </div>
          <div className={css.form_item_container}>
            <p className={css.form_label}>Nome Completo *</p>
            <Input
              {...register('fullName')}
              type="text"
              style={{
                height: '36px',
                borderRadius: '6px',
                background: '#f3f3f5',
                border: 'none',
              }}
            />
            {errors.fullName && (
              <p className={css.error}>{errors.fullName.message}</p>
            )}
          </div>
          <div className={css.form_item_container}>
            <p className={css.form_label}>Email *</p>
            <Input
              {...register('email')}
              type="email"
              style={{
                height: '36px',
                borderRadius: '6px',
                background: '#f3f3f5',
                border: 'none',
              }}
            />
            {errors.email && (
              <p className={css.error}>{errors.email.message}</p>
            )}
          </div>
          <div className={css.form_item_container}>
            <p className={css.form_label}>
              {operator ? 'Codice di Accesso *' : 'Password'}
            </p>
            <div className={css.code_container}>
              <div className={css.code_input_container}>
                {manual ? (
                  <Input
                    {...(operator
                      ? { ...register('personalCode') }
                      : { ...register('password') })}
                    onChange={e => {
                      console.log('value:', e.target.value);
                    }}
                    style={{
                      height: '36px',
                      borderRadius: '6px',
                    }}
                  />
                ) : (
                  <>
                    <p className={css.code}>
                      {operator ? personalCode : password}
                    </p>
                    <Input
                      type="hidden"
                      {...(operator
                        ? { ...register('personalCode') }
                        : { ...register('password') })}
                    />
                  </>
                )}
                {errors.personalCode && (
                  <p className={css.error}>{errors.personalCode.message}</p>
                )}
                {errors.password && (
                  <p className={css.error}>{errors.password.message}</p>
                )}
              </div>
              <div className={css.btn_code_container}>
                <Button
                  type="button"
                  className={`button button--blue ${css.btn}`}
                  width="100%"
                  onClick={
                    operator
                      ? handleGeneratePersonalCode
                      : handleGeneratePassword
                  }
                >
                  <svg width="16" height="16" className={css.btn_icon_reload}>
                    <use href="/sprite.svg#reload"></use>
                  </svg>
                  Genera Automaticamente
                </Button>
                <Button
                  type="button"
                  className="button button--white"
                  width="100%"
                  onClick={() => {
                    setManual(true);
                  }}
                >
                  <svg width="16" height="16" className={css.btn_icon_key}>
                    <use href="/sprite.svg#key"></use>
                  </svg>
                  Imposta Manualmente
                </Button>
              </div>
            </div>
          </div>
          <div className={css.btn_form_container}>
            <Button type="button" className="button button--white" width="100%">
              Annulla
            </Button>
            <Button type="submit" className="button button--blue" width="100%">
              Crea Utente
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateUserForm;
