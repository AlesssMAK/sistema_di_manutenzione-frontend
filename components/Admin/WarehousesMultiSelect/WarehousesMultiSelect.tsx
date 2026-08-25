'use client';

import type { Warehouse } from '@/types/warehouseType';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import css from '../UsersMultiSelect/UsersMultiSelect.module.css';

interface WarehousesMultiSelectProps {
  /** Full pool of warehouses to choose from. */
  warehouses: Warehouse[];
  /** Currently selected warehouse ids. */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  /** Shown when nothing is selected (= all warehouses allowed). */
  emptyText: string;
  removeLabel: string;
}

// "Pick specific warehouses" control: a dropdown to add + chips to
// remove. Stores plain warehouse ids. Reuses UsersMultiSelect styles.
const WarehousesMultiSelect = ({
  warehouses,
  selectedIds,
  onChange,
  placeholder,
  emptyText,
  removeLabel,
}: WarehousesMultiSelectProps) => {
  const selectedSet = new Set(selectedIds);
  const byId = new Map(warehouses.map(w => [w._id, w]));
  const candidates = warehouses.filter(w => !selectedSet.has(w._id));

  const addByName = (name: string) => {
    const w = candidates.find(c => c.name === name);
    if (w) onChange([...selectedIds, w._id]);
  };
  const remove = (id: string) =>
    onChange(selectedIds.filter(x => x !== id));

  return (
    <div className={css.wrap}>
      <SelectDropdown
        options={candidates.map(w => w.name)}
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
              <span>{byId.get(id)?.name ?? id}</span>
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

export default WarehousesMultiSelect;
