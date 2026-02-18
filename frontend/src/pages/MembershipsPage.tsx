import { useEffect, useState } from 'react';
import {
  Grid, Card, CardContent, CardActions, Typography, Button, Slider, Box,
  Chip, Stack, CircularProgress,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { Membership, PagedResult } from '../types';

export default function MembershipsPage() {
  const user = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState<number[]>([0, 15000]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PagedResult<Membership>>('/memberships', {
        params: { page: 1, pageSize: 50, minPrice: priceRange[0], maxPrice: priceRange[1] },
      });
      setMemberships(data.items);
    } catch { notify('Ошибка загрузки абонементов', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [priceRange]);

  const handleBuy = async (membershipId: number) => {
    try {
      const { data: purchase } = await api.post('/purchases', { membershipId });
      await api.post(`/purchases/${purchase.id}/pay`);
      notify('Абонемент успешно оплачен!', 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка покупки', 'error');
    }
  };

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress /></Box>;

  return (
    <>
      <Typography variant="h4" mb={3}>Абонементы</Typography>

      <Box sx={{ maxWidth: 400, mb: 4 }}>
        <Typography gutterBottom>Цена: {priceRange[0]} ₽ — {priceRange[1]} ₽</Typography>
        <Slider value={priceRange} onChange={(_, v) => setPriceRange(v as number[])}
          min={0} max={100000000000} step={500} valueLabelDisplay="auto" />
      </Box>

      <Grid container spacing={3}>
        {memberships.map((m) => (
          <Grid item xs={12} sm={6} md={4} key={m.id}>
            <Card elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" gutterBottom>{m.name}</Typography>
                <Chip label={`${m.price.toLocaleString()} ₽ / ${m.durationDays} дн.`}
                  color="primary" sx={{ mb: 2 }} />
                <Typography color="text.secondary" mb={2}>{m.description}</Typography>
                <Stack spacing={0.5}>
                  {m.options.map((opt, i) => (
                    <Box key={i} display="flex" alignItems="center" gap={0.5}>
                      <CheckCircle color="success" fontSize="small" />
                      <Typography variant="body2">{opt}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                {user ? (
                  <Button variant="contained" fullWidth onClick={() => handleBuy(m.id)}>
                    Купить
                  </Button>
                ) : (
                  <Button variant="outlined" fullWidth href="/login">
                    Войдите для покупки
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
        {memberships.length === 0 && (
          <Grid item xs={12}>
            <Typography textAlign="center" color="text.secondary">
              Абонементов в выбранном диапазоне цен не найдено
            </Typography>
          </Grid>
        )}
      </Grid>
    </>
  );
}
