'use client';

import Button from '@/components/UI/Button/Button';
import Input from '@/components/UI/Input/Input';
import Modal from '@/components/UI/Modal/Modal';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import { getRoleOptions } from '@/constants/roleType';
import { registerUser } from '@/lib/api/auth';
import { generatePassword, generatePersonalCode } from '@/lib/api/generate';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import {
  CreateUserValues,
  UserRoles,
  UserStatus,
  UpdateUserValues,
} from '@/types/userTypes';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Resolver, useForm, UseFormRegister } from 'react-hook-form';
import toast from 'react-hot-toast';
import css from './CreateAndEditUserForm.module.css';
import {
  createUserSchema,
  updateUserSchema,
} from '@/lib/validation/createUserFormValidation';
import { updateUser } from '@/lib/api/users';
import { useQueryClient } from '@tanstack/react-query';

interface CreateAndEditUserFormProps {
  onClose: () => void;
  initialData?: InitialData;
  isEditMode?: boolean;
}

interface InitialData {
  id: string;
  role: string;
  fullName: string;
  email: string;
  status: string;
}

const CreateAndEditUserForm = ({
  onClose,
  initialData,
  isEditMode = false,
}: CreateAndEditUserFormProps) => {
  const [role, setRole] = useState<string>('');
  const [personalCode, setPersonalCode] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [manual, setManual] = useState(false);

  const t = useTranslations('AdminPage.CreateAndEditUserForm');
  const tStatus = useTranslations('Statuses');

  const queryClient = useQueryClient();

  const roleOptions = getRoleOptions().slice(1);
  const roleMapper = createOptionMapper(roleOptions);

  const operator = role === 'operator';

  const userId = initialData?.id || '';

  const createUserForm = useForm<CreateUserValues>({
    resolver: yupResolver(createUserSchema) as Resolver<CreateUserValues>,
    mode: 'onSubmit',
  });

  const updateUserForm = useForm<UpdateUserValues>({
    resolver: yupResolver(updateUserSchema) as Resolver<UpdateUserValues>,
    mode: 'onSubmit',
    context: { originalRole: initialData?.role },
  });

  const status = updateUserForm.watch('status');
  const isActive = status === 'active';
  console.log(status);

  useEffect(() => {
    if (isEditMode && initialData) {
      updateUserForm.reset({
        role: initialData.role as UserRoles,
        fullName: initialData.fullName,
        email: initialData.email,
        status: initialData.status as UserStatus,
      });

      setRole(initialData.role);
      setPersonalCode('');
      setPassword('');
    }
  }, [initialData, isEditMode, updateUserForm.reset]);

  const handleGeneratePersonalCode = async () => {
    const personalCode = await generatePersonalCode();
    setManual(false);
    setPersonalCode(personalCode);
    createUserForm.setValue('personalCode', personalCode, {
      shouldValidate: true,
    });
    updateUserForm.setValue('personalCode', personalCode, {
      shouldValidate: true,
    });
  };

  const handleGeneratePassword = async () => {
    const password = await generatePassword();
    setManual(false);
    setPassword(password);
    createUserForm.setValue('password', password, { shouldValidate: true });
    updateUserForm.setValue('password', password, { shouldValidate: true });
  };

  const onCreateUserSubmit = async (data: CreateUserValues) => {
    try {
      await registerUser({
        role: data.role,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        personalCode: data.personalCode,
        avatar: data.avatar,
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });

      toast.success(t('userCreatedSuccess'));
      createUserForm.reset();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const onUpdateUserSubmit = async (data: UpdateUserValues) => {
    try {
      await updateUser({
        userId,
        data: {
          role: data.role,
          fullName: data.fullName,
          email: data.email,
          status: data.status,
          password: data.password,
          personalCode: data.personalCode,
        },
      });

      queryClient.invalidateQueries({ queryKey: ['users'] });

      toast.success(t('userUpdatedSuccess'));
      updateUserForm.reset();
      onClose();
    } catch (error) {
      console.log(error);
    }
  };

  const register = isEditMode
    ? (updateUserForm.register as UseFormRegister<any>)
    : (createUserForm.register as UseFormRegister<any>);

  const activeForm = isEditMode ? updateUserForm : createUserForm;

  return (
    <Modal onClose={onClose}>
      <div className={css.form_container}>
        <div className={css.title_container}>
          <h1 className="title">{isEditMode ? t('editTitle') : t('title')}</h1>
          <p className="subtitle">
            {isEditMode ? t('editSubtitle') : t('subtitle')}
          </p>
        </div>
        <form
          onSubmit={
            isEditMode
              ? updateUserForm.handleSubmit(onUpdateUserSubmit)
              : createUserForm.handleSubmit(onCreateUserSubmit)
          }
          className={css.form}
        >
          <div className={css.form_item_container}>
            <p className={css.form_label}>
              {t('role')} {isEditMode ? '' : ' *'}
            </p>
            <SelectDropdown
              selectedValue={roleMapper.getLabelByValue(role) ?? ''}
              options={roleMapper.labelsArray}
              onSelect={label => {
                const value = roleMapper.getValueByLabel(label) as UserRoles;
                setRole(value);
                createUserForm.setValue('role', value);
                updateUserForm.setValue('role', value);
              }}
            />
            <Input type="hidden" {...register('role')} />
            {activeForm.formState.errors.role && (
              <p className={css.error}>
                {activeForm.formState.errors.role.message}
              </p>
            )}
          </div>
          <div className={css.form_item_container}>
            <p className={css.form_label}>
              {t('fullName')}
              {isEditMode ? '' : ' *'}
            </p>
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
            {activeForm.formState.errors.fullName && (
              <p className={css.error}>
                {activeForm.formState.errors.fullName.message}
              </p>
            )}
          </div>
          <div className={css.form_item_container}>
            <p className={css.form_label}>
              {t('email')}
              {isEditMode ? '' : ' *'}
            </p>
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
            {activeForm.formState.errors.email && (
              <p className={css.error}>
                {activeForm.formState.errors.email.message}
              </p>
            )}
          </div>
          {isEditMode && (
            <div className={css.form_item_container}>
              <p className={css.form_label}>{t('status')}</p>
              <div className={css.label_container}>
                <input
                  onChange={e =>
                    updateUserForm.setValue(
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
                  checked={isActive}
                  id="user-stauts"
                />
                <label htmlFor="user-stauts" className={css.status_label} />
                <p className={css.status_label_text}>
                  {t('user')}{' '}
                  {isActive ? tStatus('active') : tStatus('deactivated')}
                </p>
              </div>
              {updateUserForm.formState.errors.status && (
                <p className={css.error}>
                  {updateUserForm.formState.errors.status.message}
                </p>
              )}
            </div>
          )}
          <div className={css.form_item_container}>
            <p className={css.form_label}>
              {operator ? t('accessCode') : t('password')}{' '}
              {isEditMode ? '' : ' *'}
            </p>
            <div className={css.code_container}>
              <div className={css.code_input_container}>
                {isEditMode && (
                  <div className={css.description_container}>
                    <p className={css.code_description}>
                      {t('roleChangeDescription')}
                    </p>
                  </div>
                )}
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
                {activeForm.formState.errors.personalCode && (
                  <p className={css.error}>
                    {activeForm.formState.errors.personalCode.message}
                  </p>
                )}
                {activeForm.formState.errors.password && (
                  <p className={css.error}>
                    {activeForm.formState.errors.password.message}
                  </p>
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
                  {t('generateAutomatically')}
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
                  {t('setManually')}
                </Button>
              </div>
            </div>
          </div>
          <div className={css.btn_form_container}>
            <Button
              type="button"
              className="button button--white"
              width="100%"
              onClick={() => {
                onClose();
              }}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" className="button button--blue" width="100%">
              {isEditMode ? t('saveChanges') : t('createUser')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateAndEditUserForm;
