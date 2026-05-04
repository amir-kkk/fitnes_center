using System.Security.Claims;
using System.Text.Json;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace FitnessCenter.API.Data;

public class AuditSaveChangesInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditSaveChangesInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        AddAuditLogs(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        AddAuditLogs(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void AddAuditLogs(DbContext? context)
    {
        if (context == null) return;

        var now = DateTime.UtcNow;
        var userId = TryGetCurrentUserId();

        var entries = context.ChangeTracker.Entries()
            .Where(e =>
                e.Entity is not AuditLog &&
                e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0) return;

        var logs = new List<AuditLog>(entries.Count);
        foreach (var entry in entries)
        {
            var action = entry.State switch
            {
                EntityState.Added => "Insert",
                EntityState.Modified => "Update",
                EntityState.Deleted => "Delete",
                _ => string.Empty
            };

            if (string.IsNullOrEmpty(action))
                continue;

            var oldValues = BuildOldValues(entry);
            var newValues = BuildNewValues(entry);

            // Не добавляем пустые UPDATE, если EF не считает свойства реально измененными.
            if (entry.State == EntityState.Modified &&
                string.IsNullOrEmpty(oldValues) &&
                string.IsNullOrEmpty(newValues))
            {
                continue;
            }

            logs.Add(new AuditLog
            {
                UserId = userId,
                EntityName = entry.Metadata.ClrType.Name,
                Action = action,
                Timestamp = now,
                OldValues = oldValues,
                NewValues = newValues
            });
        }

        if (logs.Count > 0)
            context.Set<AuditLog>().AddRange(logs);
    }

    private static string? BuildOldValues(EntityEntry entry)
    {
        if (entry.State == EntityState.Added)
            return null;

        var values = new Dictionary<string, object?>();
        foreach (var p in entry.Properties)
        {
            if (p.Metadata.IsPrimaryKey())
            {
                values[p.Metadata.Name] = p.OriginalValue;
                continue;
            }

            if (entry.State == EntityState.Deleted || p.IsModified)
                values[p.Metadata.Name] = p.OriginalValue;
        }

        return values.Count == 0 ? null : JsonSerializer.Serialize(values);
    }

    private static string? BuildNewValues(EntityEntry entry)
    {
        if (entry.State == EntityState.Deleted)
            return null;

        var values = new Dictionary<string, object?>();
        foreach (var p in entry.Properties)
        {
            if (entry.State == EntityState.Added || p.IsModified || p.Metadata.IsPrimaryKey())
                values[p.Metadata.Name] = p.CurrentValue;
        }

        return values.Count == 0 ? null : JsonSerializer.Serialize(values);
    }

    private Guid? TryGetCurrentUserId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user == null) return null;

        var userIdRaw = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue("sub");

        return Guid.TryParse(userIdRaw, out var parsed) ? parsed : null;
    }
}
