import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { normalizePhoneInput } from '../utils/phone';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, fullName, normalizePhoneInput(phoneNumber));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mt={8}>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 420, width: '100%' }}>
        <Typography variant="h5" textAlign="center" mb={3}>Регистрация</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField label="Полное имя" fullWidth required
            value={fullName} onChange={(e) => setFullName(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Email" type="email" fullWidth required
            value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
          <TextField
            label="Номер телефона"
            fullWidth
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+7XXXXXXXXXX"
            sx={{ mb: 2 }}
          />
          <TextField label="Пароль" type="password" fullWidth required
            value={password} onChange={(e) => setPassword(e.target.value)}
            helperText="Минимум 6 символов" sx={{ mb: 3 }} />
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}>
            {loading ? 'Загрузка...' : 'Зарегистрироваться'}
          </Button>
        </form>
        <Typography textAlign="center" mt={2} variant="body2">
          Уже есть аккаунт? <RouterLink to="/login">Войти</RouterLink>
        </Typography>
      </Paper>
    </Box>
  );
}
