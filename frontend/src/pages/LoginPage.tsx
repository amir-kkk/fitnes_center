import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'Manager') navigate('/admin');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={8}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%' }}>
        <Typography variant="h5" textAlign="center" mb={3}>Вход</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="Email" type="email" fullWidth required
            value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Пароль" type="password" fullWidth required
            value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? 'Загрузка...' : 'Войти'}
          </Button>
        </form>
        <Typography textAlign="center" mt={2} variant="body2">
          Нет аккаунта? <RouterLink to="/register">Зарегистрироваться</RouterLink>
        </Typography>
      </Paper>
    </Box>
  );
}
