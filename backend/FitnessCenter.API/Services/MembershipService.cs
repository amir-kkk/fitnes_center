using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

/// <summary>
/// CRUD-операции и фильтрация абонементов
/// </summary>
public class MembershipService
{
    private readonly AppDbContext _db;
    public MembershipService(AppDbContext db) => _db = db;

    public async Task<PagedResult<MembershipDto>> GetAllAsync(
        int page, int pageSize, decimal? minPrice, decimal? maxPrice, string? search)
    {
        var query = _db.Memberships.Include(m => m.Options).AsQueryable();

        if (minPrice.HasValue) query = query.Where(m => m.Price >= minPrice.Value);
        if (maxPrice.HasValue) query = query.Where(m => m.Price <= maxPrice.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => m.Name.ToLower().Contains(search.ToLower()));

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(m => m.Price)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(m => Map(m))
            .ToListAsync();

        return new PagedResult<MembershipDto>(items, total, page, pageSize);
    }

    public async Task<MembershipDto> GetByIdAsync(int id)
    {
        var m = await _db.Memberships.Include(x => x.Options).FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new KeyNotFoundException("Абонемент не найден");
        return Map(m);
    }

    public async Task<MembershipDto> CreateAsync(CreateMembershipDto dto)
    {
        var entity = new Membership
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            DurationDays = dto.DurationDays,
            CreatedAt = DateTime.UtcNow,
            Options = dto.Options?.Select(o => new MembershipOption { OptionText = o }).ToList() ?? new()
        };
        _db.Memberships.Add(entity);
        await _db.SaveChangesAsync();
        return Map(entity);
    }

    public async Task<MembershipDto> UpdateAsync(int id, UpdateMembershipDto dto)
    {
        var entity = await _db.Memberships.Include(m => m.Options).FirstOrDefaultAsync(m => m.Id == id)
            ?? throw new KeyNotFoundException("Абонемент не найден");

        entity.Name = dto.Name;
        entity.Description = dto.Description;
        entity.Price = dto.Price;
        entity.DurationDays = dto.DurationDays;

        // Пересоздаём опции
        _db.MembershipOptions.RemoveRange(entity.Options);
        entity.Options = dto.Options?.Select(o => new MembershipOption { OptionText = o }).ToList() ?? new();

        await _db.SaveChangesAsync();
        return Map(entity);
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await _db.Memberships.FindAsync(id)
            ?? throw new KeyNotFoundException("Абонемент не найден");
        _db.Memberships.Remove(entity);
        await _db.SaveChangesAsync();
    }

    private static MembershipDto Map(Membership m) =>
        new(m.Id, m.Name, m.Description, m.Price, m.DurationDays, m.CreatedAt,
            m.Options.Select(o => o.OptionText).ToList());
}
