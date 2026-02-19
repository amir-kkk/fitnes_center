namespace FitnessCenter.API.Models;

public enum PurchaseStatus { Pending, Paid }
public enum BookingStatus { Active, Cancelled }

/// <summary>
/// Покупка абонемента
/// </summary>
public class Purchase
{
    public int Id { get; set; }
    public Guid UserId { get; set; }
    public int MembershipId { get; set; }
    public decimal PriceAtPurchase { get; set; }
    public PurchaseStatus Status { get; set; } = PurchaseStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Membership Membership { get; set; } = null!;
}

/// <summary>
/// Запись на тренировку.
/// Уникальный индекс (TrainingId, UserId) для активных записей
/// предотвращает двойную запись.
/// </summary>
public class Booking
{
    public int Id { get; set; }
    public int TrainingId { get; set; }
    public Guid UserId { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Active;

    public Training Training { get; set; } = null!;
    public User User { get; set; } = null!;
}
