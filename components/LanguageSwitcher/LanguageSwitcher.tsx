'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

// Kept outside the component: writing to `document.cookie` is a mutation of a
// global that React Compiler flags inside a component body.
const persistLocale = (code: LocaleCode) => {
  localStorage.setItem('locale', code);
  document.cookie = `locale=${code}; path=/;`;
  window.dispatchEvent(new Event('localeChange'));
};

// The stored locale is external state, so it is read through a store
// subscription instead of being copied into React state inside an effect.
// `persistLocale` fires `localeChange`, which is what re-renders the trigger.
const subscribeToLocale = (onChange: () => void) => {
  window.addEventListener('localeChange', onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener('localeChange', onChange);
    window.removeEventListener('storage', onChange);
  };
};
const getStoredLocale = (): LocaleCode =>
  (localStorage.getItem('locale') as LocaleCode) || 'it';
const getServerLocale = (): LocaleCode => 'it';

const LanguageButton = () => {
  const select = useSyncExternalStore(
    subscribeToLocale,
    getStoredLocale,
    getServerLocale
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    persistLocale(code);
    setOpen(false);
    // Full reload (not router.refresh): router.refresh only revalidates
    // the current route, so other client-cached routes stay in the old
    // locale — e.g. the page you return to via router.back() after
    // creating a fault would render in the previous (default) language.
    // A reload re-fetches every route with the new locale cookie.
    window.location.reload();
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
