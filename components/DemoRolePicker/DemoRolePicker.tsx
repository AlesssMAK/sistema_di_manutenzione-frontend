'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { demoLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { roleRoutes } from '@/constants/roleRoutes';
import css from './DemoRolePicker.module.css';

// The five roles a visitor can try, in the order shown. `icon` is a
// sprite id; `color` is the gradient class for the icon badge.
const DEMO_ROLES = [
  { role: 'operator', icon: 'clipboard', color: css.icon_color_operator },
  { role: 'manager', icon: 'squares', color: css.icon_color_manager },
  {
    role: 'maintenanceWorker',
    icon: 'crewdriver',
    color: css.icon_color_maintenance,
  },
  { role: 'safety', icon: 'shield-check', color: css.icon_color_safety },
  // Was hidden behind `user?.role === 'admin'`. In the demo everyone can
  // try admin, so it's always shown — and the layout now keeps it in a
  // balanced row instead of orphaning it.
  { role: 'admin', icon: 'tooth', color: css.icon_color_admin },
] as const;

const DemoRolePicker = () => {
  const t = useTranslations('RolesPage');
  const setUser = useAuthStore(state => state.setUser);
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const handlePick = async (role: string) => {
    if (pending) return;
    setPending(role);
    try {
      const { user } = await demoLogin(role);
      setUser(user);
      const route = roleRoutes[role]?.[0] ?? '/';
      router.push(route);
    } catch {
      toast.error(t('errorGeneric'));
      setPending(null);
    }
  };

  return (
    <main className={css.main}>
      <div className="container">
        <h1 className={css.title}>{t('title')}</h1>
        <p className={css.text}>{t('subtitle')}</p>
        <div className={css.list}>
          {DEMO_ROLES.map(({ role, icon, color }) => (
            <button
              key={role}
              type="button"
              className={css.card}
              onClick={() => handlePick(role)}
              disabled={pending !== null}
              aria-busy={pending === role}
            >
              <div className={css.list_item}>
                <div className={`${css.icon_container} ${color}`}>
                  <svg width="40" height="40" className={css.icon}>
                    <use href={`/sprite.svg#${icon}`}></use>
                  </svg>
                </div>
                <h3 className={css.list_title}>{t(`roles.${role}.title`)}</h3>
                <p className={css.list_text}>{t(`roles.${role}.description`)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
};

export default DemoRolePicker;
