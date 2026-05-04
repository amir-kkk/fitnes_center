import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, CircularProgress, Divider, Stack, TextField, Typography,
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
  const [trackerValues, setTrackerValues] = useState<Record<number, string>>({});
  const [newMetricTitle, setNewMetricTitle] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  const fillForm = (items: ProgressTracker[]) => {
    const weightTracker = items.find((t) => t.title.toLowerCase() === 'вес');
    setWeightKg(weightTracker?.lastValue?.toString() ?? '');

    const nextValues: Record<number, string> = {};
    items
      .filter((t) => t.title.toLowerCase() !== 'вес')
      .forEach((t) => {
        nextValues[t.id] = t.lastValue?.toString() ?? '';
      });
    setTrackerValues(nextValues);
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
    const updates: TrainerUpdateProgressPayload['updates'] = [];
    const weightTracker = trackers.find((t) => t.title.toLowerCase() === 'вес');
    if (weightKg.trim() !== '') {
      updates.push({
        trackerId: weightTracker?.id,
        title: 'Вес',
        unit: weightTracker?.unit || 'кг',
        value: Number(weightKg),
      });
    }

    trackers
      .filter((t) => t.title.toLowerCase() !== 'вес')
      .forEach((t) => {
        const value = trackerValues[t.id];
        if (value !== undefined && value.trim() !== '') {
          updates.push({ trackerId: t.id, value: Number(value) });
        }
      });

    if (newMetricTitle.trim() && newMetricValue.trim()) {
      updates.push({
        title: newMetricTitle.trim(),
        unit: newMetricUnit.trim() || 'ед.',
        value: Number(newMetricValue),
      });
    }

    if (updates.length === 0) {
      notify('Нет данных для сохранения', 'warning');
      return;
    }

    const payload: TrainerUpdateProgressPayload = { clientId: id, updates };

    try {
      const { data } = await api.post<ProgressTracker[]>('/trainer/update-progress', payload);
      setTrackers(data);
      fillForm(data);
      setNewMetricTitle('');
      setNewMetricUnit('');
      setNewMetricValue('');
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
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
            <TextField label="Вес (кг)" type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </Stack>

          <Typography variant="subtitle1" mb={1}>Дополнительные показатели клиента</Typography>
          <Stack spacing={2} mb={2}>
            {trackers.filter((t) => t.title.toLowerCase() !== 'вес').map((t) => (
              <TextField
                key={t.id}
                label={`${t.title}${t.unit ? ` (${t.unit})` : ''}`}
                type="number"
                value={trackerValues[t.id] ?? ''}
                onChange={(e) => setTrackerValues((prev) => ({ ...prev, [t.id]: e.target.value }))}
              />
            ))}
            {trackers.filter((t) => t.title.toLowerCase() !== 'вес').length === 0 && (
              <Typography color="text.secondary">У клиента пока нет дополнительных показателей.</Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" mb={1}>Добавить новый показатель</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Название показателя"
              value={newMetricTitle}
              onChange={(e) => setNewMetricTitle(e.target.value)}
            />
            <TextField
              label="Единица измерения"
              value={newMetricUnit}
              onChange={(e) => setNewMetricUnit(e.target.value)}
              placeholder="например, см"
            />
            <TextField
              label="Значение"
              type="number"
              value={newMetricValue}
              onChange={(e) => setNewMetricValue(e.target.value)}
            />
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
