import { useEffect, useState } from 'react';
import {
  Typography, Box, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import api from '../api/client';
import { useNotificationStore } from '../stores/notificationStore';
import type { ProgressTracker, ProgressEntry } from '../types';
import ProgressTrackersBoard from '../components/ProgressTrackersBoard';

export default function ProgressPage() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [trackers, setTrackers] = useState<ProgressTracker[]>([]);
  const [loading, setLoading] = useState(true);

  // Диалог создания трекера
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newUnit, setNewUnit] = useState('');

  // Диалог записей
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<ProgressTracker | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [newValue, setNewValue] = useState('');

  const fetchTrackers = async () => {
    try {
      const { data } = await api.get<ProgressTracker[]>('/progress/trackers');
      setTrackers(data);
    } catch { notify('Ошибка загрузки трекеров', 'error'); }
    setLoading(false);
  };

  useEffect(() => { fetchTrackers(); }, []);

  const handleCreate = async () => {
    try {
      await api.post('/progress/trackers', {
        title: newTitle, goalValue: parseFloat(newGoal), unit: newUnit,
      });
      notify('Трекер создан', 'success');
      setCreateOpen(false);
      setNewTitle(''); setNewGoal(''); setNewUnit('');
      fetchTrackers();
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка создания', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/progress/trackers/${id}`);
      notify('Трекер удалён', 'info');
      fetchTrackers();
    } catch { notify('Ошибка удаления', 'error'); }
  };

  const openEntries = async (tracker: ProgressTracker) => {
    setSelectedTracker(tracker);
    try {
      const { data } = await api.get<ProgressEntry[]>(`/progress/trackers/${tracker.id}/entries`);
      setEntries(data);
      setEntriesOpen(true);
    } catch { notify('Ошибка загрузки записей', 'error'); }
  };

  const handleAddEntry = async () => {
    if (!selectedTracker) return;
    try {
      await api.post(`/progress/trackers/${selectedTracker.id}/entries`, {
        value: parseFloat(newValue),
      });
      setNewValue('');
      const { data } = await api.get<ProgressEntry[]>(
        `/progress/trackers/${selectedTracker.id}/entries`
      );
      setEntries(data);
      fetchTrackers();
      notify('Замер добавлен', 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка', 'error');
    }
  };

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress /></Box>;

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Мой прогресс</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
          Новый трекер
        </Button>
      </Box>

      <ProgressTrackersBoard
        trackers={trackers}
        entriesOpen={entriesOpen}
        selectedTracker={selectedTracker}
        entries={entries}
        newValue={newValue}
        showDelete
        canAddEntry
        onOpenEntries={openEntries}
        onCloseEntries={() => setEntriesOpen(false)}
        onDelete={handleDelete}
        onNewValueChange={setNewValue}
        onAddEntry={handleAddEntry}
      />

      {/* Диалог создания трекера */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Новый трекер</DialogTitle>
        <DialogContent>
          <TextField label="Название (напр. Жим лёжа)" fullWidth margin="dense"
            value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <TextField label="Цель" type="number" fullWidth margin="dense"
            value={newGoal} onChange={(e) => setNewGoal(e.target.value)} />
          <TextField label="Единица измерения (кг, мин, км...)" fullWidth margin="dense"
            value={newUnit} onChange={(e) => setNewUnit(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleCreate}>Создать</Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
