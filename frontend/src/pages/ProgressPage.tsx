import { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, CardActions, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, IconButton, Chip, Stack, CircularProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Delete, Add } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api/client';
import { useNotificationStore } from '../stores/notificationStore';
import type { ProgressTracker, ProgressEntry } from '../types';

export default function ProgressPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [trackers, setTrackers] = useState<ProgressTracker[]>([]);
  const [loading, setLoading] = useState(true);

  // Диалог создания трекера
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // Диалог записей
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<ProgressTracker | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [newValue, setNewValue] = useState('');

  const fetchTrackers = async () => {
    try {
      const { data } = await api.get<ProgressTracker[]>('/progress/trackers');
      setTrackers(data);
    } catch { notify('Ошибка загрузки трекеров', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchTrackers(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/progress/trackers', {
        title: newTitle, goalValue: parseFloat(newGoal), unit: newUnit,
      });
      notify('Трекер создан', 'success');
      setCreateOpen(false);
      setNewTitle(''); setNewGoal(''); setNewUnit('');
      fetchTrackers();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка создания', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/progress/trackers/${id}`);
      notify('Трекер удалён', 'info');
      fetchTrackers();
    } catch { notify('Ошибка удаления', 'error'); }
  };

  const openEntries = async (tracker: ProgressTracker) => {
    setSelectedTracker(tracker);
    try {
      const { data } = await api.get<ProgressEntry[]>(`/progress/trackers/${tracker.id}/entries`);
      setEntries(data);
      setEntriesOpen(true);
    } catch { notify('Ошибка загрузки записей', 'error'); }
  };

  const handleAddEntry = async () => {
    if (!selectedTracker) return;
    try {
      await api.post(`/progress/trackers/${selectedTracker.id}/entries`, {
        value: parseFloat(newValue),
      });
      setNewValue('');
      const { data } = await api.get<ProgressEntry[]>(
        `/progress/trackers/${selectedTracker.id}/entries`
      );
      setEntries(data);
      fetchTrackers();
      notify('Замер добавлен', 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка', 'error');
    }
  };

  const changeIcon = (percent: number | null) => {
    if (percent === null) return <TrendingFlat color="action" />;
    if (percent > 0) return <TrendingUp color="success" />;
    if (percent < 0) return <TrendingDown color="error" />;
    return <TrendingFlat color="action" />;
  };

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress /></Box>;

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Мой прогресс</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Новый трекер
        </Button>
      </Box>

      {trackers.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          Пока нет трекеров. Создайте первый!
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {trackers.map((t) => (
            <Grid item xs={12} sm={6} md={4} key={t.id}>
              <Card elevation={2} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Typography variant="h6">{t.title}</Typography>
                    <IconButton size="small" onClick={() => handleDelete(t.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Цель: {t.goalValue} {t.unit}
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {changeIcon(t.changePercent)}
                    <Typography variant="h5">
                      {t.lastValue !== null ? `${t.lastValue} ${t.unit}` : '—'}
                    </Typography>
                    {t.changePercent !== null && (
                      <Chip size="small"
                        label={`${t.changePercent > 0 ? '+' : ''}${t.changePercent}%`}
                        color={t.changePercent > 0 ? 'success' : t.changePercent < 0 ? 'error' : 'default'} />
                    )}
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => openEntries(t)}>Все замеры</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Диалог создания трекера */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новый трекер</DialogTitle>
        <DialogContent>
          <TextField label="Название (напр. Жим лёжа)" fullWidth margin="dense"
            value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <TextField label="Цель" type="number" fullWidth margin="dense"
            value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
          <TextField label="Единица измерения (кг, мин, км...)" fullWidth margin="dense"
            value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleCreate}>Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог записей трекера */}
      <Dialog open={entriesOpen} onClose={() => setEntriesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedTracker?.title} — замеры
        </DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={1} mb={2} mt={1}>
            <TextField label="Новый замер" type="number" size="small" fullWidth
              value={newValue} onChange={(e) => setNewValue(e.target.value)} />
            <Button variant="contained" onClick={handleAddEntry} disabled={!newValue}>
              Добавить
            </Button>
          </Stack>
          {entries.length === 0 ? (
            <Typography color="text.secondary">Нет замеров</Typography>
          ) : (
            <List dense>
              {entries.map((e) => (
                <ListItem key={e.id}>
                  <ListItemText
                    primary={`${e.value} ${selectedTracker?.unit}`}
                    secondary={dayjs(e.dateRecorded).format('DD.MM.YYYY HH:mm')}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEntriesOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
