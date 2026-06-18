'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import css from './LanguageSwitcher.module.css';

type LocaleCode = 'it' | 'en' | 'es' | 'pl';

interface LocaleOption {
  code: LocaleCode;
  label: string;
}

// Single source of truth for the supported locales. Order matches
// the previous IT/EN/ES button row + PL appended (the messages/
// folder already ships pl.json, the old 3-button row just never
// surfaced it).
const LOCALES: LocaleOption[] = [
  { code: 'it', label: 'IT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'pl', label: 'PL' },
];

const LanguageButton = () => {
  const router = useRouter();
  const [select, setSelect] = useState<LocaleCode>('it');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = (localStorage.getItem('locale') as LocaleCode) || 'it';
    setSelect(stored);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const localeSelect = (code: LocaleCode) => {
    localStorage.setItem('locale', code);
    document.cookie = `locale=${code}; path=/;`;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('localeChange'));
    }
    setSelect(code);
    setOpen(false);
    router.refresh();
  };

  const currentLabel =
    LOCALES.find(l => l.code === select)?.label ?? select.toUpperCase();

  return (
    <div className={css.container} ref={ref}>
      <button
        type="button"
        className={`${css.trigger} ${open ? css.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch language"
      >
        <span className={css.triggerLabel}>{currentLabel}</span>
        <svg
          className={`${css.arrow} ${open ? css.arrowUp : ''}`}
          width="12"
          height="12"
          aria-hidden="true"
        >
          <use href="/sprite.svg#arrow_back_ios_new" />
        </svg>
      </button>

      {open && (
        <ul className={css.menu} role="listbox">
          {LOCALES.map(({ code, label }) => {
            const isActive = code === select;
            return (
              <li key={code} role="option" aria-selected={isActive}>
                <button
                  type="button"
                  className={`${css.option} ${isActive ? css.optionActive : ''}`}
                  onClick={() => localeSelect(code)}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default LanguageButton;
