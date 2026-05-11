namespace FitnessCenter.API.Models;

public enum PersonalWorkoutStatus
{
    Available = 0,
    BookedUnpaid = 1,
    Paid = 2,
    Completed = 3,
    NotCompleted = 4
}

/// <summary>
/// Персональная тренировка:
/// свободный слот, бронь без оплаты, оплаченный и завершенный жизненный цикл.
/// </summary>
public class PersonalWorkout
{
    public int Id { get; set; }
    public Guid TrainerId { get; set; }
    public Guid? ClientId { get; set; }
    public DateTime DateTime { get; set; }
    public decimal Price { get; set; }
    public PersonalWorkoutStatus Status { get; set; } = PersonalWorkoutStatus.Available;
    public string? NotCompletedReason { get; set; }

    public User Trainer { get; set; } = null!;
    public User? Client { get; set; }
}
