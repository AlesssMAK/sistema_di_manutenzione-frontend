import { it, enUS, es, pl } from 'date-fns/locale';
import type { Locale } from 'date-fns';

// Maps the app's next-intl locale codes to date-fns locale objects so
// month/day names in custom date UIs follow the language the user
// picked, instead of the browser locale a native <input type="date">
// would use.
const LOCALE_MAP: Record<string, Locale> = {
  it,
  en: enUS,
  es,
  pl,
};

export const getDateFnsLocale = (locale: string): Locale =>
  LOCALE_MAP[locale] ?? it;
