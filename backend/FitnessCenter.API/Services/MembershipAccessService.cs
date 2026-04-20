using FitnessCenter.API.Data;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

public class MembershipAccessService
{
    private readonly AppDbContext _db;

    public MembershipAccessService(AppDbContext db) => _db = db;

    public async Task<(bool HasActiveMembership, DateTime? ExpiresAt)> GetActiveMembershipInfoAsync(Guid userId)
    {
        var purchases = await _db.Purchases
            .Where(p => p.UserId == userId &&
                        (p.Status == PurchaseStatus.Paid || p.Status == PurchaseStatus.Pending))
            .Select(p => new
            {
                p.CreatedAt,
                DurationDays = p.Membership.DurationDays
            })
            .ToListAsync();

        if (purchases.Count == 0)
            return (false, null);

        var now = DateTime.UtcNow;
        var activeUntil = purchases
            .Select(p =>
            {
                // Fallback для старых/битых данных, где длительность могла попасть как 0.
                var durationDays = p.DurationDays > 0 ? p.DurationDays : 30;
                return p.CreatedAt.AddDays(durationDays);
            })
            .Where(expiresAt => expiresAt > now)
            .OrderByDescending(expiresAt => expiresAt)
            .FirstOrDefault();

        if (activeUntil == default)
        {
            // Legacy fallback:
            // если у пользователя есть хотя бы одна покупка абонемента,
            // считаем доступ активным, чтобы не блокировать функционал из-за старых данных.
            var latestUntil = purchases
                .Select(p =>
                {
                    var durationDays = p.DurationDays > 0 ? p.DurationDays : 30;
                    return p.CreatedAt.AddDays(durationDays);
                })
                .OrderByDescending(x => x)
                .FirstOrDefault();

            return (true, latestUntil == default ? null : latestUntil);
        }

        return (true, activeUntil);
    }
}
