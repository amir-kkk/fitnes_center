using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

/// <summary>
/// Управление тренировками, категориями, тренерами
/// </summary>
public class TrainingService
{
    private readonly AppDbContext _db;
    public TrainingService(AppDbContext db) => _db = db;

    // ─── Тренировки ───

    public async Task<PagedResult<TrainingDto>> GetAllAsync(
        int page, int pageSize, int? categoryId, int? coachId, DateTime? date, string? search)
    {
        var query = _db.Trainings
            .Include(t => t.Category)
            .Include(t => t.Coach)
            .Include(t => t.Bookings)
            .AsQueryable();

        if (categoryId.HasValue) query = query.Where(t => t.CategoryId == categoryId.Value);
        if (coachId.HasValue) query = query.Where(t => t.CoachId == coachId.Value);
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
            .Include(x => x.Category).Include(x => x.Coach).Include(x => x.Bookings)
            .FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Тренировка не найдена");
        return MapTraining(t);
    }

    public async Task<TrainingDto> CreateAsync(CreateTrainingDto dto)
    {
        var entity = new Training
        {
            CategoryId = dto.CategoryId,
            CoachId = dto.CoachId,
            Description = dto.Description,
            CoachPhotoUrl = dto.CoachPhotoUrl,
            StartTime = dto.StartTime,
            MaxParticipants = dto.MaxParticipants
        };
        _db.Trainings.Add(entity);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(entity.Id);
    }

    public async Task<TrainingDto> UpdateAsync(int id, UpdateTrainingDto dto)
    {
        var entity = await _db.Trainings.FindAsync(id)
            ?? throw new KeyNotFoundException("Тренировка не найдена");

        entity.CategoryId = dto.CategoryId;
        entity.CoachId = dto.CoachId;
        entity.Description = dto.Description;
        entity.CoachPhotoUrl = dto.CoachPhotoUrl;
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

    // ─── Тренеры ───

    public async Task<List<CoachDto>> GetCoachesAsync() =>
        await _db.Coaches
            .Select(c => new CoachDto(c.Id, c.FullName, c.PhotoUrl, c.Specialization))
            .ToListAsync();

    public async Task<CoachDto> CreateCoachAsync(CreateCoachDto dto)
    {
        var entity = new Coach { FullName = dto.FullName, PhotoUrl = dto.PhotoUrl, Specialization = dto.Specialization };
        _db.Coaches.Add(entity);
        await _db.SaveChangesAsync();
        return new CoachDto(entity.Id, entity.FullName, entity.PhotoUrl, entity.Specialization);
    }

    private static TrainingDto MapTraining(Training t) =>
        new(t.Id, t.Description, t.StartTime, t.MaxParticipants,
            t.Bookings.Count(b => b.Status == BookingStatus.Active),
            t.Category.Name, t.Coach.FullName,
            t.CoachPhotoUrl ?? t.Coach.PhotoUrl,
            t.CategoryId, t.CoachId);
}
