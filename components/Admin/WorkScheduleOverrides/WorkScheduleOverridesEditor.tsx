'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getAllUsers } from '@/lib/api/users';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import TimePickerInput from '@/components/UI/TimePickerInput/TimePickerInput';
import Toggle from '@/components/UI/Toggle/Toggle';
import type {
  WeekDayKey,
  WeekSchedule,
  WorkHours,
  WorkScheduleOverrideBase,
  WorkScheduleOverrides,
} from '@/lib/api/systemSettings';
import css from './WorkScheduleOverrides.module.css';

const DAYS: WeekDayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface RoleOption {
  value: string;
  label: string;
}

interface WorkScheduleOverridesEditorProps {
  value: WorkScheduleOverrides;
  onChange: (next: WorkScheduleOverrides) => void;
  roleOptions: RoleOption[];
  factoryWorkHours: WorkHours;
  factoryWeekSchedule: WeekSchedule;
}

// Shared editor body for one override entry (a role's or a user's). A
// "Per giorno" toggle switches between a single start/end range and the
// per-day schedule.
const EntryBody = ({
  idPrefix,
  base,
  onChange,
  factoryWorkHours,
  factoryWeekSchedule,
}: {
  idPrefix: string;
  base: WorkScheduleOverrideBase;
  onChange: (patch: Partial<WorkScheduleOverrideBase>) => void;
  factoryWorkHours: WorkHours;
  factoryWeekSchedule: WeekSchedule;
}) => {
  const t = useTranslations('AdminPage.SystemSettings.schedule');
  const tDays = useTranslations('AdminPage.SystemSettings.weekDays');
  const workHours = base.workHours ?? factoryWorkHours;
  const week = base.weekSchedule ?? factoryWeekSchedule;

  return (
    <div className={css.entryBody}>
      <Toggle
        id={`perday-${idPrefix}`}
        checked={base.perDay ?? false}
        onChange={perDay => onChange({ perDay })}
        label={t('perDay')}
      />

      {base.perDay ? (
        <div className={css.week}>
          {DAYS.map(key => {
            const day = week[key];
            return (
              <div key={key} className={css.weekRow}>
                <span className={css.weekDayName}>{tDays(key)}</span>
                <Toggle
                  id={`day-${idPrefix}-${key}`}
                  checked={day.enabled}
                  onChange={enabled =>
                    onChange({
                      weekSchedule: {
                        ...week,
                        [key]: { ...day, enabled },
                      },
                    })
                  }
                  label={day.enabled ? t('mode.hours') : t('mode.off')}
                />
                {day.enabled && (
                  <div className={css.times}>
                    <TimePickerInput
                      value={day.start}
                      onChange={v =>
                        onChange({
                          weekSchedule: {
                            ...week,
                            [key]: { ...day, start: v },
                          },
                        })
                      }
                    />
                    <span className={css.dash}>–</span>
                    <TimePickerInput
                      value={day.end}
                      onChange={v =>
                        onChange({
                          weekSchedule: {
                            ...week,
                            [key]: { ...day, end: v },
                          },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={css.times}>
          <TimePickerInput
            value={workHours.start}
            onChange={v =>
              onChange({ workHours: { ...workHours, start: v } })
            }
          />
          <span className={css.dash}>–</span>
          <TimePickerInput
            value={workHours.end}
            onChange={v => onChange({ workHours: { ...workHours, end: v } })}
          />
        </div>
      )}
    </div>
  );
};

// Per-role and per-user work-hour overrides. "Add a role/user" reveals an
// entry; only configured ones are listed (compact). An entry with no
// override follows the factory schedule.
const WorkScheduleOverridesEditor = ({
  value,
  onChange,
  roleOptions,
  factoryWorkHours,
  factoryWeekSchedule,
}: WorkScheduleOverridesEditorProps) => {
  const t = useTranslations('AdminPage.SystemSettings.schedule');

  const { data: usersData } = useQuery({
    queryKey: ['users', 'schedule-pool'],
    queryFn: () => getAllUsers({ status: 'active', perPage: 200 }),
  });
  const users = useMemo(() => usersData?.users ?? [], [usersData]);
  const userNameById = useMemo(
    () => new Map(users.map(u => [u._id, u.fullName])),
    [users]
  );

  const seed = (): WorkScheduleOverrideBase => ({
    perDay: false,
    workHours: { ...factoryWorkHours },
    weekSchedule: factoryWeekSchedule,
  });

  const roleLabel = (v: string) =>
    roleOptions.find(r => r.value === v)?.label ?? v;

  // --- roles ---
  const availableRoles = roleOptions.filter(
    r => !value.roles.some(e => e.role === r.value)
  );
  const addRole = (label: string) => {
    const role = roleOptions.find(r => r.label === label);
    if (!role) return;
    onChange({
      ...value,
      roles: [...value.roles, { role: role.value, ...seed() }],
    });
  };

  // --- users ---
  const availableUsers = users.filter(
    u => !value.users.some(e => e.userId === u._id)
  );
  const addUser = (name: string) => {
    const user = availableUsers.find(u => u.fullName === name);
    if (!user) return;
    onChange({
      ...value,
      users: [...value.users, { userId: user._id, ...seed() }],
    });
  };

  return (
    <div className={css.wrap}>
      {/* Roles */}
      <div className={css.group}>
        <p className={css.groupTitle}>{t('overridesRoles')}</p>
        <SelectDropdown
          options={availableRoles.map(r => r.label)}
          selectedValue={''}
          placeholder={t('addRole')}
          onSelect={addRole}
        />
        {value.roles.map((entry, idx) => (
          <div key={entry.role} className={css.entry}>
            <div className={css.entryHead}>
              <span className={css.entryName}>{roleLabel(entry.role)}</span>
              <button
                type="button"
                className={css.removeBtn}
                onClick={() =>
                  onChange({
                    ...value,
                    roles: value.roles.filter((_, i) => i !== idx),
                  })
                }
                aria-label={t('removeOverride')}
                title={t('removeOverride')}
              >
                ×
              </button>
            </div>
            <EntryBody
              idPrefix={`role-${entry.role}`}
              base={entry}
              onChange={patch =>
                onChange({
                  ...value,
                  roles: value.roles.map((e, i) =>
                    i === idx ? { ...e, ...patch } : e
                  ),
                })
              }
              factoryWorkHours={factoryWorkHours}
              factoryWeekSchedule={factoryWeekSchedule}
            />
          </div>
        ))}
      </div>

      {/* Users */}
      <div className={css.group}>
        <p className={css.groupTitle}>{t('overridesUsers')}</p>
        <SelectDropdown
          options={availableUsers.map(u => u.fullName)}
          selectedValue={''}
          placeholder={t('addUser')}
          onSelect={addUser}
        />
        {value.users.map((entry, idx) => (
          <div key={entry.userId} className={css.entry}>
            <div className={css.entryHead}>
              <span className={css.entryName}>
                {userNameById.get(entry.userId) ?? entry.userId}
              </span>
              <button
                type="button"
                className={css.removeBtn}
                onClick={() =>
                  onChange({
                    ...value,
                    users: value.users.filter((_, i) => i !== idx),
                  })
                }
                aria-label={t('removeOverride')}
                title={t('removeOverride')}
              >
                ×
              </button>
            </div>
            <EntryBody
              idPrefix={`user-${entry.userId}`}
              base={entry}
              onChange={patch =>
                onChange({
                  ...value,
                  users: value.users.map((e, i) =>
                    i === idx ? { ...e, ...patch } : e
                  ),
                })
              }
              factoryWorkHours={factoryWorkHours}
              factoryWeekSchedule={factoryWeekSchedule}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkScheduleOverridesEditor;
