import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, FormControl, InputLabel, Select, MenuItem, Autocomplete, Checkbox, FormControlLabel,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Training, Category, Coach, PagedResult, ClientListItem } from '../../types';

const emptyForm = {
  categoryId: 0, trainerId: '', description: '',
  startTime: '', maxParticipants: 20,
};

export default function AdminTrainingsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Training[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainers, setTrainers] = useState<Coach[]>([]);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTrainingId, setAssignTrainingId] = useState<number | null>(null);
  const [assignUser, setAssignUser] = useState<ClientListItem | null>(null);
  const [searchText, setSearchText] = useState('');
  const [onlyUpcoming, setOnlyUpcoming] = useState(true);

  const loadCategories = useCallback(async () => {
    const { data } = await api.get<Category[]>('/categories');
    setCategories(data);
  }, []);

  useEffect(() => {
    loadCategories().catch(() => notify('Ошибка загрузки категорий', 'error'));
    api.get<Coach[]>('/coaches')
      .then(({ data }) => setTrainers(data))
      .catch(() => notify('Ошибка загрузки тренеров', 'error'));
    api.get<PagedResult<ClientListItem>>('/admin/clients', { params: { page: 1, pageSize: 500, search: '' } })
      .then(({ data }) => setClients(data.items.filter((u) => u.membershipStatus === 'Paid')))
      .catch(() => notify('Ошибка загрузки пользователей', 'error'));
  }, [loadCategories, notify]);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<Training>>('/trainings', {
        params: { page: 1, pageSize: 500 },
      });
      setRows(data.items);
    } catch { notify('Ошибка загрузки', 'error'); }
  }, [notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDlgOpen(true); };
  const openEdit = (t: Training) => {
    setEditId(t.id);
    setForm({
      categoryId: t.categoryId, trainerId: t.trainerId, description: t.description,
      startTime: dayjs(t.startTime).format('YYYY-MM-DDTHH:mm'),
      maxParticipants: t.maxParticipants,
    });
    setDlgOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      startTime: new Date(form.startTime).toISOString(),
    };
    try {
      if (editId) await api.put(`/trainings/${editId}`, payload);
      else await api.post('/trainings', payload);
      notify(editId ? 'Обновлено' : 'Создано', 'success');
      setDlgOpen(false);
      fetchData();
    } catch (err: any) { notify(err.response?.data?.detail || 'Ошибка', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тренировку?')) return;
    try {
      await api.delete(`/trainings/${id}`);
      notify('Удалено', 'info');
      fetchData();
    } catch { notify('Ошибка удаления', 'error'); }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const { data } = await api.post<Category>('/categories', { name });
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((prev) => ({ ...prev, categoryId: data.id }));
      setNewCategoryName('');
      notify('Новый вид групповой тренировки добавлен', 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Не удалось добавить категорию', 'error');
    }
  };

  const openAssign = (trainingId: number) => {
    setAssignTrainingId(trainingId);
    setAssignUser(null);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assignUser || !assignTrainingId) {
      notify('Выберите клиента', 'warning');
      return;
    }
    try {
      await api.post('/admin/group-bookings/assign', {
        userId: assignUser.id,
        trainingId: assignTrainingId,
      });
      notify('Клиент записан на групповую тренировку', 'success');
      setAssignOpen(false);
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка записи клиента', 'error');
    }
  };

  const filteredRows = rows.filter((r) => {
    if (onlyUpcoming && dayjs(r.startTime).isBefore(dayjs())) return false;
    if (!searchText.trim()) return true;
    const q = searchText.toLowerCase();
    return r.description.toLowerCase().includes(q) || r.trainerName.toLowerCase().includes(q);
  });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'description', headerName: 'Описание', flex: 1 },
    { field: 'categoryName', headerName: 'Категория', width: 120 },
    { field: 'trainerName', headerName: 'Тренер', width: 250 },
    {
      field: 'startTime', headerName: 'Дата/время', width: 160,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm'),
    },
    { field: 'maxParticipants', headerName: 'Макс.', width: 70, type: 'number' },
    { field: 'currentParticipants', headerName: 'Занято', width: 70, type: 'number' },
    {
      field: 'actions', headerName: '', width: 220, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Edit />} onClick={() => openEdit(params.row)}>Ред.</Button>
          <Button size="small" onClick={() => openAssign(params.row.id)}>Записать</Button>
          <Button size="small" color="error" startIcon={<Delete />}
            onClick={() => handleDelete(params.row.id)}>Уд.</Button>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Тренировки</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Создать</Button>
      </Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
        <TextField
          size="small"
          placeholder="Поиск по тренировкам и тренерам"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ minWidth: 320 }}
        />
        <FormControlLabel
          control={<Checkbox checked={onlyUpcoming} onChange={(e) => setOnlyUpcoming(e.target.checked)} />}
          label="Только предстоящие"
        />
      </Stack>
      <Box sx={{ height: 'calc(100vh - 320px)', minHeight: 480, width: '100%' }}>
        <DataGrid rows={filteredRows} columns={columns}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick />
      </Box>

      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редактировать' : 'Новая'} тренировка</DialogTitle>
        <DialogContent>
          <TextField label="Описание" fullWidth margin="dense"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Stack direction="row" spacing={2} mt={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Категория</InputLabel>
              <Select value={form.categoryId} label="Категория"
                onChange={(e) => setForm({ ...form, categoryId: +e.target.value })}>
                {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Тренер</InputLabel>
              <Select value={form.trainerId} label="Тренер"
                onChange={(e) => setForm({ ...form, trainerId: e.target.value })}>
                {trainers.map((c) => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={1}>
          <TextField
            label="Новый вид тренировки"
            fullWidth
            size="small"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            InputProps={{
              endAdornment: (
                <Button
                  size="small"
                  onClick={handleCreateCategory}
                  disabled={!newCategoryName.trim()}
                  sx={{ whiteSpace: 'nowrap', ml: 1 }}
                >
                  Добавить
                </Button>
              ),
            }}
            />
          </Stack>
          <Stack direction="row" spacing={2} mt={1}>
            <TextField label="Дата и время" type="datetime-local" fullWidth size="small"
              InputLabelProps={{ shrink: true }}
              value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <TextField label="Макс. участников" type="number" fullWidth size="small"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: +e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={!form.description.trim() || !form.trainerId || !form.categoryId || !form.startTime}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Записать клиента на тренировку</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Autocomplete
              options={clients}
              value={assignUser}
              onChange={(_, v) => setAssignUser(v)}
              getOptionLabel={(o) => `${o.fullName} (${o.email})`}
              renderInput={(params) => <TextField {...params} label="Клиент" />}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleAssign}>Записать</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
