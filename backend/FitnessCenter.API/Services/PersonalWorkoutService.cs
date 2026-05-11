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
                u.PhoneNumber,
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

        await EnsureNoGroupTrainingConflictAsync(trainerId, dto.DateTime);

        var exists = await _db.PersonalWorkouts.AnyAsync(w =>
            w.TrainerId == trainerId && w.DateTime == dto.DateTime);
        if (exists)
            throw new InvalidOperationException("Слот на это время уже существует");

        var slot = new PersonalWorkout
        {
            TrainerId = trainerId,
            DateTime = dto.DateTime,
            Price = CalculatePrice(trainer.TrainerRank),
            Status = PersonalWorkoutStatus.Available
        };

        _db.PersonalWorkouts.Add(slot);
        await _db.SaveChangesAsync();

        slot = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .FirstAsync(w => w.Id == slot.Id);

        return MapWorkout(slot);
    }

    public async Task<List<PersonalWorkoutSlotDto>> CreateTrainerSlotsRangeAsync(Guid trainerId, CreatePersonalWorkoutRangeDto dto)
    {
        var start = dto.StartDateTime;
        var end = dto.EndDateTime;
        if (start <= DateTime.UtcNow)
            throw new InvalidOperationException("Начало периода должно быть в будущем");
        if (end <= start)
            throw new InvalidOperationException("Некорректный диапазон времени");

        var trainer = await _db.Users.FirstOrDefaultAsync(u => u.Id == trainerId && u.Role == "Trainer")
            ?? throw new KeyNotFoundException("Тренер не найден");

        for (var current = start; current < end; current = current.AddHours(1))
            await EnsureNoGroupTrainingConflictAsync(trainerId, current);

        var created = new List<PersonalWorkout>();
        for (var current = start; current < end; current = current.AddHours(1))
        {
            var exists = await _db.PersonalWorkouts.AnyAsync(w =>
                w.TrainerId == trainerId && w.DateTime == current);
            if (exists)
                continue;

            created.Add(new PersonalWorkout
            {
                TrainerId = trainerId,
                DateTime = current,
                Price = CalculatePrice(trainer.TrainerRank),
                Status = PersonalWorkoutStatus.Available
            });
        }

        if (created.Count == 0)
            throw new InvalidOperationException("В указанном диапазоне нет новых свободных слотов");

        _db.PersonalWorkouts.AddRange(created);
        await _db.SaveChangesAsync();

        var createdIds = created.Select(x => x.Id).ToList();
        return await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Where(w => createdIds.Contains(w.Id))
            .OrderBy(w => w.DateTime)
            .Select(MapProjection())
            .ToListAsync();
    }

    public async Task<List<PersonalWorkoutSlotDto>> GetAvailableSlotsByTrainerAsync(Guid trainerId)
    {
        return await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .Where(w => w.TrainerId == trainerId && w.Status == PersonalWorkoutStatus.Available && w.DateTime > DateTime.UtcNow)
            .Where(w => !_db.PersonalWorkouts.Any(b =>
                b.TrainerId == trainerId &&
                b.Status != PersonalWorkoutStatus.Available &&
                (b.DateTime == w.DateTime.AddHours(-1) || b.DateTime == w.DateTime.AddHours(1))))
            .OrderBy(w => w.DateTime)
            .Select(MapProjection())
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

        if (workout.Status != PersonalWorkoutStatus.Available || workout.ClientId.HasValue)
            throw new InvalidOperationException("Слот уже занят");

        if (workout.DateTime <= DateTime.UtcNow)
            throw new InvalidOperationException("Нельзя купить прошедший слот");

        var hasNeighbourBooking = await _db.PersonalWorkouts.AnyAsync(w =>
            w.TrainerId == workout.TrainerId &&
            w.Status != PersonalWorkoutStatus.Available &&
            (w.DateTime == workout.DateTime.AddHours(-1) || w.DateTime == workout.DateTime.AddHours(1)));
        if (hasNeighbourBooking)
            throw new InvalidOperationException("Нельзя бронировать слот вплотную к уже занятому времени тренера");

        var buyer = await _db.Users.FindAsync(clientId)
            ?? throw new KeyNotFoundException("Пользователь не найден");
        if (buyer.Role != "User")
            throw new InvalidOperationException("Покупка слотов доступна только клиентам");

        workout.Price = CalculatePrice(workout.Trainer.TrainerRank);
        workout.Status = PersonalWorkoutStatus.BookedUnpaid;
        workout.ClientId = clientId;
        workout.NotCompletedReason = null;
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
            .Select(MapProjection())
            .ToListAsync();
    }

    public async Task CancelClientWorkoutAsync(int slotId, Guid clientId)
    {
        var workout = await _db.PersonalWorkouts
            .FirstOrDefaultAsync(w => w.Id == slotId && w.ClientId == clientId)
            ?? throw new KeyNotFoundException("Запись не найдена");

        if (workout.Status == PersonalWorkoutStatus.Available)
            throw new InvalidOperationException("Слот уже свободен");

        workout.Status = PersonalWorkoutStatus.Available;
        workout.ClientId = null;
        workout.NotCompletedReason = null;
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
            .Select(MapProjection())
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

        foreach (var update in dto.Updates)
        {
            if (update.Value < 0)
                continue;

            ProgressTracker? tracker = null;
            if (update.TrackerId.HasValue)
            {
                tracker = await _db.ProgressTrackers
                    .FirstOrDefaultAsync(t => t.Id == update.TrackerId.Value && t.UserId == dto.ClientId);
            }

            if (tracker == null)
            {
                if (string.IsNullOrWhiteSpace(update.Title))
                    continue;

                tracker = await _db.ProgressTrackers.FirstOrDefaultAsync(t =>
                    t.UserId == dto.ClientId &&
                    t.Title.ToLower() == update.Title.ToLower());

                if (tracker == null)
                {
                    tracker = new ProgressTracker
                    {
                        UserId = dto.ClientId,
                        Title = update.Title.Trim(),
                        Unit = string.IsNullOrWhiteSpace(update.Unit) ? "ед." : update.Unit.Trim(),
                        GoalValue = update.Value,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.ProgressTrackers.Add(tracker);
                }
            }

            _db.ProgressEntries.Add(new ProgressEntry
            {
                Tracker = tracker,
                Value = update.Value,
                DateRecorded = DateTime.UtcNow
            });
        }

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
            .Select(MapProjection())
            .ToListAsync();

        return new PagedResult<PersonalWorkoutSlotDto>(items, total, page, pageSize);
    }

    public async Task CancelByAdminAsync(int slotId)
    {
        var workout = await _db.PersonalWorkouts.FirstOrDefaultAsync(w => w.Id == slotId)
            ?? throw new KeyNotFoundException("Слот не найден");

        if (workout.Status == PersonalWorkoutStatus.Available)
            throw new InvalidOperationException("Слот уже свободен");

        workout.Status = PersonalWorkoutStatus.Available;
        workout.ClientId = null;
        workout.NotCompletedReason = null;
        await _db.SaveChangesAsync();
    }

    public async Task<PersonalWorkoutSlotDto> ConfirmPaymentByManagerAsync(int slotId)
    {
        var workout = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .FirstOrDefaultAsync(w => w.Id == slotId)
            ?? throw new KeyNotFoundException("Слот не найден");

        if (workout.Status != PersonalWorkoutStatus.BookedUnpaid)
            throw new InvalidOperationException("Оплату можно подтвердить только для статуса 'Забронирована'");

        workout.Status = PersonalWorkoutStatus.Paid;
        await _db.SaveChangesAsync();
        return MapWorkout(workout);
    }

    public async Task<PersonalWorkoutSlotDto> AssignClientToSlotByManagerAsync(int slotId, Guid clientId)
    {
        var workout = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .FirstOrDefaultAsync(w => w.Id == slotId)
            ?? throw new KeyNotFoundException("Слот не найден");

        var client = await _db.Users.FirstOrDefaultAsync(u => u.Id == clientId && (u.Role == "User" || u.Role == "Client"))
            ?? throw new KeyNotFoundException("Клиент не найден");

        if (workout.Status != PersonalWorkoutStatus.Available)
            throw new InvalidOperationException("Слот уже занят");

        workout.ClientId = client.Id;
        workout.Status = PersonalWorkoutStatus.Paid;
        workout.NotCompletedReason = null;
        await _db.SaveChangesAsync();

        workout = await _db.PersonalWorkouts.Include(w => w.Trainer).Include(w => w.Client).FirstAsync(w => w.Id == slotId);
        return MapWorkout(workout);
    }

    public async Task<PersonalWorkoutSlotDto> MarkWorkoutResultByTrainerAsync(Guid trainerId, int slotId, TrainerWorkoutResultDto dto)
    {
        var workout = await _db.PersonalWorkouts
            .Include(w => w.Trainer)
            .Include(w => w.Client)
            .FirstOrDefaultAsync(w => w.Id == slotId && w.TrainerId == trainerId)
            ?? throw new KeyNotFoundException("Тренировка не найдена");

        if (workout.Status != PersonalWorkoutStatus.Paid)
            throw new InvalidOperationException("Результат можно отметить только для оплаченной тренировки");

        if (DateTime.UtcNow < workout.DateTime.AddHours(1))
            throw new InvalidOperationException("Отметить результат можно только после завершения времени слота");

        if (dto.IsConducted)
        {
            workout.Status = PersonalWorkoutStatus.Completed;
            workout.NotCompletedReason = null;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.NotConductedReason))
                throw new InvalidOperationException("Укажите причину непроведения тренировки");
            workout.Status = PersonalWorkoutStatus.NotCompleted;
            workout.NotCompletedReason = dto.NotConductedReason.Trim();
        }

        await _db.SaveChangesAsync();
        return MapWorkout(workout);
    }

    private async Task EnsureTrainerCanManageClientAsync(Guid trainerId, Guid clientId)
    {
        var canManage = await _db.PersonalWorkouts.AnyAsync(w =>
            w.TrainerId == trainerId &&
            w.ClientId == clientId &&
            w.Status != PersonalWorkoutStatus.Available);

        if (!canManage)
            throw new UnauthorizedAccessException("Нет доступа к прогрессу этого клиента");
    }

    private static PersonalWorkoutSlotDto MapWorkout(PersonalWorkout w) =>
        new(
            w.Id,
            w.TrainerId,
            w.Trainer.FullName,
            w.Trainer.PhoneNumber,
            w.ClientId,
            w.Client?.FullName,
            w.Client?.PhoneNumber,
            w.DateTime,
            CalculatePrice(w.Trainer.TrainerRank),
            w.Status.ToString(),
            w.NotCompletedReason
        );

    private static System.Linq.Expressions.Expression<Func<PersonalWorkout, PersonalWorkoutSlotDto>> MapProjection() =>
        w => new PersonalWorkoutSlotDto(
            w.Id,
            w.TrainerId,
            w.Trainer.FullName,
            w.Trainer.PhoneNumber,
            w.ClientId,
            w.Client != null ? w.Client.FullName : null,
            w.Client != null ? w.Client.PhoneNumber : null,
            w.DateTime,
            w.Price,
            w.Status.ToString(),
            w.NotCompletedReason
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
            throw new InvalidOperationException("Запись доступна только при оплаченном абонементе");
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

    private async Task EnsureNoGroupTrainingConflictAsync(Guid trainerId, DateTime slotStartTime)
    {
        var slotEndTime = slotStartTime.AddHours(1);
        var hasConflict = await _db.Trainings.AnyAsync(t =>
            t.TrainerId == trainerId &&
            t.StartTime < slotEndTime &&
            t.StartTime.AddHours(1) > slotStartTime);

        if (hasConflict)
            throw new InvalidOperationException("Нельзя открыть персональный слот: у тренера есть групповая тренировка на это время");
    }
}
