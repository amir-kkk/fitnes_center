import { useEffect, useState } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, Chip, Divider,
  List, ListItem, ListItemText, IconButton, CircularProgress,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import dayjs from 'dayjs';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { Purchase, Booking, PagedResult } from '../types';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [pRes, bRes] = await Promise.all([
        api.get<PagedResult<Purchase>>('/purchases/my', { params: { page: 1, pageSize: 50 } }),
        api.get<Booking[]>('/bookings/my'),
      ]);
      setPurchases(pRes.data.items);
      setBookings(bRes.data);
    } catch { notify('Ошибка загрузки данных профиля', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCancelBooking = async (id: number) => {
    try {
      await api.delete(`/bookings/${id}`);
      notify('Запись отменена', 'info');
      fetchData();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка отмены', 'error');
    }
  };

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress /></Box>;

  return (
    <>
      <Typography variant="h4" mb={1}>Личный кабинет</Typography>
      <Typography color="text.secondary" mb={4}>
        {user?.fullName} — {user?.email}
      </Typography>

      <Grid container spacing={4}>
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
              <Typography variant="h6" gutterBottom>Мои записи на тренировки</Typography>
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
                        secondary={`${dayjs(b.trainingStartTime).format('DD.MM.YYYY HH:mm')} — ${b.coachName}`}
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
      </Grid>
    </>
  );
}
