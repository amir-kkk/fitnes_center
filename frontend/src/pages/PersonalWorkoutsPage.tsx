import { useEffect, useMemo, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Box, Card, CardActions, CardContent, Button, Grid, Typography, Stack, Chip, CircularProgress, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import api from '../api/client';
import { useNotificationStore } from '../stores/notificationStore';
import { useAuthStore } from '../stores/authStore';
import { createGoogleCalendarLink } from '../utils/calendar';
import type { PersonalWorkoutSlot, TrainerListItem } from '../types';

export default function PersonalWorkoutsPage() {
  const user = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [loading, setLoading] = useState(true);
  const [trainers, setTrainers] = useState<TrainerListItem[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerListItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [slots, setSlots] = useState<PersonalWorkoutSlot[]>([]);
  const [calendarEvent, setCalendarEvent] = useState<{
    title: string;
    start: Date;
    end: Date;
    details: string;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get<TrainerListItem[]>('/workouts/trainers');
        setTrainers(data);
      } catch {
        notify('Не удалось загрузить тренеров', 'error');
      }
      setLoading(false);
    };
    load();
  }, []);

  const fetchSlots = async (trainerId: string) => {
    try {
      const { data } = await api.get<PersonalWorkoutSlot[]>(`/workouts/trainer/${trainerId}/slots`);
      setSlots(data);
    } catch {
      notify('Ошибка загрузки доступных слотов', 'error');
    }
  };

  const handleSelectTrainer = async (trainer: TrainerListItem) => {
    setSelectedTrainer(trainer);
    setSelectedDate(null);
    await fetchSlots(trainer.id);
  };

  const visibleSlots = useMemo(() => {
    if (!selectedDate) return slots;
    return slots.filter((s) => dayjs(s.dateTime).isSame(selectedDate, 'day'));
  }, [slots, selectedDate]);

  const handleBuy = async (slotId: number) => {
    try {
      await api.post(`/workouts/buy/${slotId}`);
      notify('Вы успешно записались на персональную тренировку!', 'success');
      const booked = slots.find((s) => s.id === slotId);
      if (booked) {
        const start = new Date(booked.dateTime);
        const end = dayjs(booked.dateTime).add(1, 'hour').toDate();
        setCalendarEvent({
          title: `Персональная тренировка: ${booked.trainerName}`,
          start,
          end,
          details: `Персональная тренировка с тренером ${booked.trainerName}.`,
        });
      }
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Не удалось записаться', 'error');
    }
  };

  const handleAddToCalendar = () => {
    if (!calendarEvent) return;
    const link = createGoogleCalendarLink(calendarEvent);
    window.open(link, '_blank', 'noopener,noreferrer');
    setCalendarEvent(null);
  };

  if (loading) {
    return <Box textAlign="center" mt={8}><CircularProgress /></Box>;
  }

  if (user?.role === 'Trainer') {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h5" gutterBottom>Для тренера доступно управление слотами</Typography>
        <Button variant="contained" href="/trainer/schedule">
          Перейти в мое расписание
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" mb={3}>Персональные тренировки</Typography>

      {trainers.length === 0 ? (
        <Typography color="text.secondary">Пока нет доступных тренеров.</Typography>
      ) : (
        <Grid container spacing={3}>
          {trainers.map((trainer) => (
            <Grid item xs={12} sm={6} md={4} key={trainer.id}>
              <Card
                elevation={selectedTrainer?.id === trainer.id ? 6 : 1}
                sx={{ height: '100%', border: selectedTrainer?.id === trainer.id ? '1px solid' : 'none', borderColor: 'primary.main' }}
              >
                <CardContent>
                  <Avatar src={trainer.photoUrl || undefined} sx={{ mb: 1.5, bgcolor: '#D9D9D9' }}>
                    {trainer.fullName[0]}
                  </Avatar>
                  <Typography variant="h6">{trainer.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">{trainer.email}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ранг: {trainer.trainerRank}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    variant={selectedTrainer?.id === trainer.id ? 'contained' : 'outlined'}
                    onClick={() => handleSelectTrainer(trainer)}
                  >
                    Выбрать
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {selectedTrainer && (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} mt={4}>
          <Box>
            <Typography variant="h6" mb={1}>Выбор даты</Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar value={selectedDate} onChange={(value) => setSelectedDate(value)} />
            </LocalizationProvider>
          </Box>
          <Box flex={1}>
            <Typography variant="h6" mb={2}>
              Доступные слоты: {selectedTrainer.fullName}
            </Typography>
            {visibleSlots.length === 0 ? (
              <Typography color="text.secondary">
                На выбранную дату нет свободных слотов.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {visibleSlots.map((slot) => (
                  <Card key={slot.id} variant="outlined">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="subtitle1">
                            {dayjs(slot.dateTime).format('DD.MM.YYYY HH:mm')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Стоимость: {slot.price} RUB
                          </Typography>
                        </Box>
                        <Chip label="Свободно" color="success" />
                      </Stack>
                    </CardContent>
                    <CardActions>
                      <Button variant="contained" onClick={() => handleBuy(slot.id)}>
                        Записаться
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
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
