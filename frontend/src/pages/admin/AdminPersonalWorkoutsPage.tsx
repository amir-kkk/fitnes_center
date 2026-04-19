import { useCallback, useEffect, useState } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { Box, Button, Chip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { PagedResult, PersonalWorkoutSlot } from '../../types';

export default function AdminPersonalWorkoutsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<PersonalWorkoutSlot[]>([]);
  const [total, setTotal] = useState(0);
  const [pm, setPm] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<PersonalWorkoutSlot>>('/admin/personal-workouts', {
        params: { page: pm.page + 1, pageSize: pm.pageSize },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch {
      notify('Ошибка загрузки персональных записей', 'error');
    }
  }, [pm]);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'trainerName', headerName: 'Тренер', flex: 1 },
    {
      field: 'clientName', headerName: 'Клиент', flex: 1,
      renderCell: (params) => params.row.clientName || '—',
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
      field: 'isBooked', headerName: 'Статус', width: 140,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value ? 'Забронировано' : 'Свободно'}
          color={params.value ? 'primary' : 'success'}
        />
      ),
    },
    {
      field: 'actions', headerName: 'Действия', width: 160, sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          color="error"
          disabled={!params.row.isBooked}
          onClick={() => handleCancel(params.row.id)}
        >
          Отменить
        </Button>
      ),
    },
  ];

  return (
    <>
      <Typography variant="h5" mb={2}>Персональные записи</Typography>
      <Box sx={{ height: 520 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={total}
          paginationMode="server"
          pageSizeOptions={[10, 25]}
          paginationModel={pm}
          onPaginationModelChange={setPm}
        />
      </Box>
    </>
  );
}
