'use client';

import { useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { demoLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { roleRoutes } from '@/constants/roleRoutes';
import { USER_ROLES } from '@/constants/roleType';
import css from './DemoRoleSwitcher.module.css';

// Header control for the public demo: pick any role and instantly
// "become" it via the password-less demo-login. Replaces the
// login/logout buttons when NEXT_PUBLIC_DEMO_MODE is on.
const DemoRoleSwitcher = () => {
  const t = useTranslations('Roles');
  const tHeader = useTranslations('header');
  const tRolesPage = useTranslations('RolesPage');
  const setUser = useAuthStore(state => state.setUser);
  const currentRole = useAuthStore(state => state.user?.role);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const handleChange = async (event: ChangeEvent<HTMLSelectElement>) => {
    const role = event.target.value;
    if (!role || role === currentRole || pending) return;

    setPending(true);
    try {
      const { user } = await demoLogin(role);
      setUser(user);
      // Drop cached queries so the new role never shows the previous
      // role's data (e.g. a stale unread-message badge).
      queryClient.clear();
      router.push(roleRoutes[role]?.[0] ?? '/');
    } catch {
      toast.error(tRolesPage('errorGeneric'));
    } finally {
      setPending(false);
    }
  };

  return (
    <select
      className={css.select}
      value={currentRole ?? ''}
      onChange={handleChange}
      disabled={pending}
      aria-label={tHeader('switchRole')}
    >
      {!currentRole && (
        <option value="" disabled>
          {tHeader('switchRole')}
        </option>
      )}
      {USER_ROLES.map(role => (
        <option key={role} value={role}>
          {t(role)}
        </option>
      ))}
    </select>
  );
};

export default DemoRoleSwitcher;
