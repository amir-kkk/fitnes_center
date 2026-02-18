import { useEffect, useState, useCallback, useRef } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Avatar, IconButton,
} from '@mui/material';
import { Add, Edit, Delete, PhotoCamera } from '@mui/icons-material';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Coach } from '../../types';

const emptyForm = { fullName: '', specialization: '' };

export default function AdminCoachesPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Coach[]>([]);
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setPhotoFile(null);
    setPhotoPreview(null);
    setDlgOpen(true);
  };

  const openEdit = (c: Coach) => {
    setEditId(c.id);
    setForm({ fullName: c.fullName, specialization: c.specialization || '' });
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
    try {
      let coachId = editId;

      if (editId) {
        await api.put(`/coaches/${editId}`, {
          fullName: form.fullName,
          specialization: form.specialization || null,
        });
      } else {
        const { data } = await api.post('/coaches', {
          fullName: form.fullName,
          photoUrl: null,
          specialization: form.specialization || null,
        });
        coachId = data.id;
      }

      // Загрузка фото отдельным запросом
      if (photoFile && coachId) {
        const formData = new FormData();
        formData.append('file', photoFile);
        await api.post(`/coaches/${coachId}/photo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      notify(editId ? 'Тренер обновлён' : 'Тренер создан', 'success');
      setDlgOpen(false);
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка сохранения', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить тренера?')) return;
    try {
      await api.delete(`/coaches/${id}`);
      notify('Тренер удалён', 'info');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка удаления', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    {
      field: 'photoUrl', headerName: 'Фото', width: 80, sortable: false,
      renderCell: (params) => (
        <Avatar src={params.value || undefined} sx={{ width: 40, height: 40, bgcolor: '#D9D9D9' }}>
          {params.row.fullName?.[0]}
        </Avatar>
      ),
    },
    { field: 'fullName', headerName: 'ФИО', flex: 1 },
    { field: 'specialization', headerName: 'Специализация', flex: 1 },
    {
      field: 'actions', headerName: 'Действия', width: 180, sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Edit />} onClick={() => openEdit(params.row)}
            sx={{ borderRadius: 16 }}>Ред.</Button>
          <Button size="small" color="error" startIcon={<Delete />}
            onClick={() => handleDelete(params.row.id)} sx={{ borderRadius: 16 }}>Уд.</Button>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Тренеры</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Добавить тренера</Button>
      </Box>

      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} pageSizeOptions={[10, 25]} />
      </Box>

      {/* Диалог создания/редактирования */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редактировать' : 'Новый'} тренер</DialogTitle>
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
          <TextField label="Специализация" fullWidth margin="dense"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="Например: Йога, Пилатес" />
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
