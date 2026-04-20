namespace FitnessCenter.API.Models;

/// <summary>
/// Персональная тренировка:
/// свободный слот (IsBooked = false) или запись клиента (IsBooked = true).
/// </summary>
public class PersonalWorkout
{
    public int Id { get; set; }
    public Guid TrainerId { get; set; }
    public Guid? ClientId { get; set; }
    public DateTime DateTime { get; set; }
    public decimal Price { get; set; }
    public bool IsBooked { get; set; }

    public User Trainer { get; set; } = null!;
    public User? Client { get; set; }
}
