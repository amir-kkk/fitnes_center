import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardActions, Container, Stack,
} from '@mui/material';
import { FitnessCenter, CalendarMonth, TrendingUp } from '@mui/icons-material';

const features = [
  {
    icon: <FitnessCenter sx={{ fontSize: 48, color: 'primary.main' }} />,
    title: 'Абонементы',
    desc: 'Выберите подходящий абонемент — от базового до премиум с персональным тренером.',
    link: '/memberships',
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 48, color: 'secondary.main' }} />,
    title: 'Расписание',
    desc: 'Групповые тренировки каждый день: йога, кроссфит, бокс, танцы и пилатес.',
    link: '/trainings',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 48, color: 'success.main' }} />,
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
        background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
        borderRadius: 3, color: 'white', mb: 6,
      }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Добро пожаловать в FitnessCenter
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          Современный фитнес-центр с групповыми тренировками, персональным подходом и удобным отслеживанием прогресса.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" color="secondary" size="large" onClick={() => navigate('/memberships')}>
            Выбрать абонемент
          </Button>
          <Button variant="outlined" sx={{ color: 'white', borderColor: 'white' }} size="large"
            onClick={() => navigate('/register')}>
            Зарегистрироваться
          </Button>
        </Stack>
      </Box>

      {/* Карточки с возможностями */}
      <Container maxWidth="md">
        <Grid container spacing={4}>
          {features.map((f) => (
            <Grid item xs={12} md={4} key={f.title}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }} elevation={2}>
                <CardContent>
                  {f.icon}
                  <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>{f.title}</Typography>
                  <Typography color="text.secondary">{f.desc}</Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: 'center' }}>
                  <Button onClick={() => navigate(f.link)}>Подробнее</Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}
