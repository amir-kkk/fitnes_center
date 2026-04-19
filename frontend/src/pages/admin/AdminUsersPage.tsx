import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Typography, Box, TextField, Select, MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { User, PagedResult } from '../../types';

export default function AdminUsersPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');

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

  const columns: GridColDef[] = [
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'fullName', headerName: 'Имя', flex: 1 },
    {
      field: 'role', headerName: 'Роль', width: 140,
      renderCell: (params) => (
        <Select size="small" value={params.value} variant="standard"
          onChange={(e) => handleRoleChange(params.row.id, e.target.value as string)}>
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Trainer">Trainer</MenuItem>
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
      <Typography variant="h5" mb={2}>Пользователи</Typography>
      <TextField size="small" placeholder="Поиск по email / имени" sx={{ mb: 2, width: 320 }}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} getRowId={(r) => r.id}
          rowCount={total} paginationMode="server" pageSizeOptions={[10, 25]}
          paginationModel={paginationModel} onPaginationModelChange={setPaginationModel} />
      </Box>
    </>
  );
}
