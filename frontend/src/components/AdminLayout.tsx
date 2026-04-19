import { Outlet, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Typography, Toolbar, AppBar, IconButton,
} from '@mui/material';
import {
  People, CardMembership, FitnessCenter, ShoppingCart,
  ArrowBack, Dashboard, SportsKabaddi, EventAvailable,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const menuItems = [
  { text: 'Обзор', icon: <Dashboard />, path: '/admin' },
  { text: 'Пользователи', icon: <People />, path: '/admin/users' },
  { text: 'Тренеры', icon: <SportsKabaddi />, path: '/admin/coaches' },
  { text: 'Абонементы', icon: <CardMembership />, path: '/admin/memberships' },
  { text: 'Групповые тренировки', icon: <FitnessCenter />, path: '/admin/trainings' },
  { text: 'Персональные тренировки', icon: <EventAvailable />, path: '/admin/personal-workouts' },
  { text: 'Покупки', icon: <ShoppingCart />, path: '/admin/purchases' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" onClick={() => navigate('/')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6">Админ-панель</Typography>
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
