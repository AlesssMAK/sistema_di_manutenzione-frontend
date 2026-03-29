'use client';

import { useEffect, useRef, useState } from 'react';
import css from './SelectDropdown.module.css';

interface SelectDropdownProps {
  options: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}

const SelectDropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
  disabled = false,
}: SelectDropdownProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div
      className={css.select_dropdown_container}
      ref={ref}
      onClick={() => {
        if (disabled) return;
        setOpen(!open);
      }}
    >
      <div
        className={`${css.input} ${disabled ? css.disabled : ''} ${open ? css.active : ''}`}
      >
        <span
          className={`${css.value} ${!selectedValue ? css.placeholder : ''}`}
        >
          {selectedValue || placeholder}
        </span>

        <svg
          width="16"
          height="16"
          className={`${css.arrow} ${open ? css.up : css.down}`}
        >
          <use href="/sprite.svg#arrow_back_ios_new"></use>
        </svg>
      </div>

      {open && (
        <div className={css.menu}>
          {options.map(opt => (
            <div
              key={opt}
              className={css.option}
              onClick={e => {
                e.stopPropagation();
                onSelect(opt);
                setOpen(false);
              }}
            >
              {opt}

              {opt === selectedValue && (
                <svg className={css.check} width="14" height="14">
                  <use href="/sprite.svg#check"></use>
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectDropdown;
