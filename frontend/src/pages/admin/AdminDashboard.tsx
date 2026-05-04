import { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, CircularProgress, Box } from '@mui/material';
import { History, ManageAccounts, SportsKabaddi, People } from '@mui/icons-material';
import api from '../../api/client';
import type { AdminOverviewStats } from '../../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminOverviewStats>({
    clientsCount: 0,
    trainersCount: 0,
    managersCount: 0,
    auditLogsLast24hCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<AdminOverviewStats>('/admin/overview-stats');
        setStats(data);
      } catch { /* пропускаем */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <Box textAlign="center" mt={4}><CircularProgress /></Box>;

  const cards = [
    { label: 'Клиенты', value: stats.clientsCount, icon: <People fontSize="large" />, color: '#2C2C2C' },
    { label: 'Тренеры', value: stats.trainersCount, icon: <SportsKabaddi fontSize="large" />, color: '#555555' },
    { label: 'Менеджеры', value: stats.managersCount, icon: <ManageAccounts fontSize="large" />, color: '#2C2C2C' },
    { label: 'Записи в аудите (24ч)', value: stats.auditLogsLast24hCount, icon: <History fontSize="large" />, color: '#555555' },
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
