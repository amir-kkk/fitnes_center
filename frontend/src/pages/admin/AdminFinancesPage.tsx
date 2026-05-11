import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Menu,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { PagedResult, PersonalWorkoutSlot, Purchase } from '../../types';
import { formatPhone } from '../../utils/phone';

const purchaseStatusLabel = (status: string) => (status === 'Paid' ? 'Оплачен' : 'Забронирован');
const workoutStatusLabel = (status: string) => {
  if (status === 'Available') return 'Свободно';
  if (status === 'BookedUnpaid') return 'Забронирована';
  if (status === 'Paid') return 'Оплачена';
  if (status === 'Completed') return 'Проведена';
  if (status === 'NotCompleted') return 'Не проведена';
  return status;
};

const normalizePurchaseStatus = (value?: string | null) => {
  const v = (value ?? '').trim().toLowerCase();
  if (v === 'paid' || v === 'оплачен' || v === 'оплачено') return 'paid';
  if (v === 'reserved' || v === 'забронирован' || v === 'забронировано') return 'reserved';
  return v;
};

const normalizeWorkoutStatus = (value?: string | null) => {
  const v = (value ?? '').trim().toLowerCase();
  if (v === 'available' || v === 'свободно') return 'available';
  if (v === 'bookedunpaid' || v === 'забронирована' || v === 'не оплачено') return 'bookedunpaid';
  if (v === 'paid' || v === 'оплачена' || v === 'оплачено') return 'paid';
  if (v === 'completed' || v === 'проведена') return 'completed';
  if (v === 'notcompleted' || v === 'не проведена') return 'notcompleted';
  return v;
};

export default function AdminFinancesPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [tab, setTab] = useState(0);
  const [onlyAwaiting, setOnlyAwaiting] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [workouts, setWorkouts] = useState<PersonalWorkoutSlot[]>([]);

  const onlyAwaitingEffectiveForPurchases = onlyAwaiting && statusFilter === 'all' && tab === 0;
  const onlyAwaitingEffectiveForWorkouts = onlyAwaiting && statusFilter === 'all' && tab === 1;

  const loadData = async () => {
    try {
      const [pRes, wRes] = await Promise.all([
        api.get<PagedResult<Purchase>>('/purchases', { params: { page: 1, pageSize: 500 } }),
        api.get<PagedResult<PersonalWorkoutSlot>>('/admin/personal-workouts', { params: { page: 1, pageSize: 500 } }),
      ]);
      setPurchases(pRes.data.items);
      setWorkouts(wRes.data.items);
    } catch {
      notify('Ошибка загрузки финансовых данных', 'error');
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setStatusFilter('all'); }, [tab]);

  const statusOptions = tab === 0
    ? [
        { value: 'all', label: 'Все' },
        { value: 'reserved', label: 'Забронирован' },
        { value: 'paid', label: 'Оплачен' },
      ]
    : [
        { value: 'all', label: 'Все' },
        { value: 'bookedunpaid', label: 'Забронирована' },
        { value: 'paid', label: 'Оплачена' },
        { value: 'completed', label: 'Проведена' },
        { value: 'notcompleted', label: 'Не проведена' },
      ];

  const statusLabel = statusOptions.find((x) => x.value === statusFilter)?.label ?? 'Все';

  const filteredPurchases = useMemo(() => {
    const q = search.toLowerCase();
    return purchases
      .filter((p) => {
        const status = normalizePurchaseStatus(p.status);
        if (onlyAwaitingEffectiveForPurchases && status !== 'reserved') return false;
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (!q) return true;
        return (
          (p.userFullName ?? '').toLowerCase().includes(q) ||
          (p.userEmail ?? '').toLowerCase().includes(q) ||
          (p.membershipName ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }, [purchases, onlyAwaitingEffectiveForPurchases, statusFilter, search]);

  const filteredWorkouts = useMemo(() => {
    const q = search.toLowerCase();
    return workouts
      .filter((w) => {
        const status = normalizeWorkoutStatus(w.status);
        // Во вкладке "Финансы" свободные слоты не участвуют в выборке.
        if (status === 'available') return false;
        if (onlyAwaitingEffectiveForWorkouts && status !== 'bookedunpaid') return false;
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (!q) return true;
        return (
          (w.clientName ?? '').toLowerCase().includes(q) ||
          (w.trainerName ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => dayjs(b.dateTime).valueOf() - dayjs(a.dateTime).valueOf());
  }, [workouts, onlyAwaitingEffectiveForWorkouts, statusFilter, search]);

  const confirmPurchase = async (id: number) => {
    try {
      await api.post(`/purchases/${id}/pay`);
      notify('Оплата абонемента подтверждена', 'success');
      loadData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка подтверждения оплаты', 'error');
    }
  };

  const confirmWorkout = async (id: number) => {
    try {
      await api.post(`/admin/personal-workouts/${id}/confirm-payment`);
      notify('Оплата персональной тренировки подтверждена', 'success');
      loadData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка подтверждения оплаты', 'error');
    }
  };

  const purchaseColumns: GridColDef[] = [
    { field: 'userFullName', headerName: 'ФИО', flex: 1, minWidth: 180 },
    { field: 'membershipName', headerName: 'Тариф', flex: 1, minWidth: 170 },
    {
      field: 'priceAtPurchase', headerName: 'Цена', width: 120,
      valueFormatter: (p) => `${p.value} ₽`,
    },
    {
      field: 'status', headerName: 'Статус', width: 140,
      renderCell: (p) => <Chip size="small" label={purchaseStatusLabel(p.value)} color={p.value === 'Paid' ? 'success' : 'warning'} />,
    },
    {
      field: 'actions', headerName: 'Действия', width: 200, sortable: false,
      renderCell: (p) => (
        <Button variant="contained" size="small" disabled={p.row.status === 'Paid'} onClick={() => confirmPurchase(p.row.id)}>
          Подтвердить оплату
        </Button>
      ),
    },
  ];

  const workoutColumns: GridColDef[] = [
    { field: 'clientName', headerName: 'Клиент', flex: 1, minWidth: 170 },
    { field: 'trainerName', headerName: 'Тренер', flex: 1, minWidth: 170 },
    {
      field: 'clientPhone', headerName: 'Телефон клиента', width: 160,
      renderCell: (p) => formatPhone(p.value),
    },
    {
      field: 'dateTime', headerName: 'Дата слота', width: 170,
      valueFormatter: (p) => dayjs(p.value).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'status', headerName: 'Статус', width: 150,
      renderCell: (p) => <Chip size="small" label={workoutStatusLabel(p.value)} color={p.value === 'Paid' ? 'success' : 'warning'} />,
    },
    {
      field: 'actions', headerName: 'Действия', width: 200, sortable: false,
      renderCell: (p) => (
        <Button variant="contained" size="small" disabled={p.row.status !== 'BookedUnpaid'} onClick={() => confirmWorkout(p.row.id)}>
          Подтвердить оплату
        </Button>
      ),
    },
  ];

  return (
    <>
      <Typography variant="h5" mb={2}>Финансы</Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Абонементы" />
        <Tab label="Персональные тренировки" />
      </Tabs>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2} alignItems={{ md: 'center' }}>
        <FormControlLabel
          control={<Checkbox checked={onlyAwaiting} onChange={(e) => setOnlyAwaiting(e.target.checked)} />}
          label="Только ожидающие оплаты"
        />
        <Button
          variant="outlined"
          size="small"
          endIcon={<ArrowDropDownIcon />}
          onClick={(e) => setStatusAnchorEl(e.currentTarget)}
          sx={{ minWidth: 220, justifyContent: 'space-between' }}
        >
          {`Статус: ${statusLabel}`}
        </Button>
        <Menu
          anchorEl={statusAnchorEl}
          open={Boolean(statusAnchorEl)}
          onClose={() => setStatusAnchorEl(null)}
        >
          {statusOptions.map((option) => (
            <MenuItem
              key={option.value}
              selected={statusFilter === option.value}
              onClick={() => {
                setStatusFilter(option.value);
                setStatusAnchorEl(null);
              }}
            >
              {option.label}
            </MenuItem>
          ))}
        </Menu>
        <TextField
          size="small"
          sx={{ minWidth: 320 }}
          placeholder={tab === 0 ? 'Поиск по ФИО клиента/тарифу' : 'Поиск по ФИО клиента/тренера'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Stack>

      <Typography variant="body2" color="text.secondary" mb={1}>
        Найдено записей: {tab === 0 ? filteredPurchases.length : filteredWorkouts.length}
      </Typography>

      <Box sx={{ height: 'calc(100vh - 320px)', minHeight: 460 }}>
        {tab === 0 ? (
          <DataGrid rows={filteredPurchases} columns={purchaseColumns} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
        ) : (
          <DataGrid rows={filteredWorkouts} columns={workoutColumns} pageSizeOptions={[10, 25, 50]} disableRowSelectionOnClick />
        )}
      </Box>
    </>
  );
}

