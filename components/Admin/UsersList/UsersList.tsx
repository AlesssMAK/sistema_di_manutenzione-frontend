'use client';

import { User } from '@/types/userTypes';
import css from './UsersList.module.css';
import { useTranslations } from 'next-intl';
import UserCard from './UserCard/UserCard';

interface UsersListProps {
  users: User[];
}

const UsersList = ({ users }: UsersListProps) => {
  const t = useTranslations('AdminPage.UsersList');
  return (
    <div className={css.users_container}>
      <ul className={css.title_list}>
        <li className={`${css.title_list_item} ${css.name}`}>
          <h3 className={`${css.title} ${css.name}`}>{t('name')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.role}`}>
          <h3 className={css.title}>{t('role')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.email}`}>
          <h3 className={css.title}>{t('email')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.status}`}>
          <h3 className={css.title}>{t('status')}</h3>
        </li>
        <li className={`${css.title_list_item} ${css.action}`}>
          <h3 className={css.title}>{t('actions')}</h3>
        </li>
      </ul>
      {users.map(user => (
        <UserCard user={user} />
      ))}
    </div>
  );
};

export default UsersList;
