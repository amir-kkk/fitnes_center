namespace FitnessCenter.API.Models;

/// <summary>
/// Категория тренировки (Йога, Кроссфит и т.д.)
/// </summary>
public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Training> Trainings { get; set; } = new();
}

/// <summary>
/// Групповая тренировка
/// </summary>
public class Training
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public Guid TrainerId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int MaxParticipants { get; set; }

    public Category Category { get; set; } = null!;
    public User Trainer { get; set; } = null!;
    public List<Booking> Bookings { get; set; } = new();
}
