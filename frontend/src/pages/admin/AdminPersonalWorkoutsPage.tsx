import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { ClientListItem, PagedResult, PersonalWorkoutSlot, TrainerListItem } from '../../types';
import { formatPhone } from '../../utils/phone';

export default function AdminPersonalWorkoutsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [slots, setSlots] = useState<PersonalWorkoutSlot[]>([]);
  const [users, setUsers] = useState<ClientListItem[]>([]);
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientListItem | null>(null);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerListItem | null>(null);
  const [trainerFreeSlots, setTrainerFreeSlots] = useState<PersonalWorkoutSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [searchText, setSearchText] = useState('');
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const normalizeStatus = (value?: string | null) => (value ?? '').trim().toLowerCase();

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<PersonalWorkoutSlot>>('/admin/personal-workouts', {
        params: { page: 1, pageSize: 500 },
      });
      setSlots(data.items);
    } catch {
      notify('Ошибка загрузки персональных записей', 'error');
    }
  }, [notify]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    api.get<PagedResult<ClientListItem>>('/admin/clients', { params: { page: 1, pageSize: 500, search: '' } })
      .then(({ data }) => setUsers(data.items))
      .catch(() => notify('Ошибка загрузки клиентов', 'error'));
    api.get<TrainerListItem[]>('/workouts/trainers')
      .then(({ data }) => setTrainers(data))
      .catch(() => notify('Ошибка загрузки тренеров', 'error'));
  }, [notify]);

  const rows = useMemo(() => slots.filter((r) => {
    if (onlyUpcoming && dayjs(r.dateTime).isBefore(dayjs())) return false;
    if (statusFilter !== 'all' && normalizeStatus(r.status) !== statusFilter) return false;
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return (r.trainerName ?? '').toLowerCase().includes(q) || (r.clientName ?? '').toLowerCase().includes(q);
  }), [slots, onlyUpcoming, searchText, statusFilter]);

  const handleCancel = async (slotId: number) => {
    if (!confirm('Отменить эту персональную запись?')) return;
    try {
      await api.delete(`/admin/personal-workouts/${slotId}/cancel`);
      notify('Персональная запись отменена', 'success');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка отмены', 'error');
    }
  };

  const handleLoadTrainerSlots = async (trainer: TrainerListItem | null) => {
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
      notify('Ошибка загрузки свободных слотов тренера', 'error');
    }
  };

  const handleAssign = async () => {
    if (!selectedClient || !selectedTrainer || !selectedSlotId) {
      notify('Выберите клиента, тренера и слот', 'warning');
      return;
    }
    try {
      await api.post('/admin/personal-workouts/assign', {
        clientId: selectedClient.id,
        trainerId: selectedTrainer.id,
        slotId: selectedSlotId,
      });
      notify('Клиент записан на персональную тренировку', 'success');
      setAssignOpen(false);
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка назначения', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'trainerName', headerName: 'Тренер', flex: 1 },
    {
      field: 'clientName', headerName: 'Клиент', flex: 1,
      renderCell: (params) => params.row.clientName || '—',
    },
    {
      field: 'clientPhone', headerName: 'Телефон клиента', width: 170,
      renderCell: (params) => formatPhone(params.row.clientPhone),
    },
    {
      field: 'dateTime', headerName: 'Дата', width: 170,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'price', headerName: 'Цена', width: 120,
      valueFormatter: (params) => `${params.value?.toLocaleString()} ₽`,
    },
    {
      field: 'status', headerName: 'Статус', width: 190,
      renderCell: (params) => (
        <Chip
          size="small"
          label={
            params.value === 'Available' ? 'Свободно'
              : params.value === 'BookedUnpaid' ? 'Записан, не оплачено'
                : params.value === 'Paid' ? 'Оплачено'
                  : params.value === 'Completed' ? 'Проведена'
                    : params.value === 'NotCompleted' ? 'Не проведена'
                      : params.value
          }
          color={params.value === 'Completed' ? 'success' : params.value === 'NotCompleted' ? 'error' : 'primary'}
        />
      ),
    },
    {
      field: 'actions', headerName: 'Действия', width: 140, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            color="error"
            disabled={params.row.status === 'Available'}
            onClick={() => handleCancel(params.row.id)}
          >
            Отменить
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Персональные записи</Typography>
        <Button variant="contained" onClick={() => setAssignOpen(true)}>+ Записать клиента</Button>
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder="Поиск по тренерам и клиентам"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 320 }}
        />
        <FormControlLabel
          control={<Checkbox checked={onlyUpcoming} onChange={(e) => setOnlyUpcoming(e.target.checked)} />}
          label="Только предстоящие"
        />
        <FormControl size="small" sx={{ minWidth: 190 }}>
          <InputLabel>Статус</InputLabel>
          <Select value={statusFilter} label="Статус" onChange={(e) => setStatusFilter(String(e.target.value))}>
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="available">Свободно</MenuItem>
            <MenuItem value="bookedunpaid">Не оплачено</MenuItem>
            <MenuItem value="paid">Оплачено</MenuItem>
            <MenuItem value="completed">Проведена</MenuItem>
            <MenuItem value="notcompleted">Не проведена</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Box sx={{ height: 'calc(100vh - 320px)', minHeight: 480 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
        />
      </Box>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить персональную тренировку</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Autocomplete
              options={users}
              value={selectedClient}
              onChange={(_, v) => setSelectedClient(v)}
              getOptionLabel={(o) => `${o.fullName} (${o.email})`}
              renderInput={(params) => <TextField {...params} label="Клиент" />}
            />
            <Autocomplete
              options={trainers}
              value={selectedTrainer}
              onChange={(_, v) => handleLoadTrainerSlots(v)}
              getOptionLabel={(o) => `${o.fullName} (${formatPhone(o.phoneNumber)})`}
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
          <Button onClick={() => setAssignOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleAssign}>Назначить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
