namespace FitnessCenter.API.Models;

/// <summary>
/// Суточный счётчик сообщений в AI Trainer.
/// Один пользователь — одна запись на день.
/// </summary>
public class AiTrainerUsage
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime UsageDate { get; set; }
    public int MessageCount { get; set; }

    public User User { get; set; } = null!;
}
