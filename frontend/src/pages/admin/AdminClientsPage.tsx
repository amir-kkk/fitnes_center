import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Add, ContentCopy, Key, MoreVert, Visibility, VisibilityOff } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { ClientListItem, Membership, PagedResult, PersonalWorkoutSlot, TrainerListItem } from '../../types';
import { formatPhone, normalizePhoneInput } from '../../utils/phone';

type ClientRow = ClientListItem;

const displayText = (value?: string | null, fallback = 'Не указано') => {
  const v = (value ?? '').trim();
  return v.length > 0 ? v : fallback;
};

export default function AdminClientsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activeClient, setActiveClient] = useState<ClientRow | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [assignMembershipOpen, setAssignMembershipOpen] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState<Membership | null>(null);

  const [assignPersonalOpen, setAssignPersonalOpen] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerListItem | null>(null);
  const [trainerFreeSlots, setTrainerFreeSlots] = useState<PersonalWorkoutSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' });

  const fetchClients = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<ClientRow>>('/admin/clients', {
        params: { page: paginationModel.page + 1, pageSize: paginationModel.pageSize, search },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch {
      notify('Ошибка загрузки клиентов', 'error');
    }
  }, [notify, paginationModel, search]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  useEffect(() => {
    api.get<PagedResult<Membership>>('/memberships', { params: { page: 1, pageSize: 500 } })
      .then(({ data }) => setMemberships(data.items))
      .catch(() => notify('Ошибка загрузки абонементов', 'error'));
    api.get<TrainerListItem[]>('/workouts/trainers')
      .then(({ data }) => setTrainers(data))
      .catch(() => notify('Ошибка загрузки тренеров', 'error'));
  }, [notify]);

  const openMenu = (event: React.MouseEvent<HTMLElement>, row: ClientRow) => {
    setMenuAnchor(event.currentTarget);
    setActiveClient(row);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const generatePassword = (target: 'create' | 'change') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let out = '';
    for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    if (target === 'create') setCreateForm((prev) => ({ ...prev, password: out, confirmPassword: out }));
    else setPasswordForm({ password: out, confirmPassword: out });
  };

  const copyPassword = async (value: string) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    notify('Пароль скопирован', 'success');
  };

  const createClient = async () => {
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      notify('Заполните обязательные поля', 'warning');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      notify('Пароли не совпадают', 'warning');
      return;
    }
    try {
      await api.post('/admin/users', {
        fullName: createForm.fullName.trim(),
        phoneNumber: normalizePhoneInput(createForm.phoneNumber),
        email: createForm.email.trim(),
        password: createForm.password,
      });
      notify('Клиент создан', 'success');
      setCreateOpen(false);
      setCreateForm({ fullName: '', phoneNumber: '', email: '', password: '', confirmPassword: '' });
      fetchClients();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка создания клиента', 'error');
    }
  };

  const assignMembership = async () => {
    if (!activeClient || !selectedMembership) {
      notify('Выберите абонемент', 'warning');
      return;
    }
    try {
      await api.post('/admin/memberships/assign', {
        userId: activeClient.id,
        membershipId: selectedMembership.id,
      });
      notify('Абонемент оформлен и оплачен', 'success');
      setAssignMembershipOpen(false);
      setSelectedMembership(null);
      fetchClients();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка оформления абонемента', 'error');
    }
  };

  const loadSlotsForTrainer = async (trainer: TrainerListItem | null) => {
    setSelectedTrainer(trainer);
    setSelectedSlotId(null);
    if (!trainer) {
      setTrainerFreeSlots([]);
      return;
    }
    try {
      const { data } = await api.get<PersonalWorkoutSlot[]>(`/workouts/trainer/${trainer.id}/slots`);
      setTrainerFreeSlots(data);
    } catch {
      notify('Ошибка загрузки свободных слотов', 'error');
    }
  };

  const assignPersonalWorkout = async () => {
    if (!activeClient || !selectedTrainer || !selectedSlotId) {
      notify('Выберите тренера и свободный слот', 'warning');
      return;
    }
    try {
      await api.post('/admin/personal-workouts/assign', {
        clientId: activeClient.id,
        trainerId: selectedTrainer.id,
        slotId: selectedSlotId,
      });
      notify('Персональная тренировка назначена и оплачена', 'success');
      setAssignPersonalOpen(false);
      setSelectedTrainer(null);
      setTrainerFreeSlots([]);
      setSelectedSlotId(null);
      fetchClients();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка назначения тренировки', 'error');
    }
  };

  const changePassword = async () => {
    if (!activeClient) return;
    if (!passwordForm.password) {
      notify('Введите пароль', 'warning');
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      notify('Пароли не совпадают', 'warning');
      return;
    }
    try {
      await api.post(`/admin/users/${activeClient.id}/password`, { password: passwordForm.password });
      notify('Пароль клиента изменен', 'success');
      setChangePasswordOpen(false);
      setPasswordForm({ password: '', confirmPassword: '' });
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка смены пароля', 'error');
    }
  };

  const membershipLabel = (row: ClientRow) => {
    if (row.membershipStatus === 'Paid') return row.membershipName ? `${row.membershipName} (Оплачен)` : 'Оплачен';
    if (row.membershipStatus === 'Reserved') return row.membershipName ? `${row.membershipName} (Забронирован)` : 'Забронирован';
    return 'Нет абонемента';
  };

  const columns = useMemo<GridColDef[]>(() => [
    {
      field: 'fullName',
      headerName: 'ФИО',
      flex: 1,
      minWidth: 190,
      renderCell: (params) => displayText(params.value),
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => displayText(params.value),
    },
    {
      field: 'phoneNumber',
      headerName: 'Телефон',
      width: 170,
      renderCell: (params) => formatPhone(params.value),
    },
    {
      field: 'membershipStatus',
      headerName: 'Активный абонемент',
      flex: 1,
      minWidth: 220,
      renderCell: (params) => membershipLabel(params.row as ClientRow),
      sortable: false,
    },
    {
      field: 'actions',
      headerName: '',
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <IconButton onClick={(e) => openMenu(e, params.row as ClientRow)}>
          <MoreVert />
        </IconButton>
      ),
    },
  ], []);

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Клиенты</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Добавить учетную запись
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="Поиск по email и имени"
        sx={{ mb: 2, width: 360 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Box sx={{ height: 'calc(100vh - 260px)', minHeight: 480 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          rowCount={total}
          paginationMode="server"
          pageSizeOptions={[10, 25, 50]}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          disableRowSelectionOnClick
        />
      </Box>

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            closeMenu();
            setAssignMembershipOpen(true);
          }}
        >
          Оформить абонемент
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setAssignPersonalOpen(true);
          }}
        >
          Записать на персональную тренировку
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setChangePasswordOpen(true);
          }}
        >
          Сменить пароль
        </MenuItem>
      </Menu>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новая учетная запись клиента</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="ФИО" required value={createForm.fullName}
              onChange={(e) => setCreateForm((p) => ({ ...p, fullName: e.target.value }))} />
            <TextField label="Телефон" value={createForm.phoneNumber}
              onChange={(e) => setCreateForm((p) => ({ ...p, phoneNumber: e.target.value }))} />
            <TextField label="Email" type="email" required value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} />
            <TextField
              label="Пароль"
              required
              type={showPassword ? 'text' : 'password'}
              value={createForm.password}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((x) => !x)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton onClick={() => generatePassword('create')}>
                      <Key />
                    </IconButton>
                    <IconButton onClick={() => copyPassword(createForm.password)}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Подтверждение пароля"
              required
              type={showPassword ? 'text' : 'password'}
              value={createForm.confirmPassword}
              onChange={(e) => setCreateForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={createClient}>Создать</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignMembershipOpen} onClose={() => setAssignMembershipOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Оформить абонемент</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Клиент: {displayText(activeClient?.fullName)}
          </Typography>
          <Autocomplete
            options={memberships}
            value={selectedMembership}
            onChange={(_, v) => setSelectedMembership(v)}
            getOptionLabel={(o) => `${o.name} (${o.price} ₽)`}
            renderInput={(params) => <TextField {...params} label="Абонемент" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignMembershipOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={assignMembership}>Оформить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignPersonalOpen} onClose={() => setAssignPersonalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Записать на персональную тренировку</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Клиент: {displayText(activeClient?.fullName)}
          </Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={trainers}
              value={selectedTrainer}
              onChange={(_, v) => loadSlotsForTrainer(v)}
              getOptionLabel={(o) => `${displayText(o.fullName)} (${formatPhone(o.phoneNumber)})`}
              renderInput={(params) => <TextField {...params} label="Тренер" />}
            />
            <TextField
              select
              label="Свободный слот"
              value={selectedSlotId ?? ''}
              onChange={(e) => setSelectedSlotId(Number(e.target.value))}
            >
              {trainerFreeSlots.map((slot) => (
                <MenuItem key={slot.id} value={slot.id}>
                  {dayjs(slot.dateTime).format('DD.MM.YYYY HH:mm')} — {slot.price} ₽
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignPersonalOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={assignPersonalWorkout}>Записать</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Смена пароля клиента</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Клиент: {displayText(activeClient?.fullName)}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Новый пароль"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.password}
              onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((x) => !x)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton onClick={() => generatePassword('change')}>
                      <Key />
                    </IconButton>
                    <IconButton onClick={() => copyPassword(passwordForm.password)}>
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Подтверждение пароля"
              type={showPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={changePassword}>Сохранить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

