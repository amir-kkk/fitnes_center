import { create } from 'zustand';

interface NotificationState {
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  open: boolean;
  showNotification: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;
  hideNotification: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: '',
  severity: 'info',
  open: false,
  showNotification: (message, severity = 'info') => set({ message, severity, open: true }),
  hideNotification: () => set({ open: false }),
}));
