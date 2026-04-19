import {
  Grid, Card, CardContent, CardActions, Typography, Button, Box, IconButton,
  Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List,
  ListItem, ListItemText,
} from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat, Delete } from '@mui/icons-material';
import dayjs from 'dayjs';
import type { ProgressEntry, ProgressTracker } from '../types';

interface ProgressTrackersBoardProps {
  trackers: ProgressTracker[];
  entriesOpen: boolean;
  selectedTracker: ProgressTracker | null;
  entries: ProgressEntry[];
  newValue: string;
  showDelete?: boolean;
  canAddEntry?: boolean;
  onOpenEntries: (tracker: ProgressTracker) => void;
  onCloseEntries: () => void;
  onDelete?: (trackerId: number) => void;
  onNewValueChange: (value: string) => void;
  onAddEntry?: () => void;
}

export default function ProgressTrackersBoard({
  trackers,
  entriesOpen,
  selectedTracker,
  entries,
  newValue,
  showDelete = false,
  canAddEntry = true,
  onOpenEntries,
  onCloseEntries,
  onDelete,
  onNewValueChange,
  onAddEntry,
}: ProgressTrackersBoardProps) {
  const changeIcon = (percent: number | null) => {
    if (percent === null) return <TrendingFlat color="action" />;
    if (percent > 0) return <TrendingUp color="success" />;
    if (percent < 0) return <TrendingDown color="error" />;
    return <TrendingFlat color="action" />;
  };

  if (trackers.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" mt={4}>
        Пока нет трекеров.
      </Typography>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {trackers.map((t) => (
          <Grid item xs={12} sm={6} md={4} key={t.id}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Typography variant="h6">{t.title}</Typography>
                  {showDelete && onDelete && (
                    <IconButton size="small" onClick={() => onDelete(t.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Цель: {t.goalValue} {t.unit}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {changeIcon(t.changePercent)}
                  <Typography variant="h5">
                    {t.lastValue !== null ? `${t.lastValue} ${t.unit}` : '—'}
                  </Typography>
                  {t.changePercent !== null && (
                    <Chip
                      size="small"
                      label={`${t.changePercent > 0 ? '+' : ''}${t.changePercent}%`}
                      color={t.changePercent > 0 ? 'success' : t.changePercent < 0 ? 'error' : 'default'}
                    />
                  )}
                </Stack>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => onOpenEntries(t)}>Все замеры</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={entriesOpen} onClose={onCloseEntries} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTracker?.title} — замеры</DialogTitle>
        <DialogContent>
          {canAddEntry && (
            <Stack direction="row" spacing={1} mb={2} mt={1}>
              <TextField
                label="Новый замер"
                type="number"
                size="small"
                fullWidth
                value={newValue}
                onChange={(e) => onNewValueChange(e.target.value)}
              />
              <Button variant="contained" onClick={onAddEntry} disabled={!newValue}>
                Добавить
              </Button>
            </Stack>
          )}
          {entries.length === 0 ? (
            <Typography color="text.secondary">Нет замеров</Typography>
          ) : (
            <List dense>
              {entries.map((e) => (
                <ListItem key={e.id}>
                  <ListItemText
                    primary={`${e.value} ${selectedTracker?.unit}`}
                    secondary={dayjs(e.dateRecorded).format('DD.MM.YYYY HH:mm')}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseEntries}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
