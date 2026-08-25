'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllUsers } from '@/lib/api/users';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import css from './UsersMultiSelect.module.css';

interface UsersMultiSelectProps {
  /** Currently selected user ids. */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  emptyText: string;
  removeLabel: string;
}

// Reusable "pick specific users" control: a dropdown to add + chips to
// remove. Stores plain user ids, so it drives settings/config state
// rather than user permissions (unlike GrantUsersSection).
const UsersMultiSelect = ({
  selectedIds,
  onChange,
  placeholder,
  emptyText,
  removeLabel,
}: UsersMultiSelectProps) => {
  const { data } = useQuery({
    queryKey: ['users', 'multiselect-pool'],
    queryFn: () => getAllUsers({ status: 'active', perPage: 200 }),
  });
  const users = useMemo(() => data?.users ?? [], [data]);

  const byId = useMemo(
    () => new Map(users.map(u => [u._id, u])),
    [users]
  );
  const selectedSet = new Set(selectedIds);
  const candidates = users.filter(u => !selectedSet.has(u._id));

  const addByName = (name: string) => {
    const u = candidates.find(c => c.fullName === name);
    if (u) onChange([...selectedIds, u._id]);
  };
  const remove = (id: string) =>
    onChange(selectedIds.filter(x => x !== id));

  return (
    <div className={css.wrap}>
      <SelectDropdown
        options={candidates.map(u => u.fullName)}
        selectedValue={''}
        placeholder={placeholder}
        onSelect={addByName}
      />

      {selectedIds.length === 0 ? (
        <p className={css.empty}>{emptyText}</p>
      ) : (
        <ul className={css.chips}>
          {selectedIds.map(id => (
            <li key={id} className={css.chip}>
              <span>{byId.get(id)?.fullName ?? id}</span>
              <button
                type="button"
                className={css.chipRemove}
                onClick={() => remove(id)}
                aria-label={removeLabel}
                title={removeLabel}
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

export default UsersMultiSelect;
