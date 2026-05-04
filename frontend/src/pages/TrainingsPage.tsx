import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, CardActions, Typography, Button, Box,
  FormControl, InputLabel, Select, MenuItem, TextField, Chip, Stack,
  CircularProgress, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { AccessTime, Person, Group } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { createGoogleCalendarLink } from '../utils/calendar';
import type { Training, Category, Coach, PagedResult } from '../types';

export default function TrainingsPage() {
  const user = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trainers, setTrainers] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [trainerId, setTrainerId] = useState<string>('');
  const [date, setDate] = useState('');
  const [calendarEvent, setCalendarEvent] = useState<{
    title: string;
    start: Date;
    end: Date;
    details: string;
  } | null>(null);

  useEffect(() => {
    api.get<Category[]>('/categories').then(({ data }) => setCategories(data));
    api.get<Coach[]>('/coaches').then(({ data }) => setTrainers(data));
  }, []);

  const fetchTrainings = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, pageSize: 50 };
      if (categoryId) params.categoryId = categoryId;
      if (trainerId) params.trainerId = trainerId;
      if (date) params.date = date;
      const { data } = await api.get<PagedResult<Training>>('/trainings', { params });
      setTrainings(data.items);
    } catch { notify('Ошибка загрузки расписания', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchTrainings(); }, [categoryId, trainerId, date]);

  const visibleTrainings = trainings.filter((t) => dayjs(t.startTime).isAfter(dayjs()));

  const handleBook = async (trainingId: number) => {
    try {
      await api.post('/bookings', { trainingId });
      notify('Вы записаны на тренировку!', 'success');
      const training = trainings.find((t) => t.id === trainingId);
      if (training) {
        const start = new Date(training.startTime);
        const end = dayjs(training.startTime).add(1, 'hour').toDate();
        setCalendarEvent({
          title: `Групповая тренировка: ${training.description}`,
          start,
          end,
          details: `Тренер: ${training.trainerName}. Категория: ${training.categoryName}.`,
        });
      }
      fetchTrainings();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка записи', 'error');
    }
  };

  const handleAddToCalendar = () => {
    if (!calendarEvent) return;
    const link = createGoogleCalendarLink(calendarEvent);
    window.open(link, '_blank', 'noopener,noreferrer');
    setCalendarEvent(null);
  };

  return (
    <>
      <Typography variant="h4" mb={3}>Расписание тренировок</Typography>

      {/* Фильтры */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4}>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Категория</InputLabel>
          <Select value={categoryId} label="Категория" onChange={(e) => setCategoryId(e.target.value as number | '')}>
            <MenuItem value="">Все</MenuItem>
            {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Тренер</InputLabel>
          <Select value={trainerId} label="Тренер" onChange={(e) => setTrainerId(e.target.value as string)}>
            <MenuItem value="">Все</MenuItem>
            {trainers.map((c) => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField type="date" size="small" label="Дата" InputLabelProps={{ shrink: true }}
          value={date} onChange={(e) => setDate(e.target.value)} />
      </Stack>

      {loading ? <Box textAlign="center" mt={4}><CircularProgress /></Box> : (
        <Grid container spacing={3}>
          {visibleTrainings.map((t) => {
            const spotsLeft = t.maxParticipants - t.currentParticipants;
            const fillPercent = (t.currentParticipants / t.maxParticipants) * 100;
            return (
              <Grid item xs={12} sm={6} md={4} key={t.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Chip label={t.categoryName} size="small" color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6" gutterBottom>{t.description}</Typography>
                    <Stack spacing={1} mt={1}>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <AccessTime fontSize="small" color="action" />
                        <Typography variant="body2">
                          {dayjs(t.startTime).format('DD.MM.YYYY HH:mm')}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Person fontSize="small" color="action" />
                        <Typography variant="body2">{t.trainerName}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Group fontSize="small" color="action" />
                        <Typography variant="body2">
                          {t.currentParticipants}/{t.maxParticipants} мест
                        </Typography>
                      </Box>
                    </Stack>
                    <LinearProgress variant="determinate" value={fillPercent}
                      color={spotsLeft <= 2 ? 'error' : 'primary'} sx={{ mt: 1, borderRadius: 1 }} />
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    {user?.role === 'Trainer' ? (
                      <Button variant="outlined" fullWidth disabled>
                        Только просмотр
                      </Button>
                    ) : user ? (
                      <Button variant="contained" fullWidth disabled={spotsLeft <= 0}
                        onClick={() => handleBook(t.id)}>
                        {spotsLeft > 0 ? 'Записаться' : 'Мест нет'}
                      </Button>
                    ) : (
                      <Button variant="outlined" fullWidth href="/login">Войдите для записи</Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
          {visibleTrainings.length === 0 && (
            <Grid item xs={12}>
              <Typography textAlign="center" color="text.secondary">Тренировок не найдено</Typography>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog open={!!calendarEvent} onClose={() => setCalendarEvent(null)}>
        <DialogTitle>Отметить занятие в календаре?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Добавить событие в Google Calendar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCalendarEvent(null)}>Нет</Button>
          <Button variant="contained" onClick={handleAddToCalendar}>Да</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
