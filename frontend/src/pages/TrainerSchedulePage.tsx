import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box, Card, CardContent, Chip, CircularProgress, Stack, Tab, Tabs, Typography, Button, TextField,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useNotificationStore } from '../stores/notificationStore';
import type { PersonalWorkoutSlot } from '../types';

export default function TrainerSchedulePage() {
  const navigate = useNavigate();
  const notify = useNotificationStore((s) => s.showNotification);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(false);
  const [workouts, setWorkouts] = useState<PersonalWorkoutSlot[]>([]);
  const [slotDate, setSlotDate] = useState(dayjs());
  const [slotStartTime, setSlotStartTime] = useState('09:00');
  const [slotEndTime, setSlotEndTime] = useState('18:00');

  const fetchWorkouts = async (historyMode: boolean) => {
    setLoading(true);
    try {
      const { data } = await api.get<PersonalWorkoutSlot[]>('/trainer/my-workouts', {
        params: { history: historyMode },
      });
      setWorkouts(data);
    } catch {
      notify('Не удалось загрузить расписание', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkouts(history);
  }, [history]);

  const handleCreateSlotsRange = async () => {
    const startDateTime = slotDate
      .hour(Number(slotStartTime.split(':')[0]))
      .minute(Number(slotStartTime.split(':')[1]))
      .second(0)
      .millisecond(0);
    const endDateTime = slotDate
      .hour(Number(slotEndTime.split(':')[0]))
      .minute(Number(slotEndTime.split(':')[1]))
      .second(0)
      .millisecond(0);

    if (!endDateTime.isAfter(startDateTime)) {
      notify('Конец рабочего времени должен быть позже начала', 'warning');
      return;
    }

    try {
      await api.post('/trainer/slots/range', {
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
      });
      notify('Рабочий интервал успешно добавлен', 'success');
      if (!history) fetchWorkouts(false);
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Не удалось создать интервал', 'error');
    }
  };

  return (
    <>
      <Typography variant="h4" mb={2}>Мое расписание</Typography>
      <Tabs value={history ? 1 : 0} onChange={(_, v) => setHistory(v === 1)} sx={{ mb: 3 }}>
        <Tab label="Предстоящие" />
        <Tab label="История" />
      </Tabs>

      {!history && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={1}>Открыть рабочий интервал</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateCalendar value={slotDate} onChange={(v) => v && setSlotDate(v)} />
              </LocalizationProvider>
              <Stack spacing={2} mt={{ xs: 0, md: 2 }}>
                <TextField
                  type="time"
                  label="Начало"
                  value={slotStartTime}
                  onChange={(e) => setSlotStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  type="time"
                  label="Конец"
                  value={slotEndTime}
                  onChange={(e) => setSlotEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" onClick={handleCreateSlotsRange}>
                  Добавить рабочее время
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Box textAlign="center" mt={8}><CircularProgress /></Box>
      ) : workouts.length === 0 ? (
        <Typography color="text.secondary">Тренировок нет.</Typography>
      ) : (
        <Stack spacing={2}>
          {workouts.map((workout) => (
            <Card key={workout.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography variant="h6">
                      {dayjs(workout.dateTime).format('DD.MM.YYYY HH:mm')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Стоимость: {workout.price} RUB
                    </Typography>
                    <Typography mt={0.5}>
                      Клиент: {workout.clientName || 'Не забронировано'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip label={workout.isBooked ? 'Забронировано' : 'Свободный слот'} color={workout.isBooked ? 'primary' : 'success'} />
                    {workout.clientId && (
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/trainer/client/${workout.clientId}`)}
                      >
                        Прогресс клиента
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}
