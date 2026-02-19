import { createTheme } from '@mui/material/styles';

// Цветовая схема: #2C2C2C (тёмный), #D9D9D9 (серебро), #FFFFFF (белый)
const theme = createTheme({
  palette: {
    primary: { main: '#2C2C2C', contrastText: '#FFFFFF' },
    secondary: { main: '#D9D9D9', contrastText: '#2C2C2C' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
    text: { primary: '#2C2C2C', secondary: '#6B6B6B' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 20, padding: '8px 22px' },
        containedPrimary: {
          '&:hover': { backgroundColor: '#444444' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E8E8E8',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 20, fontWeight: 500 } },
    },
    MuiPaper: {
      styleOverrides: { rounded: { borderRadius: 16 } },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: 16 } },
    },
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundColor: '#2C2C2C', boxShadow: '0 1px 8px rgba(0,0,0,0.12)' },
      },
    },
  },
});

export default theme;
