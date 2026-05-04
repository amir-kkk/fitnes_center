namespace FitnessCenter.API.Models;

/// <summary>
/// Журнал изменений сущностей.
/// </summary>
public class AuditLog
{
    public long Id { get; set; }
    public Guid? UserId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Insert / Update / Delete
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON

    public User? User { get; set; }
}
