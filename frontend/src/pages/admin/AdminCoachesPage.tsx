import { useEffect, useState, useCallback, useRef } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Avatar, MenuItem,
} from '@mui/material';
import { Delete, Edit, PhotoCamera } from '@mui/icons-material';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Coach } from '../../types';

const emptyForm = { fullName: '', trainerRank: 1 };

export default function AdminCoachesPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Coach[]>([]);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<Coach[]>('/coaches');
      setRows(data);
    } catch {
      notify('Ошибка загрузки тренеров', 'error');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = (c: Coach) => {
    setEditId(c.id);
    setForm({ fullName: c.fullName, trainerRank: c.trainerRank });
    setPhotoFile(null);
    setPhotoPreview(c.photoUrl);
    setDlgOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify('Файл слишком большой (макс. 5 МБ)', 'error');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!editId) return;
    try {
      await api.put(`/coaches/${editId}`, {
        fullName: form.fullName,
        trainerRank: form.trainerRank,
      });

      // Загрузка фото отдельным запросом
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/coaches/${editId}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      notify('Тренер обновлён', 'success');
      setDlgOpen(false);
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка сохранения', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Уволить тренера? Это удалит его слоты и тренировки без активных записей.')) return;
    try {
      await api.delete(`/coaches/${id}`);
      notify('Тренер удален', 'success');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка удаления тренера', 'error');
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'photoUrl', headerName: 'Фото', width: 80, sortable: false,
      renderCell: (params) => (
        <Avatar src={params.value || undefined} sx={{ width: 40, height: 40, bgcolor: '#D9D9D9' }}>
          {params.row.fullName?.[0]}
        </Avatar>
      ),
    },
    { field: 'fullName', headerName: 'ФИО', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'trainerRank', headerName: 'Ранг', width: 80, type: 'number' },
    {
      field: 'actions', headerName: 'Действия', width: 220, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Edit />} onClick={() => openEdit(params.row)}
            sx={{ borderRadius: 16 }}>Ред.</Button>
          <Button size="small" color="error" startIcon={<Delete />}
            onClick={() => handleDelete(params.row.id)} sx={{ borderRadius: 16 }}>
            Уволить
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Тренеры</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Управление тренерами выполняется через роль пользователя `Trainer`.
        Здесь администратор задает фото и ранг (1-5), влияющий на стоимость персональной тренировки.
      </Typography>

      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} pageSizeOptions={[10, 25]} />
      </Box>

      {/* Диалог создания/редактирования */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать тренера</DialogTitle>
        <DialogContent>
          {/* Превью и загрузка фото */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={2} mt={1}>
            <Avatar
              src={photoPreview || undefined}
              sx={{ width: 100, height: 100, mb: 1, bgcolor: '#D9D9D9', fontSize: 36 }}
            >
              {form.fullName?.[0] || '?'}
            </Avatar>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden
              ref={fileInputRef} onChange={handleFileSelect} />
            <Button size="small" startIcon={<PhotoCamera />} variant="outlined"
              onClick={() => fileInputRef.current?.click()} sx={{ borderRadius: 20 }}>
              {photoPreview ? 'Заменить фото' : 'Загрузить фото'}
            </Button>
          </Box>

          <TextField label="ФИО тренера" fullWidth margin="dense"
            value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <TextField
            select
            label="Ранг"
            fullWidth
            margin="dense"
            value={form.trainerRank}
            onChange={(e) => setForm({ ...form, trainerRank: Number(e.target.value) })}
          >
            {[1, 2, 3, 4, 5].map((rank) => (
              <MenuItem key={rank} value={rank}>{rank}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.fullName.trim()}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
