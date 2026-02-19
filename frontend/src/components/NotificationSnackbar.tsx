import { Alert, Snackbar } from '@mui/material';
import { useNotificationStore } from '../stores/notificationStore';

export default function NotificationSnackbar() {
  const { open, message, severity, hideNotification } = useNotificationStore();

  return (
    <Snackbar open={open} autoHideDuration={4000} onClose={hideNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={hideNotification} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
