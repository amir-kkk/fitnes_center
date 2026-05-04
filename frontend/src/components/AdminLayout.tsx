import { useEffect } from 'react';
import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Toolbar, AppBar, IconButton,
} from '@mui/material';
import {
  People, CardMembership, FitnessCenter, ShoppingCart,
  ArrowBack, Dashboard, SportsKabaddi, EventAvailable, History,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

const DRAWER_WIDTH = 240;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isManager = user?.role === 'Manager';
  const isAdmin = user?.role === 'Admin';

  const menuItems = isManager
    ? [
        { text: 'Тренеры', icon: <SportsKabaddi />, path: '/admin/coaches' },
        { text: 'Абонементы', icon: <CardMembership />, path: '/admin/memberships' },
        { text: 'Групповые тренировки', icon: <FitnessCenter />, path: '/admin/trainings' },
        { text: 'Персональные тренировки', icon: <EventAvailable />, path: '/admin/personal-workouts' },
        { text: 'Покупки', icon: <ShoppingCart />, path: '/admin/purchases' },
      ]
    : [
        { text: 'Обзор', icon: <Dashboard />, path: '/admin' },
        { text: 'Пользователи', icon: <People />, path: '/admin/users' },
        { text: 'Audit Log', icon: <History />, path: '/admin/audit-logs' },
      ];

  useEffect(() => {
    if (isManager && location.pathname === '/admin') {
      navigate('/admin/coaches', { replace: true });
      return;
    }

    if (
      isAdmin &&
      location.pathname !== '/admin' &&
      location.pathname !== '/admin/users' &&
      location.pathname !== '/admin/audit-logs'
    ) {
      navigate('/admin', { replace: true });
    }
  }, [isManager, isAdmin, location.pathname, navigate]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">{isManager ? 'Панель менеджера' : 'Админ-панель'}</Typography>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}>
        <Toolbar />
        <List>
          {menuItems.map((item) => (
            <ListItemButton key={item.path} component={RouterLink} to={item.path}
              selected={location.pathname === item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
