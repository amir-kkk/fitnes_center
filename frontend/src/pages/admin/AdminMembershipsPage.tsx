import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Typography, Box, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, Autocomplete,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { ClientListItem, Membership, PagedResult } from '../../types';

const empty = { name: '', description: '', price: 0, durationDays: 30, options: '' };

export default function AdminMembershipsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Membership[]>([]);
  const [total, setTotal] = useState(0);
  const [pm, setPm] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [dlgOpen, setDlgOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const [users, setUsers] = useState<ClientListItem[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignMembershipId, setAssignMembershipId] = useState<number | null>(null);
  const [assignUser, setAssignUser] = useState<ClientListItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<Membership>>('/memberships', {
        params: { page: pm.page + 1, pageSize: pm.pageSize, search },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch { notify('Ошибка загрузки', 'error'); }
  }, [pm, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    api.get<PagedResult<ClientListItem>>('/admin/clients', { params: { page: 1, pageSize: 500, search: '' } })
      .then(({ data }) => setUsers(data.items))
      .catch(() => notify('Ошибка загрузки пользователей', 'error'));
  }, [notify]);

  const openCreate = () => { setEditId(null); setForm(empty); setDlgOpen(true); };
  const openEdit = (m: Membership) => {
    setEditId(m.id);
    setForm({ name: m.name, description: m.description, price: m.price, durationDays: m.durationDays, options: m.options.join('\n') });
    setDlgOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name, description: form.description,
      price: Number(form.price), durationDays: Number(form.durationDays),
      options: form.options.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (editId) await api.put(`/memberships/${editId}`, payload);
      else await api.post('/memberships', payload);
      notify(editId ? 'Обновлено' : 'Создано', 'success');
      setDlgOpen(false);
      fetchData();
    } catch (err: any) { notify(err.response?.data?.detail || 'Ошибка', 'error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить абонемент?')) return;
    try {
      await api.delete(`/memberships/${id}`);
      notify('Удалено', 'info');
      fetchData();
    } catch { notify('Ошибка удаления', 'error'); }
  };

  const openAssign = (membershipId: number) => {
    setAssignMembershipId(membershipId);
    setAssignUser(null);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!assignUser || !assignMembershipId) {
      notify('Выберите клиента', 'warning');
      return;
    }
    try {
      await api.post('/admin/memberships/assign', {
        userId: assignUser.id,
        membershipId: assignMembershipId,
      });
      notify('Абонемент забронирован для клиента', 'success');
      setAssignOpen(false);
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка назначения абонемента', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'name', headerName: 'Название', flex: 1 },
    { field: 'price', headerName: 'Цена ₽', width: 120, type: 'number' },
    { field: 'durationDays', headerName: 'Дней', width: 80, type: 'number' },
    {
      field: 'actions', 
      headerName: 'Действия', 
      width: 300, 
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" startIcon={<Edit />} onClick={() => openEdit(params.row)}>Ред.</Button>
          <Button size="small" onClick={() => openAssign(params.row.id)}>Выдать</Button>
          <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(params.row.id)}>Уд.</Button>
        </Stack>
      ),
    }
  ];

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Каталог абонементов</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Создать</Button>
      </Box>
      <TextField size="small" placeholder="Поиск" sx={{ mb: 2, width: 320 }}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={total}
          paginationMode="server" pageSizeOptions={[10, 25]}
          paginationModel={pm} onPaginationModelChange={setPm} />
      </Box>

      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редактировать' : 'Новый'} абонемент</DialogTitle>
        <DialogContent>
          <TextField label="Название" fullWidth margin="dense"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <TextField label="Описание" fullWidth margin="dense" multiline rows={2}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Stack direction="row" spacing={2}>
            <TextField label="Цена" type="number" margin="dense" fullWidth
              value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} />
            <TextField label="Дней" type="number" margin="dense" fullWidth
              value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: +e.target.value })} />
          </Stack>
          <TextField label="Опции (каждая с новой строки)" fullWidth margin="dense" multiline rows={3}
            value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSave}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Выдать абонемент клиенту</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Autocomplete
              options={users}
              value={assignUser}
              onChange={(_, v) => setAssignUser(v)}
              getOptionLabel={(o) => `${o.fullName} (${o.email})`}
              renderInput={(params) => <TextField {...params} label="Клиент" />}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleAssign}>Выдать</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
