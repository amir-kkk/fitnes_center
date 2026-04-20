using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

/// <summary>
/// Управление тренировками и категориями.
/// Тренеры берутся из Users с ролью Trainer.
/// </summary>
public class TrainingService
{
    private readonly AppDbContext _db;
    public TrainingService(AppDbContext db) => _db = db;

    // ─── Тренировки ───

    public async Task<PagedResult<TrainingDto>> GetAllAsync(
        int page, int pageSize, int? categoryId, Guid? trainerId, DateTime? date, string? search)
    {
        var query = _db.Trainings
            .Include(t => t.Category)
            .Include(t => t.Trainer)
            .Include(t => t.Bookings)
            .AsQueryable();

        if (categoryId.HasValue) query = query.Where(t => t.CategoryId == categoryId.Value);
        if (trainerId.HasValue) query = query.Where(t => t.TrainerId == trainerId.Value);
        if (date.HasValue) query = query.Where(t => t.StartTime.Date == date.Value.Date);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(t => t.Description.ToLower().Contains(search.ToLower()));

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(t => t.StartTime)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => MapTraining(t))
            .ToListAsync();

        return new PagedResult<TrainingDto>(items, total, page, pageSize);
    }

    public async Task<TrainingDto> GetByIdAsync(int id)
    {
        var t = await _db.Trainings
            .Include(x => x.Category).Include(x => x.Trainer).Include(x => x.Bookings)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Тренировка не найдена");
        return MapTraining(t);
    }

    public async Task<TrainingDto> CreateAsync(CreateTrainingDto dto)
    {
        await EnsureTrainerAsync(dto.TrainerId);

        var entity = new Training
        {
            CategoryId = dto.CategoryId,
            TrainerId = dto.TrainerId,
            Description = dto.Description,
            StartTime = dto.StartTime,
            MaxParticipants = dto.MaxParticipants
        };
        _db.Trainings.Add(entity);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(entity.Id);
    }

    public async Task<TrainingDto> UpdateAsync(int id, UpdateTrainingDto dto)
    {
        await EnsureTrainerAsync(dto.TrainerId);

        var entity = await _db.Trainings.FindAsync(id)
            ?? throw new KeyNotFoundException("Тренировка не найдена");

        entity.CategoryId = dto.CategoryId;
        entity.TrainerId = dto.TrainerId;
        entity.Description = dto.Description;
        entity.StartTime = dto.StartTime;
        entity.MaxParticipants = dto.MaxParticipants;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(entity.Id);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _db.Trainings.FindAsync(id)
            ?? throw new KeyNotFoundException("Тренировка не найдена");
        _db.Trainings.Remove(entity);
        await _db.SaveChangesAsync();
    }

    // ─── Категории ───

    public async Task<List<CategoryDto>> GetCategoriesAsync() =>
        await _db.Categories.Select(c => new CategoryDto(c.Id, c.Name)).ToListAsync();

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var entity = new Category { Name = dto.Name };
        _db.Categories.Add(entity);
        await _db.SaveChangesAsync();
        return new CategoryDto(entity.Id, entity.Name);
    }

    // ─── Тренеры (Users с ролью Trainer) ───
    public async Task<List<CoachDto>> GetCoachesAsync() =>
        await _db.Users
            .Where(u => u.Role == "Trainer")
            .OrderBy(u => u.FullName)
            .Select(u => new CoachDto(
                u.Id,
                u.FullName,
                u.Email,
                u.PhotoUrl,
                u.TrainerRank ?? 1))
            .ToListAsync();

    public async Task<CoachDto> UpdateCoachAsync(Guid id, UpdateCoachDto dto)
    {
        var coach = await _db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("Тренер не найден");

        if (coach.Role != "Trainer")
            throw new InvalidOperationException("Пользователь не является тренером");

        coach.FullName = dto.FullName;
        coach.TrainerRank = Math.Clamp(dto.TrainerRank, 1, 5);
        await _db.SaveChangesAsync();
        return new CoachDto(coach.Id, coach.FullName, coach.Email, coach.PhotoUrl, coach.TrainerRank ?? 1);
    }

    public async Task DeleteCoachAsync(Guid id)
    {
        var coach = await _db.Users.FirstOrDefaultAsync(u => u.Id == id)
            ?? throw new KeyNotFoundException("Тренер не найден");

        if (coach.Role != "Trainer")
            throw new InvalidOperationException("Пользователь не является тренером");

        var hasActiveGroupBookings = await _db.Trainings
            .Where(t => t.TrainerId == id)
            .SelectMany(t => t.Bookings)
            .AnyAsync(b => b.Status == BookingStatus.Active);
        if (hasActiveGroupBookings)
            throw new InvalidOperationException("Нельзя удалить тренера с активными групповыми записями");

        var hasActivePersonalBookings = await _db.PersonalWorkouts
            .AnyAsync(w => w.TrainerId == id && w.IsBooked);
        if (hasActivePersonalBookings)
            throw new InvalidOperationException("Нельзя удалить тренера с активными персональными записями");

        var trainings = await _db.Trainings.Where(t => t.TrainerId == id).ToListAsync();
        var personalSlots = await _db.PersonalWorkouts.Where(w => w.TrainerId == id).ToListAsync();

        _db.Trainings.RemoveRange(trainings);
        _db.PersonalWorkouts.RemoveRange(personalSlots);
        _db.Users.Remove(coach);
        await _db.SaveChangesAsync();
    }

    /// <summary>
    /// Загрузка фото тренера из файла — сохраняет в wwwroot/uploads/trainers/
    /// </summary>
    public async Task<CoachDto> UploadCoachPhotoAsync(Guid id, IFormFile file, string webRootPath)
    {
        var coach = await _db.Users.FindAsync(id)
            ?? throw new KeyNotFoundException("Тренер не найден");

        if (coach.Role != "Trainer")
            throw new InvalidOperationException("Пользователь не является тренером");

        var uploadsDir = Path.Combine(webRootPath, "uploads", "trainers");
        Directory.CreateDirectory(uploadsDir);

        // Удаляем старое фото
        if (!string.IsNullOrEmpty(coach.PhotoUrl) && coach.PhotoUrl.StartsWith("/uploads/"))
        {
            var oldPath = Path.Combine(webRootPath, coach.PhotoUrl.TrimStart('/'));
            if (File.Exists(oldPath)) File.Delete(oldPath);
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{id}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        coach.PhotoUrl = $"/uploads/trainers/{fileName}";
        await _db.SaveChangesAsync();

        return new CoachDto(coach.Id, coach.FullName, coach.Email, coach.PhotoUrl, coach.TrainerRank ?? 1);
    }

    private async Task EnsureTrainerAsync(Guid trainerId)
    {
        var exists = await _db.Users.AnyAsync(u => u.Id == trainerId && u.Role == "Trainer");
        if (!exists)
            throw new InvalidOperationException("Выбранный пользователь не является тренером");
    }

    private static TrainingDto MapTraining(Training t) =>
        new(t.Id, t.Description, t.StartTime, t.MaxParticipants,
            t.Bookings.Count(b => b.Status == BookingStatus.Active),
            t.Category.Name, t.Trainer.FullName,
            t.Trainer.PhotoUrl,
            t.CategoryId, t.TrainerId);
}
