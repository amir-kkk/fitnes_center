using System.ClientModel;
using System.Text;
using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using OpenAI;
using OpenAI.Chat;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

public class AiTrainerService
{
    private const int DailyLimit = 10;

    private readonly AppDbContext _db;
    private readonly MembershipAccessService _membershipAccess;
    private readonly IConfiguration _config;

    public AiTrainerService(
        AppDbContext db,
        MembershipAccessService membershipAccess,
        IConfiguration config)
    {
        _db = db;
        _membershipAccess = membershipAccess;
        _config = config;
    }

    public async Task<AiTrainerStatusDto> GetStatusAsync(Guid userId)
    {
        var (hasActiveMembership, expiresAt) = await _membershipAccess.GetActiveMembershipInfoAsync(userId);
        var remaining = await GetRemainingMessagesAsync(userId);

        return new AiTrainerStatusDto(
            hasActiveMembership,
            remaining,
            hasActiveMembership && remaining > 0,
            expiresAt);
    }

    public async Task<AiTrainerChatResponseDto> SendMessageAsync(Guid userId, AiTrainerChatRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            throw new InvalidOperationException("Сообщение не должно быть пустым");

        var (hasActiveMembership, _) = await _membershipAccess.GetActiveMembershipInfoAsync(userId);
        if (!hasActiveMembership)
            throw new UnauthorizedAccessException("AI Trainer доступен только при активном абонементе");

        var count = await GetTodayCountAsync(userId);
        if (count >= DailyLimit)
            throw new InvalidOperationException("Дневной лимит AI Trainer исчерпан (10 сообщений)");

        var systemPrompt = await BuildSystemPromptAsync(userId);
        var reply = await RequestDeepSeekAsync(systemPrompt, request);

        // Списываем лимит только после успешного ответа модели.
        _db.AiTrainerMessages.Add(new AiTrainerMessage
        {
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var remaining = Math.Max(0, DailyLimit - (count + 1));

        return new AiTrainerChatResponseDto(reply, remaining);
    }

    private async Task<int> GetTodayCountAsync(Guid userId)
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        return await _db.AiTrainerMessages.CountAsync(x =>
            x.UserId == userId &&
            x.CreatedAt >= today &&
            x.CreatedAt < tomorrow);
    }

    private async Task<int> GetRemainingMessagesAsync(Guid userId)
    {
        var count = await GetTodayCountAsync(userId);
        return Math.Max(0, DailyLimit - count);
    }

    private async Task<string> BuildSystemPromptAsync(Guid userId)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException("Пользователь не найден");

        var trackers = await _db.ProgressTrackers
            .Include(t => t.Entries)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        var groupTrainings = await _db.Bookings
            .Include(b => b.Training).ThenInclude(t => t.Category)
            .Include(b => b.Training).ThenInclude(t => t.Trainer)
            .Where(b => b.UserId == userId && b.Status == BookingStatus.Active)
            .OrderByDescending(b => b.Training.StartTime)
            .Take(8)
            .Select(b => $"Групповая: {b.Training.Description}, {b.Training.StartTime:yyyy-MM-dd HH:mm} UTC, тренер {b.Training.Trainer.FullName}")
            .ToListAsync();

        var personalTrainings = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Where(w => w.ClientId == userId && w.Status != PersonalWorkoutStatus.Available)
            .OrderByDescending(w => w.DateTime)
            .Take(8)
            .Select(w => $"Персональная: {w.DateTime:yyyy-MM-dd HH:mm} UTC, тренер {w.Trainer.FullName}")
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Ты AI-фитнес тренер в приложении фитнес-центра.");
        sb.AppendLine("Давай практичные, безопасные и короткие рекомендации по тренировкам, восстановлению и питанию.");
        sb.AppendLine("Никогда не выдавай медицинский диагноз и всегда напоминай обратиться к врачу при боли или хронических симптомах.");
        sb.AppendLine();
        sb.AppendLine($"Пользователь: {user.FullName} ({user.Email})");
        sb.AppendLine("Антропометрия и прогресс:");

        if (trackers.Count == 0)
        {
            sb.AppendLine("- Нет данных прогресса.");
        }
        else
        {
            foreach (var tracker in trackers)
            {
                var last = tracker.Entries.OrderByDescending(e => e.DateRecorded).FirstOrDefault();
                var valueText = last == null ? "нет замеров" : $"{last.Value} {tracker.Unit} ({last.DateRecorded:yyyy-MM-dd})";
                sb.AppendLine($"- {tracker.Title}: {valueText}");
            }
        }

        sb.AppendLine();
        sb.AppendLine("Последние тренировки:");
        if (groupTrainings.Count == 0 && personalTrainings.Count == 0)
        {
            sb.AppendLine("- Нет истории тренировок.");
        }
        else
        {
            foreach (var item in groupTrainings) sb.AppendLine($"- {item}");
            foreach (var item in personalTrainings) sb.AppendLine($"- {item}");
        }

        return sb.ToString();
    }

    private async Task<string> RequestDeepSeekAsync(string systemPrompt, AiTrainerChatRequestDto request)
    {
        var apiKey = _config["DeepSeek:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Не настроен DeepSeek:ApiKey");

        var model = _config["DeepSeek:Model"] ?? "deepseek-chat";
        var baseUrl = _config["DeepSeek:BaseUrl"] ?? "https://api.deepseek.com";

        var client = new ChatClient(
            model,
            new ApiKeyCredential(apiKey),
            new OpenAIClientOptions { Endpoint = new Uri(baseUrl) });

        var messages = new List<ChatMessage> { new SystemChatMessage(systemPrompt) };

        foreach (var item in request.History?.TakeLast(8) ?? Enumerable.Empty<AiChatMessageDto>())
        {
            if (string.IsNullOrWhiteSpace(item.Content)) continue;
            if (item.Role == "assistant")
                messages.Add(new AssistantChatMessage(item.Content));
            else
                messages.Add(new UserChatMessage(item.Content));
        }

        messages.Add(new UserChatMessage(request.Message));

        var completion = await client.CompleteChatAsync(messages);
        var text = completion.Value.Content.FirstOrDefault()?.Text?.Trim();
        if (string.IsNullOrWhiteSpace(text))
            return "Не удалось получить ответ от AI тренера. Попробуйте еще раз.";

        return text;
    }
}
