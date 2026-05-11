import { useEffect, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Typography, Box, TextField, Chip, Checkbox, FormControlLabel, Button, Stack } from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Purchase, PagedResult } from '../../types';
import { formatPhone } from '../../utils/phone';

export default function AdminPurchasesPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);
  const [pm, setPm] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [search, setSearch] = useState('');
  const [onlyReserved, setOnlyReserved] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<Purchase>>('/purchases', {
        params: { page: pm.page + 1, pageSize: pm.pageSize, search, onlyReserved },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch { notify('Ошибка загрузки', 'error'); }
  }, [pm, search, onlyReserved, notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const confirmPayment = async (id: number) => {
    try {
      await api.post(`/purchases/${id}/pay`);
      notify('Оплата подтверждена', 'success');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Не удалось подтвердить оплату', 'error');
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 60 },
    { field: 'userFullName', headerName: 'ФИО', flex: 1 },
    { field: 'userEmail', headerName: 'Email', flex: 1 },
    {
      field: 'userPhone', headerName: 'Телефон', width: 160,
      renderCell: (params) => formatPhone(params.value),
    },
    { field: 'membershipName', headerName: 'Абонемент', flex: 1 },
    {
      field: 'priceAtPurchase', headerName: 'Цена ₽', width: 120, type: 'number',
      valueFormatter: (params) => `${params.value?.toLocaleString()} ₽`,
    },
    {
      field: 'status', headerName: 'Статус', width: 120,
      renderCell: (params) => (
        <Chip size="small"
          label={params.value === 'Paid' ? 'Оплачен' : 'Забронирован'}
          color={params.value === 'Paid' ? 'success' : 'warning'} />
      ),
    },
    {
      field: 'createdAt', headerName: 'Дата', width: 160,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm'),
    },
    {
      field: 'actions', headerName: 'Действия', width: 180, sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          disabled={params.row.status === 'Paid'}
          onClick={() => confirmPayment(params.row.id)}
        >
          Подтвердить оплату
        </Button>
      ),
    },
  ];

  return (
    <>
      <Typography variant="h5" mb={2}>Покупки</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField size="small" placeholder="Поиск по email / имени" sx={{ width: 320 }}
          value={search} onChange={(e) => setSearch(e.target.value)} />
        <FormControlLabel
          control={<Checkbox checked={onlyReserved} onChange={(e) => setOnlyReserved(e.target.checked)} />}
          label="Только забронированные"
        />
      </Stack>
      <Box sx={{ height: 500 }}>
        <DataGrid rows={rows} columns={columns} rowCount={total}
          paginationMode="server" pageSizeOptions={[10, 25]}
          paginationModel={pm} onPaginationModelChange={setPm} />
      </Box>
    </>
  );
}
