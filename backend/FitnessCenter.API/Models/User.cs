namespace FitnessCenter.API.Models;

/// <summary>
/// Пользователь системы (роли: Admin, User, Trainer)
/// </summary>
public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "User";
    public string FullName { get; set; } = string.Empty;
    public string? PhotoUrl { get; set; }
    public int? TrainerRank { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Навигационные свойства
    public List<Purchase> Purchases { get; set; } = new();
    public List<Booking> Bookings { get; set; } = new();
    public List<ProgressTracker> ProgressTrackers { get; set; } = new();
    public List<AiTrainerUsage> AiTrainerUsages { get; set; } = new();
    public List<AiTrainerMessage> AiTrainerMessages { get; set; } = new();
    public List<Training> TrainerTrainings { get; set; } = new();
    public List<PersonalWorkout> TrainerPersonalWorkouts { get; set; } = new();
    public List<PersonalWorkout> ClientPersonalWorkouts { get; set; } = new();
}
