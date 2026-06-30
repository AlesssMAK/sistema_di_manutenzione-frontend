'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getAllUsers, updateUser } from '@/lib/api/users';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import type {
  GrantedUser,
  UserPermissions,
  UserRoles,
} from '@/types/userTypes';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import css from './GrantUsersSection.module.css';

interface RoleOption {
  value: UserRoles;
  label: string;
}

interface GrantUsersSectionProps {
  title: string;
  subtitle: string;
  selectUserPlaceholder: string;
  emptyText: string;
  revokeLabel: string;
  successGranted: string;
  successRevoked: string;
  errorText: string;
  permissionKey: keyof UserPermissions;
  grantedQueryKey: readonly string[];
  fetchGranted: () => Promise<GrantedUser[]>;
  /** Lock the pool to one role (e.g. 'operator' for messaging) — the
   *  role filter is hidden. */
  fixedRole?: UserRoles;
  /** When set (no fixedRole), render a role filter above the picker. */
  roleFilterLabel?: string;
  allRolesLabel?: string;
  roleOptions?: RoleOption[];
}

const GrantUsersSection = ({
  title,
  subtitle,
  selectUserPlaceholder,
  emptyText,
  revokeLabel,
  successGranted,
  successRevoked,
  errorText,
  permissionKey,
  grantedQueryKey,
  fetchGranted,
  fixedRole,
  roleFilterLabel,
  allRolesLabel,
  roleOptions,
}: GrantUsersSectionProps) => {
  const queryClient = useQueryClient();
  const [roleSel, setRoleSel] = useState<UserRoles | ''>('');

  const showRoleFilter =
    !fixedRole && !!roleOptions && !!allRolesLabel && !!roleFilterLabel;
  const effectiveRole = fixedRole ?? (roleSel || undefined);

  const roleMapper = useMemo(
    () =>
      createOptionMapper<UserRoles | ''>([
        { value: '', label: allRolesLabel ?? '' },
        ...(roleOptions ?? []),
      ]),
    [allRolesLabel, roleOptions]
  );

  const grantedQuery = useQuery({
    queryKey: grantedQueryKey,
    queryFn: fetchGranted,
  });

  // Active users only — the grant pool. perPage is generous so the
  // dropdown holds the whole roster without paging.
  const usersQuery = useQuery({
    queryKey: ['users', 'grant-pool', permissionKey, effectiveRole ?? 'all'],
    queryFn: () =>
      getAllUsers({ status: 'active', role: effectiveRole, perPage: 200 }),
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

  // Admins always have the right; hide them and anyone already granted.
  const candidates = (usersQuery.data?.users ?? []).filter(
    u => u.role !== 'admin' && !grantedIds.has(u._id)
  );

  const onPickUser = (label: string) => {
    const picked = candidates.find(u => u.fullName === label);
    if (picked) setPermission.mutate({ userId: picked._id, value: true });
  };

  return (
    <div className={css.section}>
      <div className={css.head}>
        <h2 className={css.title}>{title}</h2>
        <p className={css.subtitle}>{subtitle}</p>
      </div>

      <div className={css.controls}>
        {showRoleFilter && (
          <div className={css.control}>
            <label className={css.controlLabel}>{roleFilterLabel}</label>
            <SelectDropdown
              options={roleMapper.labelsArray}
              selectedValue={
                roleMapper.getLabelByValue(roleSel) ?? allRolesLabel ?? ''
              }
              onSelect={label =>
                setRoleSel(roleMapper.getValueByLabel(label) ?? '')
              }
            />
          </div>
        )}
        <div className={css.control}>
          <SelectDropdown
            options={candidates.map(u => u.fullName)}
            selectedValue={''}
            placeholder={selectUserPlaceholder}
            onSelect={onPickUser}
          />
        </div>
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
