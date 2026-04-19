import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, CircularProgress, Stack, TextField, Typography,
} from '@mui/material';
import api from '../api/client';
import { useNotificationStore } from '../stores/notificationStore';
import ProgressTrackersBoard from '../components/ProgressTrackersBoard';
import type { ProgressEntry, ProgressTracker, TrainerUpdateProgressPayload } from '../types';

export default function TrainerClientProgressPage() {
  const { id } = useParams();
  const notify = useNotificationStore((s) => s.showNotification);
  const [loading, setLoading] = useState(true);
  const [trackers, setTrackers] = useState<ProgressTracker[]>([]);
  const [entriesOpen, setEntriesOpen] = useState(false);
  const [selectedTracker, setSelectedTracker] = useState<ProgressTracker | null>(null);
  const [entries, setEntries] = useState<ProgressEntry[]>([]);

  const [weightKg, setWeightKg] = useState('');
  const [chestCm, setChestCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [hipsCm, setHipsCm] = useState('');

  const fillForm = (items: ProgressTracker[]) => {
    const lower = new Map(items.map((t) => [t.title.toLowerCase(), t]));
    setWeightKg(lower.get('вес')?.lastValue?.toString() ?? '');
    setChestCm(lower.get('грудь')?.lastValue?.toString() ?? '');
    setWaistCm(lower.get('талия')?.lastValue?.toString() ?? '');
    setHipsCm(lower.get('бедра')?.lastValue?.toString() ?? '');
  };

  const fetchProgress = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<ProgressTracker[]>(`/trainer/client-progress/${id}`);
      setTrackers(data);
      fillForm(data);
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка загрузки прогресса клиента', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProgress();
  }, [id]);

  const openEntries = async (tracker: ProgressTracker) => {
    setSelectedTracker(tracker);
    try {
      const { data } = await api.get<ProgressEntry[]>(
        `/trainer/client-progress/${id}/trackers/${tracker.id}/entries`
      );
      setEntries(data);
      setEntriesOpen(true);
    } catch {
      notify('Ошибка загрузки истории замеров', 'error');
    }
  };

  const handleSave = async () => {
    if (!id) return;
    const payload: TrainerUpdateProgressPayload = { clientId: id };
    if (weightKg) payload.weightKg = Number(weightKg);
    if (chestCm) payload.chestCm = Number(chestCm);
    if (waistCm) payload.waistCm = Number(waistCm);
    if (hipsCm) payload.hipsCm = Number(hipsCm);

    try {
      const { data } = await api.post<ProgressTracker[]>('/trainer/update-progress', payload);
      setTrackers(data);
      notify('Изменения прогресса сохранены', 'success');
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка сохранения прогресса', 'error');
    }
  };

  if (loading) return <Box textAlign="center" mt={8}><CircularProgress /></Box>;

  return (
    <>
      <Typography variant="h4" mb={3}>Прогресс клиента</Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Редактирование показателей</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label="Вес (кг)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
            <TextField label="Грудь (см)" type="number" value={chestCm} onChange={(e) => setChestCm(e.target.value)} />
            <TextField label="Талия (см)" type="number" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} />
            <TextField label="Бедра (см)" type="number" value={hipsCm} onChange={(e) => setHipsCm(e.target.value)} />
          </Stack>
          <Button sx={{ mt: 2 }} variant="contained" onClick={handleSave}>
            Сохранить изменения
          </Button>
        </CardContent>
      </Card>

      <ProgressTrackersBoard
        trackers={trackers}
        entriesOpen={entriesOpen}
        selectedTracker={selectedTracker}
        entries={entries}
        newValue=""
        canAddEntry={false}
        onOpenEntries={openEntries}
        onCloseEntries={() => setEntriesOpen(false)}
        onNewValueChange={() => {}}
      />
    </>
  );
}
