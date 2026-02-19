namespace FitnessCenter.API.Models;

/// <summary>
/// Трекер прогресса пользователя — отслеживает конкретное упражнение/показатель
/// </summary>
public class ProgressTracker
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public double GoalValue { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public List<ProgressEntry> Entries { get; set; } = new();
}

/// <summary>
/// Запись (замер) в трекере прогресса
/// </summary>
public class ProgressEntry
{
    public int Id { get; set; }
    public int TrackerId { get; set; }
    public double Value { get; set; }
    public DateTime DateRecorded { get; set; } = DateTime.UtcNow;

    public ProgressTracker Tracker { get; set; } = null!;
}
