using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

public class PersonalWorkoutService
{
    private readonly AppDbContext _db;

    public PersonalWorkoutService(AppDbContext db) => _db = db;

    public async Task<List<TrainerListItemDto>> GetTrainersAsync()
    {
        return await _db.Users
            .Where(u => u.Role == "Trainer")
            .OrderBy(u => u.FullName)
            .Select(u => new TrainerListItemDto(
                u.Id,
                u.FullName,
                u.Email,
                u.PhotoUrl,
                Math.Clamp(u.TrainerRank ?? 1, 1, 5)))
            .ToListAsync();
    }

    public async Task<PersonalWorkoutSlotDto> CreateTrainerSlotAsync(Guid trainerId, CreatePersonalWorkoutSlotDto dto)
    {
        if (dto.DateTime <= DateTime.UtcNow)
            throw new InvalidOperationException("Можно создавать только будущие слоты");

        var trainer = await _db.Users.FirstOrDefaultAsync(u => u.Id == trainerId && u.Role == "Trainer")
            ?? throw new KeyNotFoundException("Тренер не найден");

        var exists = await _db.PersonalWorkouts.AnyAsync(w =>
            w.TrainerId == trainerId && w.DateTime == dto.DateTime);
        if (exists)
            throw new InvalidOperationException("Слот на это время уже существует");

        var slot = new PersonalWorkout
        {
            TrainerId = trainerId,
            DateTime = dto.DateTime,
            Price = CalculatePrice(trainer.TrainerRank),
            IsBooked = false
        };

        _db.PersonalWorkouts.Add(slot);
        await _db.SaveChangesAsync();

        slot = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .FirstAsync(w => w.Id == slot.Id);

        return MapWorkout(slot);
    }

    public async Task<List<PersonalWorkoutSlotDto>> GetAvailableSlotsByTrainerAsync(Guid trainerId)
    {
        return await _db.PersonalWorkouts
            .Where(w => w.TrainerId == trainerId && !w.IsBooked && w.DateTime > DateTime.UtcNow)
            .OrderBy(w => w.DateTime)
            .Select(w => new PersonalWorkoutSlotDto(
                w.Id,
                w.TrainerId,
                w.Trainer.FullName,
                w.ClientId,
                w.Client != null ? w.Client.FullName : null,
                w.DateTime,
                w.Price,
                w.IsBooked))
            .ToListAsync();
    }

    public async Task<PersonalWorkoutSlotDto> BuySlotAsync(int slotId, Guid clientId)
    {
        await EnsurePaidMembershipAsync(clientId);

        var workout = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .FirstOrDefaultAsync(w => w.Id == slotId)
            ?? throw new KeyNotFoundException("Слот не найден");

        if (workout.IsBooked || workout.ClientId.HasValue)
            throw new InvalidOperationException("Слот уже занят");

        if (workout.DateTime <= DateTime.UtcNow)
            throw new InvalidOperationException("Нельзя купить прошедший слот");

        var buyer = await _db.Users.FindAsync(clientId)
            ?? throw new KeyNotFoundException("Пользователь не найден");
        if (buyer.Role != "User")
            throw new InvalidOperationException("Покупка слотов доступна только клиентам");

        workout.Price = CalculatePrice(workout.Trainer.TrainerRank);
        workout.IsBooked = true;
        workout.ClientId = clientId;
        await _db.SaveChangesAsync();

        workout = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .FirstAsync(w => w.Id == slotId);

        return MapWorkout(workout);
    }

    public async Task<List<PersonalWorkoutSlotDto>> GetClientWorkoutsAsync(Guid clientId, bool history)
    {
        var now = DateTime.UtcNow;
        var query = _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .Where(w => w.ClientId == clientId);

        query = history
            ? query.Where(w => w.DateTime <= now)
            : query.Where(w => w.DateTime > now);

        return await query
            .OrderBy(w => w.DateTime)
            .Select(w => new PersonalWorkoutSlotDto(
                w.Id,
                w.TrainerId,
                w.Trainer.FullName,
                w.ClientId,
                w.Client != null ? w.Client.FullName : null,
                w.DateTime,
                w.Price,
                w.IsBooked))
            .ToListAsync();
    }

    public async Task CancelClientWorkoutAsync(int slotId, Guid clientId)
    {
        var workout = await _db.PersonalWorkouts
            .FirstOrDefaultAsync(w => w.Id == slotId && w.ClientId == clientId)
            ?? throw new KeyNotFoundException("Запись не найдена");

        if (!workout.IsBooked)
            throw new InvalidOperationException("Слот уже свободен");

        workout.IsBooked = false;
        workout.ClientId = null;
        await _db.SaveChangesAsync();
    }

    public async Task<List<PersonalWorkoutSlotDto>> GetTrainerWorkoutsAsync(Guid trainerId, bool history)
    {
        var now = DateTime.UtcNow;
        var query = _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .Where(w => w.TrainerId == trainerId);

        query = history
            ? query.Where(w => w.DateTime <= now)
            : query.Where(w => w.DateTime > now);

        return await query
            .OrderBy(w => w.DateTime)
            .Select(w => new PersonalWorkoutSlotDto(
                w.Id,
                w.TrainerId,
                w.Trainer.FullName,
                w.ClientId,
                w.Client != null ? w.Client.FullName : null,
                w.DateTime,
                w.Price,
                w.IsBooked))
            .ToListAsync();
    }

    public async Task<List<ProgressTrackerDto>> GetClientProgressForTrainerAsync(Guid trainerId, Guid clientId)
    {
        await EnsureTrainerCanManageClientAsync(trainerId, clientId);

        var trackers = await _db.ProgressTrackers
            .Include(t => t.Entries)
            .Where(t => t.UserId == clientId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return trackers.Select(MapTracker).ToList();
    }

    public async Task<List<ProgressEntryDto>> GetClientTrackerEntriesAsync(Guid trainerId, Guid clientId, int trackerId)
    {
        await EnsureTrainerCanManageClientAsync(trainerId, clientId);

        var tracker = await _db.ProgressTrackers
            .FirstOrDefaultAsync(t => t.Id == trackerId && t.UserId == clientId)
            ?? throw new KeyNotFoundException("Трекер клиента не найден");

        return await _db.ProgressEntries
            .Where(e => e.TrackerId == tracker.Id)
            .OrderByDescending(e => e.DateRecorded)
            .Select(e => new ProgressEntryDto(e.Id, e.Value, e.DateRecorded))
            .ToListAsync();
    }

    public async Task<List<ProgressTrackerDto>> UpdateClientProgressAsync(Guid trainerId, TrainerUpdateProgressDto dto)
    {
        await EnsureTrainerCanManageClientAsync(trainerId, dto.ClientId);

        await UpsertTrackerEntryAsync(dto.ClientId, "Вес", "кг", dto.WeightKg);
        await UpsertTrackerEntryAsync(dto.ClientId, "Грудь", "см", dto.ChestCm);
        await UpsertTrackerEntryAsync(dto.ClientId, "Талия", "см", dto.WaistCm);
        await UpsertTrackerEntryAsync(dto.ClientId, "Бедра", "см", dto.HipsCm);

        await _db.SaveChangesAsync();
        return await GetClientProgressForTrainerAsync(trainerId, dto.ClientId);
    }

    public async Task<PagedResult<PersonalWorkoutSlotDto>> GetAllForAdminAsync(int page, int pageSize)
    {
        var query = _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .OrderByDescending(w => w.DateTime);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new PersonalWorkoutSlotDto(
                w.Id,
                w.TrainerId,
                w.Trainer.FullName,
                w.ClientId,
                w.Client != null ? w.Client.FullName : null,
                w.DateTime,
                w.Price,
                w.IsBooked))
            .ToListAsync();

        return new PagedResult<PersonalWorkoutSlotDto>(items, total, page, pageSize);
    }

    public async Task CancelByAdminAsync(int slotId)
    {
        var workout = await _db.PersonalWorkouts.FirstOrDefaultAsync(w => w.Id == slotId)
            ?? throw new KeyNotFoundException("Слот не найден");

        if (!workout.IsBooked)
            throw new InvalidOperationException("Слот уже свободен");

        workout.IsBooked = false;
        workout.ClientId = null;
        await _db.SaveChangesAsync();
    }

    private async Task EnsureTrainerCanManageClientAsync(Guid trainerId, Guid clientId)
    {
        var canManage = await _db.PersonalWorkouts.AnyAsync(w =>
            w.TrainerId == trainerId &&
            w.ClientId == clientId &&
            w.IsBooked);

        if (!canManage)
            throw new UnauthorizedAccessException("Нет доступа к прогрессу этого клиента");
    }

    private async Task UpsertTrackerEntryAsync(Guid clientId, string title, string unit, double? value)
    {
        if (!value.HasValue) return;

        var tracker = await _db.ProgressTrackers
            .FirstOrDefaultAsync(t => t.UserId == clientId && t.Title == title);

        if (tracker == null)
        {
            tracker = new ProgressTracker
            {
                UserId = clientId,
                Title = title,
                Unit = unit,
                GoalValue = value.Value,
                CreatedAt = DateTime.UtcNow
            };
            _db.ProgressTrackers.Add(tracker);
        }

        _db.ProgressEntries.Add(new ProgressEntry
        {
            Tracker = tracker,
            Value = value.Value,
            DateRecorded = DateTime.UtcNow
        });
    }

    private static PersonalWorkoutSlotDto MapWorkout(PersonalWorkout w) =>
        new(
            w.Id,
            w.TrainerId,
            w.Trainer.FullName,
            w.ClientId,
            w.Client?.FullName,
            w.DateTime,
            CalculatePrice(w.Trainer.TrainerRank),
            w.IsBooked
        );

    private static decimal CalculatePrice(int? rankNullable)
    {
        var rank = Math.Clamp(rankNullable ?? 1, 1, 5);
        return 1000m + (rank - 1) * 500m;
    }

    private async Task EnsurePaidMembershipAsync(Guid userId)
    {
        var hasPaidMembership = await _db.Purchases
            .AnyAsync(p => p.UserId == userId && p.Status == PurchaseStatus.Paid);

        if (!hasPaidMembership)
            throw new InvalidOperationException("Запись доступна только после покупки и оплаты абонемента");
    }

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
