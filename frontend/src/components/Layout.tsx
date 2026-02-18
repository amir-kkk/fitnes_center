import { useState } from 'react';
import { Outlet, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, IconButton,
  Menu, MenuItem, Avatar, Chip,
} from '@mui/material';
import { FitnessCenter, Person } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

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
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <FitnessCenter sx={{ mr: 1 }} />
          <Typography variant="h6" component={RouterLink} to="/"
            sx={{ flexGrow: 0, mr: 4, textDecoration: 'none', color: 'inherit' }}>
            FitnessCenter
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <Button color="inherit" component={RouterLink} to="/memberships">Абонементы</Button>
            <Button color="inherit" component={RouterLink} to="/trainings">Расписание</Button>
            {user && <Button color="inherit" component={RouterLink} to="/progress">Прогресс</Button>}
            {user && <Button color="inherit" component={RouterLink} to="/profile">Кабинет</Button>}
            {user?.role === 'Admin' && (
              <Chip label="Админ-панель" color="secondary" size="small" clickable
                component={RouterLink} to="/admin" sx={{ ml: 1, alignSelf: 'center' }} />
            )}
          </Box>

          {user ? (
            <>
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  <Person />
                </Avatar>
              </IconButton>
              <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
                <MenuItem disabled>
                  <Typography variant="body2">{user.fullName} ({user.role})</Typography>
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                  Личный кабинет
                </MenuItem>
                <MenuItem onClick={handleLogout}>Выйти</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" component={RouterLink} to="/login">Войти</Button>
              <Button variant="outlined" color="inherit" component={RouterLink} to="/register">
                Регистрация
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} FitnessCenter. Учебный проект.
        </Typography>
      </Box>
    </Box>
  );
}
