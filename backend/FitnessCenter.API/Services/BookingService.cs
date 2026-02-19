using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

/// <summary>
/// Запись на тренировку с проверкой лимита участников и дублей
/// </summary>
public class BookingService
{
    private readonly AppDbContext _db;
    public BookingService(AppDbContext db) => _db = db;

    public async Task<List<BookingDto>> GetByUserAsync(Guid userId)
    {
        return await _db.Bookings
            .Include(b => b.Training).ThenInclude(t => t.Coach)
            .Include(b => b.User)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.Training.StartTime)
            .Select(b => Map(b))
            .ToListAsync();
    }

    public async Task<PagedResult<BookingDto>> GetAllAsync(int page, int pageSize)
    {
        var query = _db.Bookings
            .Include(b => b.Training).ThenInclude(t => t.Coach)
            .Include(b => b.User);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.Training.StartTime)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => Map(b))
            .ToListAsync();

        return new PagedResult<BookingDto>(items, total, page, pageSize);
    }

    public async Task<BookingDto> CreateAsync(Guid userId, CreateBookingDto dto)
    {
        var training = await _db.Trainings.Include(t => t.Bookings).Include(t => t.Coach)
            .FirstOrDefaultAsync(t => t.Id == dto.TrainingId)
            ?? throw new KeyNotFoundException("Тренировка не найдена");

        var activeCount = training.Bookings.Count(b => b.Status == BookingStatus.Active);
        if (activeCount >= training.MaxParticipants)
            throw new InvalidOperationException("Все места на тренировку заняты");

        // Проверка дубля
        var exists = await _db.Bookings.AnyAsync(
            b => b.TrainingId == dto.TrainingId && b.UserId == userId && b.Status == BookingStatus.Active);
        if (exists)
            throw new InvalidOperationException("Вы уже записаны на эту тренировку");

        var booking = new Booking
        {
            TrainingId = dto.TrainingId,
            UserId = userId,
            Status = BookingStatus.Active
        };

        _db.Bookings.Add(booking);
        await _db.SaveChangesAsync();

        return await GetByIdInternalAsync(booking.Id);
    }

    public async Task CancelAsync(int id, Guid userId)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId)
            ?? throw new KeyNotFoundException("Запись не найдена");

        if (booking.Status == BookingStatus.Cancelled)
            throw new InvalidOperationException("Запись уже отменена");

        booking.Status = BookingStatus.Cancelled;
        await _db.SaveChangesAsync();
    }

    private async Task<BookingDto> GetByIdInternalAsync(int id)
    {
        var b = await _db.Bookings
            .Include(x => x.Training).ThenInclude(t => t.Coach)
            .Include(x => x.User)
            .FirstAsync(x => x.Id == id);
        return Map(b);
    }

    private static BookingDto Map(Booking b) =>
        new(b.Id, b.TrainingId, b.Training.Description,
            b.Training.StartTime, b.Training.Coach.FullName,
            b.UserId, b.User.Email, b.Status.ToString());
}
