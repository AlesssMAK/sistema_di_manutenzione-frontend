'use client';

import { usePageStore } from '@/lib/store/pageStore';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import css from './Users.module.css';
import Button from '@/components/UI/Button/Button';
import Filters, { FiltersItem } from '@/components/UI/Filters/Filters';
import { getRoleOptions } from '@/constants/roleType';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import { getStatusOptions } from '@/constants/userStatus';

const AdminUsersClientPage = () => {
  const [search, setSearch] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  const t = useTranslations('AdminPage');
  const tRoles = useTranslations('Roles');
  const tStatuses = useTranslations('Statuses');
  const setPageTitle = usePageStore(state => state.setPageTitle);

  const roleOptions = getRoleOptions();
  const roleMapper = createOptionMapper(roleOptions);

  const statusOptions = getStatusOptions();
  const statusMapper = createOptionMapper(statusOptions);

  const filters: FiltersItem[] = [
    {
      id: 'search',
      type: 'input',
      label: 'Cerca',
      value: search,
      placeholder: 'Cerca per nome...',
      onChange: setSearch,
      icon: 'search',
    },
    {
      id: 'role',
      type: 'select',
      label: 'Ruolo',
      value: roleMapper.getLabelByValue(role) ?? tRoles('all'),
      options: roleMapper.labelsArray,
      onSelect: label => {
        const value = roleMapper.getValueByLabel(label) ?? 'all';
        setRole(value);
      },
    },
    {
      id: 'status',
      type: 'select',
      label: 'Stato',
      value: statusMapper.getLabelByValue(status) ?? tStatuses('all'),
      options: statusMapper.labelsArray,
      onSelect: label => {
        const value = statusMapper.getValueByLabel(label) ?? 'all';
        setStatus(value);
      },
    },
  ];

  console.log(role);

  useEffect(() => {
    setPageTitle(t('titlePageForStore'));
  }, []);
  return (
    <section className={css.section}>
      <div className={css.head_container}>
        <div className={css.title_container}>
          <h1 className="title">Gestione Macchine / Impianti</h1>
          <p className="subtitle">
            Gestisci il catalogo di macchine e impianti
          </p>
        </div>
        <Button type="button" className={`${css.btn} button button--blue`}>
          <svg width="16" height="16" className={css.btn_icon}>
            <use href="/sprite.svg#plus"></use>
          </svg>
          Nuova Macchina
        </Button>
      </div>
      <Filters items={filters} />
    </section>
  );
};

export default AdminUsersClientPage;
