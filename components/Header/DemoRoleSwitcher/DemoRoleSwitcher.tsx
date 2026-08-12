'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { demoLogin } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/authStore';
import { roleRoutes } from '@/constants/roleRoutes';
import { useRoleOptions } from '@/constants/roleType';
import { createOptionMapper } from '@/lib/utils/translationMapper';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import { UserRoles } from '@/types/userTypes';
import css from './DemoRoleSwitcher.module.css';

interface DemoRoleSwitcherProps {
  // Fired after a successful role switch — e.g. to close the mobile
  // menu that hosts the switcher.
  onAfterSelect?: () => void;
}

// Header control for the public demo: pick any role and instantly
// "become" it via the password-less demo-login. Replaces the
// login/logout buttons when NEXT_PUBLIC_DEMO_MODE is on.
// Uses the shared SelectDropdown (same look as the rest of the app)
// instead of a bare native <select>.
const DemoRoleSwitcher = ({ onAfterSelect }: DemoRoleSwitcherProps) => {
  const tHeader = useTranslations('header');
  const tRolesPage = useTranslations('RolesPage');
  const setUser = useAuthStore(state => state.setUser);
  const currentRole = useAuthStore(state => state.user?.role);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  // Drop the leading "all" pseudo-option — the demo only switches
  // between the five real roles.
  const roleMapper = createOptionMapper(useRoleOptions().slice(1));

  const handleSelect = async (label: string) => {
    const role = roleMapper.getValueByLabel(label) as UserRoles | undefined;
    if (!role || role === currentRole || pending) return;

    setPending(true);
    try {
      const { user } = await demoLogin(role);
      setUser(user);
      // Drop cached queries so the new role never shows the previous
      // role's data (e.g. a stale unread-message badge).
      queryClient.clear();
      router.push(roleRoutes[role]?.[0] ?? '/');
      onAfterSelect?.();
    } catch {
      toast.error(tRolesPage('errorGeneric'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={css.switcher}>
      <SelectDropdown
        options={roleMapper.labelsArray}
        selectedValue={
          currentRole ? (roleMapper.getLabelByValue(currentRole) ?? null) : null
        }
        onSelect={handleSelect}
        placeholder={tHeader('switchRole')}
        disabled={pending}
      />
    </div>
  );
};

export default DemoRoleSwitcher;
