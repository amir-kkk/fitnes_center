import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Typography, Box, TextField, Chip } from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Purchase, PagedResult } from '../../types';

export default function AdminPurchasesPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [pm, setPm] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<Purchase>>('/purchases', {
        params: { page: pm.page + 1, pageSize: pm.pageSize, search },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch { notify('Ошибка загрузки', 'error'); }
  }, [pm, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'userEmail', headerName: 'Пользователь', flex: 1 },
    { field: 'membershipName', headerName: 'Абонемент', flex: 1 },
    {
      field: 'priceAtPurchase', headerName: 'Цена ₽', width: 120, type: 'number',
      valueFormatter: (params) => `${params.value?.toLocaleString()} ₽`,
    },
    {
      field: 'status', headerName: 'Статус', width: 120,
      renderCell: (params) => (
        <Chip size="small"
          label={params.value === 'Paid' ? 'Оплачен' : 'Ожидание'}
          color={params.value === 'Paid' ? 'success' : 'warning'} />
      ),
    },
    {
      field: 'createdAt', headerName: 'Дата', width: 160,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm'),
    },
  ];

  return (
    <>
      <Typography variant="h5" mb={2}>Покупки</Typography>
      <TextField size="small" placeholder="Поиск по email" sx={{ mb: 2, width: 320 }}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={total}
          paginationMode="server" pageSizeOptions={[10, 25]}
          paginationModel={pm} onPaginationModelChange={setPm} />
      </Box>
    </>
  );
}
