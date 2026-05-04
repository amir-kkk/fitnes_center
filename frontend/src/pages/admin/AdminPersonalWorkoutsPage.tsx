import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Button, Chip, Typography } from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { PagedResult, PersonalWorkoutSlot } from '../../types';

type AdminPersonalWorkoutRow = {
  id: string;
  slotId?: number;
  trainerName: string;
  clientName: string | null;
  dateTime: string;
  dateTimeEnd: string;
  price: number;
  isBooked: boolean;
  isGroupedFreeRange: boolean;
};

export default function AdminPersonalWorkoutsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [slots, setSlots] = useState<PersonalWorkoutSlot[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<PersonalWorkoutSlot>>('/admin/personal-workouts', {
        params: { page: 1, pageSize: 500 },
      });
      setSlots(data.items);
    } catch {
      notify('Ошибка загрузки персональных записей', 'error');
    }
  }, [notify]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const rows = useMemo<AdminPersonalWorkoutRow[]>(() => {
    const sorted = [...slots].sort((a, b) => {
      if (a.trainerId !== b.trainerId) return a.trainerId.localeCompare(b.trainerId);
      return dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf();
    });
    const result: AdminPersonalWorkoutRow[] = [];

    for (let i = 0; i < sorted.length; i += 1) {
      const current = sorted[i];
      if (current.isBooked) {
        result.push({
          id: `booked-${current.id}`,
          slotId: current.id,
          trainerName: current.trainerName,
          clientName: current.clientName,
          dateTime: current.dateTime,
          dateTimeEnd: current.dateTime,
          price: current.price,
          isBooked: true,
          isGroupedFreeRange: false,
        });
        continue;
      }

      let j = i;
      let end = dayjs(current.dateTime);
      while (j + 1 < sorted.length) {
        const next = sorted[j + 1];
        if (next.isBooked || next.trainerId !== current.trainerId) break;

        const expectedNext = dayjs(sorted[j].dateTime).add(1, 'hour');
        if (!dayjs(next.dateTime).isSame(expectedNext)) break;
        end = dayjs(next.dateTime);
        j += 1;
      }

      result.push({
        id: `free-${current.trainerId}-${current.dateTime}-${j}`,
        trainerName: current.trainerName,
        clientName: null,
        dateTime: current.dateTime,
        dateTimeEnd: end.toISOString(),
        price: current.price,
        isBooked: false,
        isGroupedFreeRange: true,
      });
      i = j;
    }

    return result;
  }, [slots]);

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
    { field: 'id', headerName: 'ID', width: 110 },
    { field: 'trainerName', headerName: 'Тренер', flex: 1 },
    {
      field: 'clientName', headerName: 'Клиент', flex: 1,
      renderCell: (params) => params.row.clientName || (params.row.isGroupedFreeRange ? '—' : 'Не назначен'),
    },
    {
      field: 'dateTime', headerName: 'Дата', width: 170,
      renderCell: (params) => {
        if (!params.row.isGroupedFreeRange) {
          return dayjs(params.row.dateTime).format('DD.MM.YYYY HH:mm');
        }
        return `${dayjs(params.row.dateTime).format('DD.MM.YYYY HH:mm')} - ${dayjs(params.row.dateTimeEnd).add(1, 'hour').format('HH:mm')}`;
      },
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
          label={params.value ? 'Забронировано' : (params.row.isGroupedFreeRange ? 'Свободный интервал' : 'Свободно')}
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
          disabled={!params.row.isBooked || !params.row.slotId}
          onClick={() => params.row.slotId && handleCancel(params.row.slotId)}
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
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
        />
      </Box>
    </>
  );
}
