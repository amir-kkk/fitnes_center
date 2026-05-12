import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions, Container, Stack,
} from '@mui/material';
import { FitnessCenter, CalendarMonth, TrendingUp } from '@mui/icons-material';

const features = [
  {
    icon: <FitnessCenter sx={{ fontSize: 48, color: '#2C2C2C' }} />,
    title: 'Абонементы',
    desc: 'Выберите подходящий абонемент — от базового до премиум с персональным тренером.',
    link: '/memberships',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 48, color: '#2C2C2C' }} />,
    title: 'Расписание',
    desc: 'Групповые тренировки каждый день: йога, кроссфит, бокс, танцы и пилатес.',
    link: '/trainings',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 48, color: '#2C2C2C' }} />,
    title: 'Прогресс',
    desc: 'Отслеживайте свои результаты: создавайте трекеры и фиксируйте замеры.',
    link: '/progress',
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Hero-секция */}
      <Box sx={{
        textAlign: 'center', py: 10,
        background: 'linear-gradient(135deg, #2C2C2C 0%, #1a1a1a 100%)',
        borderRadius: 4, color: '#FFFFFF', mb: 6,
      }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Добро пожаловать в Центр фитнеса и здоровья
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, color: '#D9D9D9' }}>
          Современный фитнес-центр с групповыми тренировками, персональным подходом
          и удобным отслеживанием прогресса.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" size="large" onClick={() => navigate('/memberships')}
            sx={{ bgcolor: '#FFFFFF', color: '#2C2C2C', borderRadius: 25, px: 4,
              '&:hover': { bgcolor: '#D9D9D9' } }}>
            Выбрать абонемент
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/register')}
            sx={{ borderColor: '#D9D9D9', color: '#D9D9D9', borderRadius: 25, px: 4,
              '&:hover': { borderColor: '#FFFFFF', color: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' } }}>
            Зарегистрироваться
          </Button>
        </Stack>
      </Box>

      {/* Карточки возможностей */}
      <Container maxWidth="md">
        <Grid container spacing={4}>
          {features.map((f) => (
            <Grid item xs={12} md={4} key={f.title}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  {f.icon}
                  <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>{f.title}</Typography>
                  <Typography color="text.secondary">{f.desc}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button onClick={() => navigate(f.link)}
                    sx={{ borderRadius: 20 }}>Подробнее</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
