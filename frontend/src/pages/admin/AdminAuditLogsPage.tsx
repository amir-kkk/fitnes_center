import { useCallback, useEffect, useMemo, useState } from 'react';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import api from '../../api/client';
import { useNotificationStore } from '../../stores/notificationStore';
import type { AuditLogDetails, AuditLogListItem, PagedResult } from '../../types';

type DiffRow = {
  field: string;
  oldValue: string;
  newValue: string;
};

function parseJsonObject(json: string | null): Record<string, unknown> {
  if (!json) return {};
  try {
    const parsed = JSON.parse(json) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }
  return {};
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function AdminAuditLogsPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [rows, setRows] = useState<AuditLogListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pm, setPm] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [selectedLog, setSelectedLog] = useState<AuditLogDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const { data } = await api.get<PagedResult<AuditLogListItem>>('/admin/audit-logs', {
        params: { page: pm.page + 1, pageSize: pm.pageSize },
      });
      setRows(data.items);
      setTotal(data.totalCount);
    } catch {
      notify('Ошибка загрузки audit-логов', 'error');
    }
  }, [pm, notify]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const openDetails = async (id: number) => {
    try {
      const { data } = await api.get<AuditLogDetails>(`/admin/audit-logs/${id}`);
      setSelectedLog(data);
      setDetailsOpen(true);
    } catch {
      notify('Ошибка загрузки деталей лога', 'error');
    }
  };

  const detailRows = useMemo<DiffRow[]>(() => {
    if (!selectedLog) return [];
    const oldObj = parseJsonObject(selectedLog.oldValues);
    const newObj = parseJsonObject(selectedLog.newValues);
    const keys = Array.from(new Set([...Object.keys(oldObj), ...Object.keys(newObj)])).sort();
    return keys.map((key) => ({
      field: key,
      oldValue: stringifyValue(oldObj[key]),
      newValue: stringifyValue(newObj[key]),
    }));
  }, [selectedLog]);

  const columns: GridColDef[] = [
    {
      field: 'timestamp',
      headerName: 'Дата',
      width: 180,
      valueFormatter: (params) => dayjs(params.value).format('DD.MM.YYYY HH:mm:ss'),
    },
    { field: 'userDisplayName', headerName: 'Пользователь', flex: 1.2, minWidth: 220 },
    { field: 'entityName', headerName: 'Сущность', width: 170 },
    {
      field: 'action',
      headerName: 'Операция',
      width: 130,
      renderCell: (params) => {
        const action = params.value as string;
        const color = action === 'Insert' ? 'success' : action === 'Update' ? 'primary' : 'error';
        const label = action === 'Insert' ? 'Создание' : action === 'Update' ? 'Изменение' : 'Удаление';
        return <Chip size="small" color={color} label={label} />;
      },
    },
    {
      field: 'details',
      headerName: 'Детали',
      sortable: false,
      width: 140,
      renderCell: (params) => (
        <Button size="small" onClick={() => openDetails(params.row.id)}>
          Открыть
        </Button>
      ),
    },
  ];

  return (
    <>
      <Typography variant="h5" mb={2}>Audit Log</Typography>
      <Box sx={{ height: 620 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          rowCount={total}
          paginationMode="server"
          pageSizeOptions={[20, 50, 100]}
          paginationModel={pm}
          onPaginationModelChange={setPm}
        />
      </Box>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Детали изменения</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Stack spacing={1.5} mb={2}>
              <Typography variant="body2"><b>Дата:</b> {dayjs(selectedLog.timestamp).format('DD.MM.YYYY HH:mm:ss')}</Typography>
              <Typography variant="body2"><b>Пользователь:</b> {selectedLog.userDisplayName}</Typography>
              <Typography variant="body2"><b>Сущность:</b> {selectedLog.entityName}</Typography>
              <Typography variant="body2"><b>Операция:</b> {selectedLog.action}</Typography>
            </Stack>
          )}

          {detailRows.length === 0 ? (
            <Typography color="text.secondary">Нет детализированных изменений для отображения.</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><b>Поле</b></TableCell>
                  <TableCell><b>Было</b></TableCell>
                  <TableCell><b>Стало</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detailRows.map((r) => (
                  <TableRow key={r.field}>
                    <TableCell>{r.field}</TableCell>
                    <TableCell>{r.oldValue}</TableCell>
                    <TableCell>{r.newValue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
