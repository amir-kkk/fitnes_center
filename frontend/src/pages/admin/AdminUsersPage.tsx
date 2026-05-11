import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Typography, Box, TextField, Select, MenuItem, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, IconButton, Stack,
} from '@mui/material';
import { Add, ContentCopy, Key, Visibility, VisibilityOff } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { User, PagedResult } from '../../types';
import { useAuthStore } from '../../stores/authStore';
import { formatPhone, normalizePhoneInput } from '../../utils/phone';

export default function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'Manager';
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<User>>('/admin/users', {
        params: { page: paginationModel.page + 1, pageSize: paginationModel.pageSize, search },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch { notify('Ошибка загрузки пользователей', 'error'); }
  }, [paginationModel, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, JSON.stringify(role), {
        headers: { 'Content-Type': 'application/json' },
      });
      notify('Роль обновлена', 'success');
      fetchData();
    } catch { notify('Ошибка обновления роли', 'error'); }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let out = '';
    for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
    setForm((prev) => ({ ...prev, password: out, confirmPassword: out }));
  };

  const copyPassword = async () => {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    notify('Пароль скопирован', 'success');
  };

  const createUser = async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      notify('Заполните обязательные поля', 'warning');
      return;
    }
    if (form.password !== form.confirmPassword) {
      notify('Пароли не совпадают', 'warning');
      return;
    }

    try {
      await api.post('/admin/users', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: normalizePhoneInput(form.phoneNumber),
        password: form.password,
      });
      notify('Пользователь создан', 'success');
      setCreateOpen(false);
      setForm({ fullName: '', phoneNumber: '', email: '', password: '', confirmPassword: '' });
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка создания пользователя', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'fullName', headerName: 'Имя', flex: 1 },
    {
      field: 'phoneNumber', headerName: 'Телефон', width: 170,
      renderCell: (params) => formatPhone(params.value),
    },
    {
      field: 'role', headerName: 'Роль', width: 140,
      renderCell: (params) => isManager ? params.value : (
        <Select size="small" value={params.value} variant="standard"
          onChange={(e) => handleRoleChange(params.row.id, e.target.value as string)}>
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Trainer">Trainer</MenuItem>
          <MenuItem value="Manager">Manager</MenuItem>
          <MenuItem value="Admin">Admin</MenuItem>
        </Select>
      ),
    },
    {
      field: 'createdAt', headerName: 'Регистрация', width: 160,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm'),
    },
  ];

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Пользователи</Typography>
        {isManager && (
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
            Добавить учетную запись
          </Button>
        )}
      </Box>
      <TextField size="small" placeholder="Поиск по email / имени" sx={{ mb: 2, width: 320 }}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} getRowId={(r) => r.id}
          rowCount={total} paginationMode="server" pageSizeOptions={[10, 25]}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} />
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Новая учетная запись</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="ФИО"
              value={form.fullName}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Номер телефона"
              value={form.phoneNumber}
              onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Почта"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Пароль"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((x) => !x)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    <IconButton onClick={generatePassword} title="Сгенерировать пароль">
                      <Key />
                    </IconButton>
                    <IconButton onClick={copyPassword} title="Скопировать пароль">
                      <ContentCopy />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Подтверждение пароля"
              type={showPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={createUser}>Создать</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
