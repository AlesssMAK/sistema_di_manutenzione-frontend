'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import toast from 'react-hot-toast';
import { getAllUsers, updateUser } from '@/lib/api/users';
import type {
  GrantedUser,
  UserPermissions,
  UserRoles,
} from '@/types/userTypes';
import Input from '@/components/UI/Input/Input';
import css from './GrantUsersSection.module.css';

interface GrantUsersSectionProps {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  emptyText: string;
  revokeLabel: string;
  successGranted: string;
  successRevoked: string;
  errorText: string;
  permissionKey: keyof UserPermissions;
  /** React Query key for the "granted users" list. */
  grantedQueryKey: readonly string[];
  fetchGranted: () => Promise<GrantedUser[]>;
  /** Limit the searchable pool (e.g. 'operator' for messaging). */
  roleFilter?: UserRoles;
}

const GrantUsersSection = ({
  title,
  subtitle,
  searchPlaceholder,
  emptyText,
  revokeLabel,
  successGranted,
  successRevoked,
  errorText,
  permissionKey,
  grantedQueryKey,
  fetchGranted,
  roleFilter,
}: GrantUsersSectionProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debounced] = useDebounce(search.trim(), 300);

  const grantedQuery = useQuery({
    queryKey: grantedQueryKey,
    queryFn: fetchGranted,
  });

  const searchQuery = useQuery({
    queryKey: ['users', 'grant-search', permissionKey, debounced, roleFilter],
    queryFn: () =>
      getAllUsers({ search: debounced, role: roleFilter, page: 1 }),
    enabled: debounced.length > 0,
  });

  const setPermission = useMutation({
    mutationFn: ({ userId, value }: { userId: string; value: boolean }) =>
      updateUser({
        userId,
        data: { permissions: { [permissionKey]: value } as UserPermissions },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: grantedQueryKey });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(variables.value ? successGranted : successRevoked);
    },
    onError: () => toast.error(errorText),
  });

  const granted = grantedQuery.data ?? [];
  const grantedIds = new Set(granted.map(u => u._id));

  // Admins always have the right, so they never need granting; hide
  // anyone already in the granted list too.
  const results = (searchQuery.data?.users ?? []).filter(
    u => u.role !== 'admin' && !grantedIds.has(u._id)
  );

  const grant = (userId: string) => {
    setPermission.mutate({ userId, value: true });
    setSearch('');
  };

  return (
    <div className={css.section}>
      <div className={css.head}>
        <h2 className={css.title}>{title}</h2>
        <p className={css.subtitle}>{subtitle}</p>
      </div>

      <div className={css.searchWrap}>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          icon="search"
          style={{
            height: '36px',
            borderRadius: '6px',
            background: '#f3f3f5',
            border: 'none',
          }}
        />
        {debounced.length > 0 && results.length > 0 && (
          <ul className={css.results}>
            {results.map(u => (
              <li key={u._id}>
                <button
                  type="button"
                  className={css.resultItem}
                  onClick={() => grant(u._id)}
                  disabled={setPermission.isPending}
                >
                  <span className={css.resultName}>{u.fullName}</span>
                  <span className={css.resultRole}>{u.role}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {granted.length === 0 ? (
        <p className={css.empty}>{emptyText}</p>
      ) : (
        <ul className={css.chips}>
          {granted.map(u => (
            <li key={u._id} className={css.chip}>
              <span>{u.fullName}</span>
              <button
                type="button"
                className={css.chipRemove}
                onClick={() =>
                  setPermission.mutate({ userId: u._id, value: false })
                }
                disabled={setPermission.isPending}
                aria-label={revokeLabel}
                title={revokeLabel}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GrantUsersSection;
