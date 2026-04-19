import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Training, Category, Coach, PagedResult } from '../../types';

const emptyForm = {
  categoryId: 0, trainerId: '', description: '',
  startTime: '', maxParticipants: 20,
};

export default function AdminTrainingsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Training[]>([]);
  const [total, setTotal] = useState(0);
  const [pm, setPm] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainers, setTrainers] = useState<Coach[]>([]);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    api.get<Category[]>('/categories').then(({ data }) => setCategories(data));
    api.get<Coach[]>('/coaches').then(({ data }) => setTrainers(data));
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<Training>>('/trainings', {
        params: { page: pm.page + 1, pageSize: pm.pageSize },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch { notify('Ошибка загрузки', 'error'); }
  }, [pm]);

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

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'description', headerName: 'Описание', flex: 1 },
    { field: 'categoryName', headerName: 'Категория', width: 120 },
    { field: 'trainerName', headerName: 'Тренер', width: 180 },
    {
      field: 'startTime', headerName: 'Дата/время', width: 160,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm'),
    },
    { field: 'maxParticipants', headerName: 'Макс.', width: 70, type: 'number' },
    { field: 'currentParticipants', headerName: 'Занято', width: 70, type: 'number' },
    {
      field: 'actions', headerName: '', width: 160, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Edit />} onClick={() => openEdit(params.row)}>Ред.</Button>
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
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={total}
          paginationMode="server" pageSizeOptions={[10, 25]}
          paginationModel={pm} onPaginationModelChange={setPm} />
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
    </>
  );
}
