using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

/// <summary>
/// Трекеры прогресса и записи замеров.
/// Динамика считается как процент изменения между последним и предпоследним замером.
/// </summary>
public class ProgressService
{
    private readonly AppDbContext _db;
    public ProgressService(AppDbContext db) => _db = db;

    public async Task<List<ProgressTrackerDto>> GetTrackersAsync(Guid userId)
    {
        var trackers = await _db.ProgressTrackers
            .Include(t => t.Entries)
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return trackers.Select(MapTracker).ToList();
    }

    public async Task<ProgressTrackerDto> CreateTrackerAsync(Guid userId, CreateTrackerDto dto)
    {
        var entity = new ProgressTracker
        {
            UserId = userId,
            Title = dto.Title,
            GoalValue = dto.GoalValue,
            Unit = dto.Unit,
            CreatedAt = DateTime.UtcNow
        };

        _db.ProgressTrackers.Add(entity);
        await _db.SaveChangesAsync();
        return MapTracker(entity);
    }

    public async Task DeleteTrackerAsync(int id, Guid userId)
    {
        var tracker = await _db.ProgressTrackers
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId)
            ?? throw new KeyNotFoundException("Трекер не найден");

        _db.ProgressTrackers.Remove(tracker);
        await _db.SaveChangesAsync();
    }

    public async Task<List<ProgressEntryDto>> GetEntriesAsync(int trackerId, Guid userId)
    {
        await EnsureOwnerAsync(trackerId, userId);

        return await _db.ProgressEntries
            .Where(e => e.TrackerId == trackerId)
            .OrderByDescending(e => e.DateRecorded)
            .Select(e => new ProgressEntryDto(e.Id, e.Value, e.DateRecorded))
            .ToListAsync();
    }

    public async Task<ProgressEntryDto> AddEntryAsync(int trackerId, Guid userId, CreateEntryDto dto)
    {
        await EnsureOwnerAsync(trackerId, userId);

        var entry = new ProgressEntry
        {
            TrackerId = trackerId,
            Value = dto.Value,
            DateRecorded = DateTime.UtcNow
        };

        _db.ProgressEntries.Add(entry);
        await _db.SaveChangesAsync();
        return new ProgressEntryDto(entry.Id, entry.Value, entry.DateRecorded);
    }

    private async Task EnsureOwnerAsync(int trackerId, Guid userId)
    {
        var exists = await _db.ProgressTrackers
            .AnyAsync(t => t.Id == trackerId && t.UserId == userId);
        if (!exists) throw new KeyNotFoundException("Трекер не найден");
    }

    /// <summary>
    /// Маппинг трекера с расчётом динамики:
    /// сравниваем последний и предпоследний замер, считаем % изменения.
    /// </summary>
    private static ProgressTrackerDto MapTracker(ProgressTracker t)
    {
        var sorted = t.Entries.OrderByDescending(e => e.DateRecorded).ToList();
        double? lastValue = sorted.Count > 0 ? sorted[0].Value : null;
        double? changePercent = null;

        if (sorted.Count >= 2)
        {
            var prev = sorted[1].Value;
            if (prev != 0)
                changePercent = Math.Round((sorted[0].Value - prev) / prev * 100, 1);
        }

        return new ProgressTrackerDto(
            t.Id, t.Title, t.GoalValue, t.Unit, t.CreatedAt, lastValue, changePercent);
    }
}
