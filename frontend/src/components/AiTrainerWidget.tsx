import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, CircularProgress, Fab, IconButton, Paper, Stack, TextField, Typography, Button,
} from '@mui/material';
import { SmartToy, Close, Send } from '@mui/icons-material';
import api from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import type { AiChatMessage, AiTrainerChatResponse, AiTrainerStatus, PagedResult, Purchase } from '../types';

export default function AiTrainerWidget() {
  const user = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.showNotification);

  const [open, setOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<AiTrainerStatus | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: 'assistant',
      content: 'Привет! Я AI Тренер. Задай вопрос по тренировкам, восстановлению или питанию.',
    },
  ]);
  const [input, setInput] = useState('');

  const normalizeStatus = (raw: any): AiTrainerStatus => ({
    hasActiveMembership: Boolean(raw?.hasActiveMembership ?? raw?.HasActiveMembership ?? false),
    remainingMessages: Number(raw?.remainingMessages ?? raw?.RemainingMessages ?? 0),
    canUseChat: Boolean(raw?.canUseChat ?? raw?.CanUseChat ?? false),
    membershipExpiresAt: raw?.membershipExpiresAt ?? raw?.MembershipExpiresAt ?? null,
  });

  const normalizeChatResponse = (raw: any): AiTrainerChatResponse => ({
    reply: String(raw?.reply ?? raw?.Reply ?? ''),
    remainingMessages: Number(raw?.remainingMessages ?? raw?.RemainingMessages ?? 0),
  });

  const roleEligible = useMemo(
    () => !!user && (user.role === 'User' || user.role === 'Client'),
    [user]
  );

  const loadStatus = async () => {
    if (!user || (user.role !== 'User' && user.role !== 'Client')) {
      setStatus(null);
      setLoadingStatus(false);
      return;
    }

    setLoadingStatus(true);
    try {
      const { data } = await api.get<AiTrainerStatus>('/ai-trainer/status');
      const normalized = normalizeStatus(data);
      if (!normalized.hasActiveMembership) {
        try {
          const { data: purchases } = await api.get<PagedResult<Purchase>>('/purchases/my', {
            params: { page: 1, pageSize: 1 },
          });
          if (purchases.totalCount > 0) {
            const remaining = normalized.remainingMessages > 0 ? normalized.remainingMessages : 10;
            setStatus({
              ...normalized,
              hasActiveMembership: true,
              remainingMessages: remaining,
              canUseChat: true,
            });
          } else {
            setStatus(normalized);
          }
        } catch {
          setStatus(normalized);
        }
      } else {
        setStatus(normalized);
      }
    } catch (err: any) {
      setStatus(null);
      const detail = err?.response?.data?.detail;
      notify(`AI Тренер недоступен${detail ? `: ${detail}` : ''}`, 'warning');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [user?.id, user?.role]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !status?.canUseChat) return;

    const historyForRequest = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const nextMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post<AiTrainerChatResponse>('/ai-trainer/chat', {
        message: text,
        history: historyForRequest,
      });
      const normalized = normalizeChatResponse(data);

      setMessages((prev) => [...prev, { role: 'assistant', content: normalized.reply }]);
      setStatus((prev) => prev ? {
        ...prev,
        remainingMessages: normalized.remainingMessages,
        canUseChat: normalized.remainingMessages > 0 && prev.hasActiveMembership
      } : prev);
    } catch (err: any) {
      notify(err.response?.data?.detail || 'Ошибка AI тренера', 'error');
      // В случае ложного "лимит исчерпан" принудительно обновим статус,
      // чтобы синхронизировать фронт с сервером.
      await loadStatus();
    } finally {
      setSending(false);
    }
  };

  if (!roleEligible) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', right: 24, bottom: 24, zIndex: 1400 }}>
      {open ? (
        <Paper elevation={8} sx={{ width: 380, height: 560, p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" px={0.5} pb={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SmartToy color="primary" />
              <Typography fontWeight={700}>AI Тренер</Typography>
            </Stack>
            <IconButton size="small" onClick={() => setOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>

          <Alert severity="warning" sx={{ mb: 1, fontSize: 12 }}>
            Советы ИИ носят исключительно ознакомительный характер и не являются медицинской рекомендацией.
          </Alert>

          {loadingStatus ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : !status ? (
            <Stack sx={{ flex: 1 }} spacing={1} justifyContent="center" alignItems="center">
              <Typography textAlign="center" color="text.secondary">
                Не удалось получить статус AI Тренера.
              </Typography>
              <Button size="small" variant="outlined" onClick={loadStatus}>Повторить</Button>
            </Stack>
          ) : !status.hasActiveMembership ? (
            <Stack sx={{ flex: 1 }} spacing={1} justifyContent="center" alignItems="center">
              <Alert severity="info" sx={{ width: '100%' }}>
                AI Тренер доступен только при активном абонементе.
              </Alert>
              <Typography variant="caption" color="text.secondary">
                Купите абонемент и обновите страницу.
              </Typography>
            </Stack>
          ) : (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Осталось сообщений сегодня: {status.remainingMessages}/10
              </Typography>

              <Box sx={{ flex: 1, overflowY: 'auto', px: 0.5, py: 0.5 }}>
                <Stack spacing={1}>
                  {messages.map((m, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                        maxWidth: '85%',
                        bgcolor: m.role === 'user' ? 'primary.main' : 'grey.200',
                        color: m.role === 'user' ? 'primary.contrastText' : 'text.primary',
                        px: 1.2,
                        py: 0.9,
                        borderRadius: 2,
                        whiteSpace: 'pre-wrap',
                        fontSize: 14,
                      }}
                    >
                      {m.content}
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Stack direction="row" spacing={1} mt={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={status.canUseChat ? 'Введите вопрос...' : 'Дневной лимит исчерпан'}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={sending || !status.canUseChat}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleSend}
                  disabled={sending || !status.canUseChat || !input.trim()}
                  sx={{ minWidth: 44, px: 1 }}
                >
                  {sending ? <CircularProgress size={18} color="inherit" /> : <Send fontSize="small" />}
                </Button>
              </Stack>
            </>
          )}
        </Paper>
      ) : (
        <Fab color="primary" onClick={() => setOpen(true)} aria-label="AI Trainer">
          <SmartToy />
        </Fab>
      )}
    </Box>
  );
}
