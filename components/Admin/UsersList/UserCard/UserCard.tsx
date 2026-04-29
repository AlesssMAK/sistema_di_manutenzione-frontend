'use client';

import CreateAndEditUserForm from '@/components/forms/CreateAndUpdateUserForm/CreateAndEditUserForm';
import Button from '@/components/UI/Button/Button';
import { getRoleOptions } from '@/constants/roleType';
import { getStatusOptions } from '@/constants/userStatus';
import { updateUser } from '@/lib/api/users';
import { UpdateUserRequest, User, UserStatus } from '@/types/userTypes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import css from './UserCard.module.css';

interface UserCardProps {
  user: User;
}

interface UpdateStatus {
  userId: string;
  status: UserStatus;
}

const UserCard = ({ user }: UserCardProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const t = useTranslations('AdminPage.UsersList');

  const mutation = useMutation({
    mutationFn: ({ userId, data }: UpdateUserRequest) =>
      updateUser({ userId, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const initialData = {
    id: user._id,
    role: user.role || '',
    fullName: user.fullName || '',
    email: user.email || '',
    status: user.status || '',
  };

  const roles = getRoleOptions();
  const role = roles.find(role => role.value === user.role);

  const statuses = getStatusOptions();
  const status = statuses.find(status => status.value === user.status);

  const handleStatusUpdate = async ({ userId, status }: UpdateStatus) => {
    mutation.mutate({ userId, data: { status } });
  };

  return (
    <div className={css.user_card_container}>
      <div className={css.head_container}>
        <div className={css.user_card_item_name}>
          <h3 className={css.title}>{t('name')}</h3>
          <p className={css.name}>{user.fullName}</p>
        </div>
        <div className={css.user_card_item_role}>
          <h3 className={css.title}>{t('role')}</h3>
          <p className={css.role}>{role?.label}</p>
        </div>
      </div>
      <div className={css.user_card_item_email}>
        <h3 className={css.title}>{t('email')}</h3>
        <p className={css.email}>{user.email}</p>
      </div>
      <div className={css.botton_container}>
        <div className={css.user_card_item_status}>
          <h3 className={css.title}>{t('status')}</h3>
          <p
            className={`${css.status} ${user.status === 'deactivated' ? css.deactivated_status : ''}`}
          >
            {user.status === 'active' ? (
              <svg width="12" height="12" className={css.check_circle_icon}>
                <use href="/sprite.svg#check-circle"></use>
              </svg>
            ) : (
              <svg width="12" height="12" className={css.delete_icon}>
                <use href="/sprite.svg#delete"></use>
              </svg>
            )}
            {status?.label}
          </p>
        </div>
        <div className={css.user_card_item}>
          <h3 className={css.title}>{t('actions')}</h3>
          <div className={css.btn_container}>
            <Button
              type="button"
              className={`${css.btn} button button--white`}
              width={38}
              height={32}
              onClick={() => {
                setOpen(true);
              }}
            >
              <svg width="16" height="16" className={css.btn_icon}>
                <use href="/sprite.svg#edit"></use>
              </svg>
            </Button>
            {user.status === 'active' ? (
              <Button
                type="button"
                className={`${css.btn} button button--white`}
                width={38}
                height={32}
                onClick={() =>
                  handleStatusUpdate({
                    userId: user._id,
                    status: 'deactivated',
                  })
                }
              >
                <svg width="16" height="16" className={css.btn_icon}>
                  <use href="/sprite.svg#delete"></use>
                </svg>
              </Button>
            ) : (
              <Button
                type="button"
                className={`${css.btn} button button--blue`}
                width={38}
                height={32}
                onClick={() =>
                  handleStatusUpdate({ userId: user._id, status: 'active' })
                }
              >
                <svg width="16" height="16" className={css.btn_icon_check}>
                  <use href="/sprite.svg#check-circle"></use>
                </svg>
              </Button>
            )}
          </div>
        </div>
      </div>
      {open && (
        <CreateAndEditUserForm
          onClose={() => setOpen(false)}
          initialData={initialData}
          isEditMode={true}
        />
      )}
    </div>
  );
};

export default UserCard;
