using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Services;

/// <summary>
/// Покупка абонементов + имитация оплаты
/// </summary>
public class PurchaseService
{
    private readonly AppDbContext _db;
    public PurchaseService(AppDbContext db) => _db = db;

    public async Task<PagedResult<PurchaseDto>> GetByUserAsync(Guid userId, int page, int pageSize)
    {
        var query = _db.Purchases
            .Include(p => p.Membership).Include(p => p.User)
            .Where(p => p.UserId == userId);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => Map(p))
            .ToListAsync();

        return new PagedResult<PurchaseDto>(items, total, page, pageSize);
    }

    /// <summary>
    /// Все покупки — для администратора
    /// </summary>
    public async Task<PagedResult<PurchaseDto>> GetAllAsync(int page, int pageSize, string? search)
    {
        var query = _db.Purchases.Include(p => p.Membership).Include(p => p.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.User.Email.ToLower().Contains(search.ToLower()));

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(p => Map(p))
            .ToListAsync();

        return new PagedResult<PurchaseDto>(items, total, page, pageSize);
    }

    public async Task<PurchaseDto> CreateAsync(Guid userId, CreatePurchaseDto dto)
    {
        var membership = await _db.Memberships.FindAsync(dto.MembershipId)
            ?? throw new KeyNotFoundException("Абонемент не найден");

        var purchase = new Purchase
        {
            UserId = userId,
            MembershipId = membership.Id,
            PriceAtPurchase = membership.Price,
            Status = PurchaseStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.Purchases.Add(purchase);
        await _db.SaveChangesAsync();

        return await GetByIdInternalAsync(purchase.Id);
    }

    /// <summary>
    /// Имитация оплаты — переводит статус в Paid
    /// </summary>
    public async Task<PurchaseDto> PayAsync(int id, Guid userId)
    {
        var purchase = await _db.Purchases.FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId)
            ?? throw new KeyNotFoundException("Покупка не найдена");

        if (purchase.Status == PurchaseStatus.Paid)
            throw new InvalidOperationException("Покупка уже оплачена");

        purchase.Status = PurchaseStatus.Paid;
        await _db.SaveChangesAsync();

        return await GetByIdInternalAsync(purchase.Id);
    }

    private async Task<PurchaseDto> GetByIdInternalAsync(int id)
    {
        var p = await _db.Purchases.Include(x => x.Membership).Include(x => x.User)
            .FirstAsync(x => x.Id == id);
        return Map(p);
    }

    private static PurchaseDto Map(Purchase p) =>
        new(p.Id, p.UserId, p.User.Email, p.MembershipId,
            p.Membership.Name, p.PriceAtPurchase, p.Status.ToString(), p.CreatedAt);
}
