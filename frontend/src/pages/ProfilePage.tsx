import { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, Chip, Divider,
  List, ListItem, ListItemText, IconButton, CircularProgress, Avatar, Button, Stack,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { Purchase, Booking, PagedResult, PersonalWorkoutSlot } from '../types';

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const notify = useNotificationStore((s) => s.showNotification);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [personalBookings, setPersonalBookings] = useState<PersonalWorkoutSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (user?.role === 'Trainer') {
      setLoading(false);
      return;
    }

    try {
      const [pRes, bRes, personalRes] = await Promise.all([
        api.get<PagedResult<Purchase>>('/purchases/my', { params: { page: 1, pageSize: 50 } }),
        api.get<Booking[]>('/bookings/my'),
        api.get<PersonalWorkoutSlot[]>('/workouts/my', { params: { history: false } }),
      ]);
      setPurchases(pRes.data.items);
      setBookings(bRes.data);
      setPersonalBookings(personalRes.data);
    } catch { notify('Ошибка загрузки данных профиля', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user?.role]);

  const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify('Файл слишком большой (макс. 5 МБ)', 'error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/auth/me/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await loadUser();
      notify('Аватар обновлен', 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка загрузки фото', 'error');
    }
  };

  const handleCancelBooking = async (id: number) => {
    try {
      await api.delete(`/bookings/${id}`);
      notify('Запись отменена', 'info');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка отмены', 'error');
    }
  };

  const handleCancelPersonalBooking = async (id: number) => {
    try {
      await api.delete(`/workouts/my/${id}`);
      notify('Персональная запись отменена', 'info');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка отмены персональной записи', 'error');
    }
  };

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress /></Box>;

  return (
    <>
      <Typography variant="h4" mb={1}>Личный кабинет</Typography>
      <Typography color="text.secondary" mb={4}>
        {user?.fullName} — {user?.email}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={4} alignItems={{ xs: 'start', sm: 'center' }}>
        <Avatar src={user?.photoUrl || undefined} sx={{ width: 80, height: 80, bgcolor: '#D9D9D9', fontSize: 30 }}>
          {user?.fullName?.[0] || '?'}
        </Avatar>
        {user?.role !== 'Trainer' ? (
          <Button variant="outlined" component="label">
            Загрузить аватар
            <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUploadPhoto} />
          </Button>
        ) : (
          <Typography color="text.secondary">Фото тренера задается администратором</Typography>
        )}
      </Stack>

      {user?.role !== 'Trainer' && <Grid container spacing={4}>
        {/* Покупки */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Мои абонементы</Typography>
              <Divider sx={{ mb: 2 }} />
              {purchases.length === 0 ? (
                <Typography color="text.secondary">Нет покупок</Typography>
              ) : (
                <List dense>
                  {purchases.map((p) => (
                    <ListItem key={p.id}>
                      <ListItemText
                        primary={p.membershipName}
                        secondary={`${p.priceAtPurchase.toLocaleString()} ₽ — ${dayjs(p.createdAt).format('DD.MM.YYYY')}`}
                      />
                      <Chip size="small"
                        label={p.status === 'Paid' ? 'Оплачен' : 'Ожидание'}
                        color={p.status === 'Paid' ? 'success' : 'warning'} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Записи на тренировки */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Мои групповые тренировки</Typography>
              <Divider sx={{ mb: 2 }} />
              {bookings.length === 0 ? (
                <Typography color="text.secondary">Нет записей</Typography>
              ) : (
                <List dense>
                  {bookings.map((b) => (
                    <ListItem key={b.id}
                      secondaryAction={
                        b.status === 'Active' && (
                          <IconButton edge="end" onClick={() => handleCancelBooking(b.id)} title="Отменить">
                            <Cancel color="error" />
                          </IconButton>
                        )
                      }>
                      <ListItemText
                        primary={b.trainingDescription}
                        secondary={`${dayjs(b.trainingStartTime).format('DD.MM.YYYY HH:mm')} — ${b.trainerName}`}
                      />
                      <Chip size="small" sx={{ mr: 1 }}
                        label={b.status === 'Active' ? 'Активна' : 'Отменена'}
                        color={b.status === 'Active' ? 'primary' : 'default'} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Персональные тренировки */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Мои персональные тренировки</Typography>
              <Divider sx={{ mb: 2 }} />
              {personalBookings.length === 0 ? (
                <Typography color="text.secondary">Нет персональных записей</Typography>
              ) : (
                <List dense>
                  {personalBookings.map((b) => (
                    <ListItem
                      key={b.id}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleCancelPersonalBooking(b.id)} title="Отменить">
                          <Cancel color="error" />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={`Тренер: ${b.trainerName}`}
                        secondary={dayjs(b.dateTime).format('DD.MM.YYYY HH:mm')}
                      />
                      <Chip size="small" label="Активна" color="primary" sx={{ mr: 1 }} />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>}
    </>
  );
}
