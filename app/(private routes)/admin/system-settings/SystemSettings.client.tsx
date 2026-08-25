'use client';

import { getDateFnsLocale } from '@/lib/utils/dateFnsLocale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import toast from 'react-hot-toast';

import GrantUsersSection from '@/components/Admin/GrantUsersSection/GrantUsersSection';
import UsersMultiSelect from '@/components/Admin/UsersMultiSelect/UsersMultiSelect';
import WarehouseUnitsManager from '@/components/Admin/WarehouseUnitsManager/WarehouseUnitsManager';
import WarehouseCategoriesManager from '@/components/Admin/WarehouseCategoriesManager/WarehouseCategoriesManager';
import WarehouseAccessManager from '@/components/Admin/WarehouseAccessManager/WarehouseAccessManager';
import WarehouseWarehousesManager from '@/components/Admin/WarehouseWarehousesManager/WarehouseWarehousesManager';
import Button from '@/components/UI/Button/Button';
import DatePickerInput from '@/components/UI/DatePickerInput/DatePickerInput';
import Input from '@/components/UI/Input/Input';
import Loader from '@/components/UI/Loader/Loader';
import NoFound from '@/components/UI/NoFound/NoFound';
import SelectDropdown from '@/components/UI/SelectDropdown/SelectDropdown';
import TimePickerInput from '@/components/UI/TimePickerInput/TimePickerInput';
import Toggle from '@/components/UI/Toggle/Toggle';
import { TIMEZONES } from '@/constants/timezones';
import { getAnnouncementAuthors } from '@/lib/api/announcements';
import { getMessageSenders } from '@/lib/api/messages';
import {
  fetchFullSystemSettings,
  updateSystemSettings,
  type BachecaSettings,
  type DaySchedule,
  type MaintenanceSettings,
  type RetentionSettings,
  type WarehouseSettings,
  type WeekDayKey,
  type WeekSchedule,
} from '@/lib/api/systemSettings';
import {
  getWarehouseManagers,
  getWarehouseOperators,
} from '@/lib/api/warehouse';
import css from './SystemSettings.module.css';

// Monday-first weekday order; values are JS getDay() codes
// (0 = Sunday). workDays defaults to [1..5] = Mon–Fri.
const WEEK_DAYS: { value: number; key: string }[] = [
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
  { value: 0, key: 'sun' },
];

const AdminSystemSettingsClientPage = () => {
  const t = useTranslations('AdminPage.SystemSettings');

  const tNoFound = useTranslations('NoFound');
  const tRoles = useTranslations('Roles');
  const locale = getDateFnsLocale(useLocale());

  // Role filter options for the announcements grant section (admins are
  // excluded — they can always publish).
  const grantRoleOptions = [
    { value: 'manager' as const, label: tRoles('manager') },
    { value: 'maintenanceWorker' as const, label: tRoles('maintenanceWorker') },
    { value: 'operator' as const, label: tRoles('operator') },
    { value: 'safety' as const, label: tRoles('safety') },
  ];
  const queryClient = useQueryClient();

  const [timezone, setTimezone] = useState('');
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null);
  const [slotDuration, setSlotDuration] = useState(30);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [newHoliday, setNewHoliday] = useState('');
  const [retention, setRetention] = useState<RetentionSettings>({
    auditLogDays: 90,
    completedFaultsArchiveMonths: null,
  });
  const [bacheca, setBacheca] = useState<BachecaSettings>({
    showAllFaults: false,
    recentFaultsDays: 30,
  });
  const [maintenance, setMaintenance] = useState<MaintenanceSettings>({
    overtimeAlertHours: 2,
  });
  const [warehouse, setWarehouse] = useState<WarehouseSettings>({
    enabled: false,
    lowStock: { notify: false, userIds: [] },
    labels: { qr: true, barcode: true },
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['systemSettings', 'full'],
    queryFn: fetchFullSystemSettings,
    refetchOnWindowFocus: false,
  });

  // Seed local editable state once the settings arrive. Done during render
  // instead of in an effect: the reset belongs to the same pass that first
  // sees the new data, so React never commits the stale form.
  const [seededData, setSeededData] = useState<typeof data>(undefined);
  if (data && data !== seededData) {
    setSeededData(data);
    setTimezone(data.timezone);
    setWeekSchedule(data.weekSchedule);
    setSlotDuration(data.slotDurationMinutes);
    setHolidays((data.holidays ?? []).map(h => String(h).slice(0, 10)));
    setRetention(data.retention);
    setBacheca(data.bacheca ?? { showAllFaults: false, recentFaultsDays: 30 });
    setMaintenance(data.maintenance ?? { overtimeAlertHours: 2 });
    setWarehouse({
      enabled: data.warehouse?.enabled ?? false,
      lowStock: data.warehouse?.lowStock ?? { notify: false, userIds: [] },
      labels: data.warehouse?.labels ?? { qr: true, barcode: true },
    });
  }

  const mutation = useMutation({
    mutationFn: updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      toast.success(t('messages.saved'));
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : t('messages.error');
      toast.error(message);
    },
  });

  if (isLoading || !data) {
    return (
      <section className="admin_section">
        <div className={css.loaderWrap}>
          <Loader />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="admin_section">
        <NoFound
          title={tNoFound('serverErrorTitle')}
          message={tNoFound('serverErrorMessage')}
          hideIcon
        />
      </section>
    );
  }

  // Off / 24h (00:00–23:59) / custom hours — the three per-day modes.
  const dayMode = (d: DaySchedule): 'off' | 'full' | 'hours' => {
    if (!d.enabled) return 'off';
    if (d.start === '00:00' && d.end === '23:59') return 'full';
    return 'hours';
  };

  const setDayMode = (key: WeekDayKey, mode: 'off' | 'full' | 'hours') => {
    setWeekSchedule(prev => {
      if (!prev) return prev;
      const cur = prev[key];
      let next: DaySchedule;
      if (mode === 'off') next = { ...cur, enabled: false };
      else if (mode === 'full')
        next = { enabled: true, start: '00:00', end: '23:59' };
      else
        next = {
          enabled: true,
          start: cur.start && cur.start !== '00:00' ? cur.start : '08:00',
          end: cur.end && cur.end !== '23:59' ? cur.end : '17:00',
        };
      return { ...prev, [key]: next };
    });
  };

  const setDayTime = (
    key: WeekDayKey,
    field: 'start' | 'end',
    value: string
  ) => {
    setWeekSchedule(prev =>
      prev ? { ...prev, [key]: { ...prev[key], [field]: value } } : prev
    );
  };

  const addHoliday = () => {
    if (!newHoliday || holidays.includes(newHoliday)) return;
    setHolidays(prev => [...prev, newHoliday].sort());
    setNewHoliday('');
  };

  const removeHoliday = (date: string) => {
    setHolidays(prev => prev.filter(d => d !== date));
  };

  const formatHoliday = (iso: string) => {
    const parsed = parseISO(iso);
    return isValid(parsed) ? format(parsed, 'dd MMMM yyyy', { locale }) : iso;
  };

  const onSave = () => {
    mutation.mutate({
      timezone,
      ...(weekSchedule ? { weekSchedule } : {}),
      slotDurationMinutes: slotDuration,
      holidays,
      retention,
      bacheca,
      maintenance,
      warehouse,
    });
  };

  return (
    <section className="admin_section">
      <div className={css.header}>
        <h1 className="title">{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>

      {/* ── Time & schedule ────────────────────────────────────── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('schedule.section')}</h2>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('schedule.timezone')}</label>
          <div className={css.selectWrap}>
            <SelectDropdown
              options={TIMEZONES}
              selectedValue={timezone}
              onSelect={setTimezone}
            />
          </div>
        </div>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('schedule.weekTitle')}</label>
          <div className={css.week}>
            {weekSchedule &&
              WEEK_DAYS.map(d => {
                const key = d.key as WeekDayKey;
                const day = weekSchedule[key];
                const mode = dayMode(day);
                return (
                  <div key={key} className={css.weekRow}>
                    <span className={css.weekDayName}>
                      {t(`weekDays.${d.key}`)}
                    </span>
                    <div className={css.modeGroup}>
                      {(['off', 'full', 'hours'] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          className={`${css.modeBtn} ${
                            mode === m ? css.modeBtnActive : ''
                          }`}
                          onClick={() => setDayMode(key, m)}
                        >
                          {t(`schedule.mode.${m}`)}
                        </button>
                      ))}
                    </div>
                    {mode === 'hours' && (
                      <div className={css.weekTimes}>
                        <div className={css.timePickerBox}>
                          <TimePickerInput
                            value={day.start}
                            onChange={v => setDayTime(key, 'start', v)}
                          />
                        </div>
                        <span className={css.weekDash}>–</span>
                        <div className={css.timePickerBox}>
                          <TimePickerInput
                            value={day.end}
                            onChange={v => setDayTime(key, 'end', v)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('schedule.slotDuration')}</label>
          <Input
            type="number"
            min={5}
            max={240}
            value={slotDuration}
            onChange={e => setSlotDuration(Number(e.target.value))}
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>
      </div>

      {/* ── Holidays ───────────────────────────────────────────── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('holidays.section')}</h2>

        <div className={css.holidayAdd}>
          <div className={css.holidayPicker}>
            <DatePickerInput
              value={newHoliday}
              onChange={setNewHoliday}
              placeholder={t('holidays.pickDate')}
            />
          </div>
          <Button
            type="button"
            className="button button--white"
            height={36}
            onClick={addHoliday}
          >
            {t('holidays.add')}
          </Button>
        </div>

        {holidays.length === 0 ? (
          <p className={css.empty}>{t('holidays.empty')}</p>
        ) : (
          <ul className={css.holidayList}>
            {holidays.map(h => (
              <li key={h} className={css.holidayItem}>
                <span>{formatHoliday(h)}</span>
                <button
                  type="button"
                  className={css.holidayRemove}
                  onClick={() => removeHoliday(h)}
                  aria-label={t('holidays.remove')}
                >
                  <svg width="14" height="14">
                    <use href="/sprite.svg#close" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Retention ──────────────────────────────────────────── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('retention.section')}</h2>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('retention.auditLog')}</label>
          <Input
            type="number"
            min={1}
            max={3650}
            value={retention.auditLogDays}
            onChange={e =>
              setRetention({
                ...retention,
                auditLogDays: Number(e.target.value),
              })
            }
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>

        <div className={css.field}>
          <label className={css.fieldLabel}>
            {t('retention.archiveMonths')}
          </label>
          <Input
            type="number"
            min={1}
            max={120}
            value={retention.completedFaultsArchiveMonths ?? ''}
            placeholder={t('retention.archiveNever')}
            onChange={e =>
              setRetention({
                ...retention,
                completedFaultsArchiveMonths: e.target.value
                  ? Number(e.target.value)
                  : null,
              })
            }
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>
      </div>

      {/* ── Maintenance — technician overtime alert ─────────────── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('maintenance.section')}</h2>

        <div className={css.field}>
          <label className={css.fieldLabel}>
            {t('maintenance.overtimeHours')}
          </label>
          <Input
            type="number"
            min={0}
            max={168}
            value={maintenance.overtimeAlertHours}
            onChange={e =>
              setMaintenance({
                ...maintenance,
                overtimeAlertHours: Number(e.target.value),
              })
            }
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            {t('maintenance.overtimeHint')}
          </p>
        </div>
      </div>

      {/* ── Bacheca — recent-faults window on the public board ──── */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('bacheca.section')}</h2>

        <div className={css.field}>
          <Toggle
            id="bacheca-show-all"
            checked={bacheca.showAllFaults}
            onChange={checked =>
              setBacheca({ ...bacheca, showAllFaults: checked })
            }
            label={t('bacheca.showAll')}
          />
        </div>

        <div className={css.field}>
          <label className={css.fieldLabel}>{t('bacheca.recentDays')}</label>
          <Input
            type="number"
            min={1}
            max={3650}
            value={bacheca.recentFaultsDays}
            disabled={bacheca.showAllFaults}
            onChange={e =>
              setBacheca({
                ...bacheca,
                recentFaultsDays: Number(e.target.value),
              })
            }
            style={{
              height: '36px',
              borderRadius: '6px',
              background: '#f3f3f5',
              border: 'none',
              maxWidth: '160px',
            }}
          />
        </div>
      </div>

      {/* ── Permissions — who can publish announcements ────────── */}
      <div className={css.card}>
        <GrantUsersSection
          title={t('permissions.announcements.section')}
          subtitle={t('permissions.announcements.subtitle')}
          selectUserPlaceholder={t('permissions.announcements.selectUser')}
          emptyText={t('permissions.announcements.empty')}
          revokeLabel={t('permissions.announcements.revoke')}
          successGranted={t('permissions.announcements.granted')}
          successRevoked={t('permissions.announcements.revoked')}
          errorText={t('permissions.announcements.error')}
          permissionKey="canCreateAnnouncements"
          grantedQueryKey={['announcements', 'authors']}
          fetchGranted={getAnnouncementAuthors}
          roleFilterLabel={t('permissions.roleFilter')}
          allRolesLabel={tRoles('all')}
          roleOptions={grantRoleOptions}
        />
      </div>

      {/* ── Permissions — which operators can send direct messages ─ */}
      <div className={css.card}>
        <GrantUsersSection
          title={t('permissions.messages.section')}
          subtitle={t('permissions.messages.subtitle')}
          selectUserPlaceholder={t('permissions.messages.selectUser')}
          emptyText={t('permissions.messages.empty')}
          revokeLabel={t('permissions.messages.revoke')}
          successGranted={t('permissions.messages.granted')}
          successRevoked={t('permissions.messages.revoked')}
          errorText={t('permissions.messages.error')}
          permissionKey="canSendMessages"
          grantedQueryKey={['messages', 'allowed-senders']}
          fetchGranted={getMessageSenders}
          fixedRole="operator"
        />
      </div>

      {/* ── Warehouse — module toggle + who can use it (one card) ─ */}
      <div className={css.card}>
        <h2 className={css.cardTitle}>{t('warehouse.section')}</h2>
        <div className={css.field}>
          <Toggle
            id="warehouse-enabled"
            checked={warehouse.enabled}
            onChange={checked => setWarehouse({ enabled: checked })}
            label={t('warehouse.enabledLabel')}
          />
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            {t('warehouse.enabledHint')}
          </p>
        </div>

        {warehouse.enabled && (
          <>
            <div className={css.field}>
              <Toggle
                id="warehouse-lowstock-notify"
                checked={warehouse.lowStock?.notify ?? false}
                onChange={checked =>
                  setWarehouse({
                    ...warehouse,
                    lowStock: {
                      notify: checked,
                      userIds: warehouse.lowStock?.userIds ?? [],
                    },
                  })
                }
                label={t('warehouse.lowStockNotify')}
              />
              <p
                style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}
              >
                {t('warehouse.lowStockHint')}
              </p>
            </div>

            {warehouse.lowStock?.notify && (
              <div className={css.field}>
                <label className={css.fieldLabel}>
                  {t('warehouse.lowStockUsers')}
                </label>
                <UsersMultiSelect
                  selectedIds={warehouse.lowStock?.userIds ?? []}
                  onChange={ids =>
                    setWarehouse({
                      ...warehouse,
                      lowStock: {
                        notify: warehouse.lowStock?.notify ?? true,
                        userIds: ids,
                      },
                    })
                  }
                  placeholder={t('warehouse.lowStockUsersPlaceholder')}
                  emptyText={t('warehouse.lowStockUsersEmpty')}
                  removeLabel={t('warehouse.lowStockUsersRemove')}
                />
              </div>
            )}

            <div className={css.field}>
              <label className={css.fieldLabel}>
                {t('warehouse.labelsSection')}
              </label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '6px',
                }}
              >
                <Toggle
                  id="warehouse-label-qr"
                  checked={warehouse.labels?.qr ?? true}
                  onChange={checked =>
                    setWarehouse({
                      ...warehouse,
                      labels: {
                        qr: checked,
                        barcode: warehouse.labels?.barcode ?? true,
                      },
                    })
                  }
                  label={t('warehouse.labelQr')}
                />
                <Toggle
                  id="warehouse-label-barcode"
                  checked={warehouse.labels?.barcode ?? true}
                  onChange={checked =>
                    setWarehouse({
                      ...warehouse,
                      labels: {
                        qr: warehouse.labels?.qr ?? true,
                        barcode: checked,
                      },
                    })
                  }
                  label={t('warehouse.labelBarcode')}
                />
              </div>
            </div>

            <div className={css.field}>
              <WarehouseWarehousesManager />
            </div>
            <div className={css.field}>
              <WarehouseUnitsManager />
            </div>
            <div className={css.field}>
              <WarehouseCategoriesManager />
            </div>

            <GrantUsersSection
              title={t('permissions.warehouseManage.section')}
              subtitle={t('permissions.warehouseManage.subtitle')}
              selectUserPlaceholder={t(
                'permissions.warehouseManage.selectUser'
              )}
              emptyText={t('permissions.warehouseManage.empty')}
              revokeLabel={t('permissions.warehouseManage.revoke')}
              successGranted={t('permissions.warehouseManage.granted')}
              successRevoked={t('permissions.warehouseManage.revoked')}
              errorText={t('permissions.warehouseManage.error')}
              permissionKey="canManageWarehouse"
              grantedQueryKey={['warehouse', 'managers']}
              fetchGranted={getWarehouseManagers}
              roleFilterLabel={t('permissions.roleFilter')}
              allRolesLabel={tRoles('all')}
              roleOptions={grantRoleOptions}
            />
            <GrantUsersSection
              title={t('permissions.warehouseOperate.section')}
              subtitle={t('permissions.warehouseOperate.subtitle')}
              selectUserPlaceholder={t(
                'permissions.warehouseOperate.selectUser'
              )}
              emptyText={t('permissions.warehouseOperate.empty')}
              revokeLabel={t('permissions.warehouseOperate.revoke')}
              successGranted={t('permissions.warehouseOperate.granted')}
              successRevoked={t('permissions.warehouseOperate.revoked')}
              errorText={t('permissions.warehouseOperate.error')}
              permissionKey="canOperateWarehouse"
              grantedQueryKey={['warehouse', 'operators']}
              fetchGranted={getWarehouseOperators}
              roleFilterLabel={t('permissions.roleFilter')}
              allRolesLabel={tRoles('all')}
              roleOptions={grantRoleOptions}
            />

            <WarehouseAccessManager />
          </>
        )}
      </div>

      <div className={css.actions}>
        <Button
          type="button"
          className="button button--blue"
          onClick={onSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? t('messages.saving') : t('save')}
        </Button>
      </div>
    </section>
  );
};

export default AdminSystemSettingsClientPage;
