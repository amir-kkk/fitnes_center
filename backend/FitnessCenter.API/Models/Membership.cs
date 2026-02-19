namespace FitnessCenter.API.Models;

/// <summary>
/// Абонемент фитнес-центра
/// </summary>
public class Membership
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<MembershipOption> Options { get; set; } = new();
    public List<Purchase> Purchases { get; set; } = new();
}

/// <summary>
/// Опция абонемента — включённая услуга
/// </summary>
public class MembershipOption
{
    public int Id { get; set; }
    public int MembershipId { get; set; }
    public string OptionText { get; set; } = string.Empty;

    public Membership Membership { get; set; } = null!;
}
