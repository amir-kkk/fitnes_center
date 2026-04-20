namespace FitnessCenter.API.Models;

/// <summary>
/// Лог успешных сообщений в AI Trainer.
/// Используется для дневного лимита.
/// </summary>
public class AiTrainerMessage
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}
