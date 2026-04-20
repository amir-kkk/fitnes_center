import { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, IconButton,
  Menu, MenuItem, Avatar, Chip,
} from '@mui/material';
import { FitnessCenter, Person } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import AiTrainerWidget from './AiTrainerWidget';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleLogout = () => {
    logout();
    setAnchorEl(null);
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <FitnessCenter sx={{ mr: 1 }} />
          <Typography variant="h6" component={RouterLink} to="/"
            sx={{ flexGrow: 0, mr: 4, textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
            FitnessCenter
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5 }}>
            {user?.role !== 'Trainer' && (
              <Button color="inherit" component={RouterLink} to="/memberships"
                sx={{ borderRadius: 20 }}>Абонементы</Button>
            )}
            {user?.role !== 'Trainer' && (
              <Button color="inherit" component={RouterLink} to="/trainings"
                sx={{ borderRadius: 20 }}>Расписание</Button>
            )}
            {user && (
              <Button color="inherit" component={RouterLink} to="/personal-workouts"
                sx={{ borderRadius: 20 }}>
                Персональные тренировки
              </Button>
            )}
            {user && user.role !== 'Trainer' && <Button color="inherit" component={RouterLink} to="/progress"
              sx={{ borderRadius: 20 }}>Прогресс</Button>}
            {user?.role === 'Trainer' && (
              <Button color="inherit" component={RouterLink} to="/trainer/schedule"
                sx={{ borderRadius: 20 }}>
                Мое расписание
              </Button>
            )}
            {user && <Button color="inherit" component={RouterLink} to="/profile"
              sx={{ borderRadius: 20 }}>Кабинет</Button>}
            {user?.role === 'Admin' && (
              <Chip label="Админ" size="small" clickable
                component={RouterLink} to="/admin"
                sx={{ ml: 1, alignSelf: 'center', bgcolor: '#FFFFFF', color: '#2C2C2C', fontWeight: 600,
                  '&:hover': { bgcolor: '#D9D9D9' } }} />
            )}
          </Box>

          {user ? (
            <>
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ borderRadius: 12 }}>
                <Avatar sx={{ width: 34, height: 34, bgcolor: '#D9D9D9', color: '#2C2C2C' }}>
                  <Person fontSize="small" />
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}
                slotProps={{ paper: { sx: { borderRadius: 3, mt: 1 } } }}>
                <MenuItem disabled>
                  <Typography variant="body2">{user.fullName}</Typography>
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                  Личный кабинет
                </MenuItem>
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/login"
                sx={{ borderRadius: 20 }}>Войти</Button>
              <Button variant="outlined" component={RouterLink} to="/register"
                sx={{ borderRadius: 20, borderColor: '#FFFFFF', color: '#FFFFFF',
                  '&:hover': { borderColor: '#D9D9D9', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                Регистрация
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: '#2C2C2C' }}>
        <Typography variant="body2" sx={{ color: '#D9D9D9' }}>
          &copy; {new Date().getFullYear()} FitnessCenter. Учебный проект.
        </Typography>
      </Box>

      <AiTrainerWidget />
    </Box>
  );
}
