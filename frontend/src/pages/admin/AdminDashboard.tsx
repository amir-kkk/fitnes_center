import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import { People, CardMembership, FitnessCenter, ShoppingCart } from '@mui/icons-material';
import api from '../../api/client';
import type { PagedResult } from '../../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, memberships: 0, trainings: 0, purchases: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, m, t, p] = await Promise.all([
          api.get<PagedResult<unknown>>('/admin/users', { params: { page: 1, pageSize: 1 } }),
          api.get<PagedResult<unknown>>('/memberships', { params: { page: 1, pageSize: 1 } }),
          api.get<PagedResult<unknown>>('/trainings', { params: { page: 1, pageSize: 1 } }),
          api.get<PagedResult<unknown>>('/purchases', { params: { page: 1, pageSize: 1 } }),
        ]);
        setStats({
          users: u.data.totalCount,
          memberships: m.data.totalCount,
          trainings: t.data.totalCount,
          purchases: p.data.totalCount,
        });
      } catch { /* пропускаем */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Box textAlign="center" mt={4}><CircularProgress /></Box>;

  const cards = [
    { label: 'Пользователи', value: stats.users, icon: <People fontSize="large" />, color: '#1565c0' },
    { label: 'Абонементы', value: stats.memberships, icon: <CardMembership fontSize="large" />, color: '#2e7d32' },
    { label: 'Тренировки', value: stats.trainings, icon: <FitnessCenter fontSize="large" />, color: '#ff6f00' },
    { label: 'Покупки', value: stats.purchases, icon: <ShoppingCart fontSize="large" />, color: '#c62828' },
  ];

  return (
    <>
      <Typography variant="h4" mb={3}>Обзор</Typography>
      <Grid container spacing={3}>
        {cards.map((c) => (
          <Grid item xs={12} sm={6} md={3} key={c.label}>
            <Card elevation={2}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ color: c.color }}>{c.icon}</Box>
                <Box>
                  <Typography variant="h4">{c.value}</Typography>
                  <Typography color="text.secondary">{c.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
