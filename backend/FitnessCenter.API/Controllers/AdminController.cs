using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Controllers;


/// Административные операции — управление пользователями

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly PersonalWorkoutService _personalWorkoutService;
    private readonly PurchaseService _purchaseService;
    private readonly BookingService _bookingService;

    public AdminController(
        AppDbContext db,
        PersonalWorkoutService personalWorkoutService,
        PurchaseService purchaseService,
        BookingService bookingService)
    {
        _db = db;
        _personalWorkoutService = personalWorkoutService;
        _purchaseService = purchaseService;
        _bookingService = bookingService;
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<UserDto>>> GetUsers(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(u =>
                u.Email.ToLower().Contains(search.ToLower()) ||
                u.FullName.ToLower().Contains(search.ToLower()));

        var total = await query.CountAsync();
        var items = await query
            .OrderBy(u => u.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(u => new UserDto(
                u.Id, u.Email, u.FullName, u.Role, u.PhoneNumber, u.PhotoUrl, u.TrainerRank, u.CreatedAt))
            .ToListAsync();

        return Ok(new PagedResult<UserDto>(items, total, page, pageSize));
    }

    [HttpGet("clients")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<PagedResult<ClientListItemDto>>> GetClients(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var clientsQuery = _db.Users
            .Where(u => u.Role == "User" || u.Role == "Client");

        if (!string.IsNullOrWhiteSpace(search))
        {
            var needle = search.ToLower();
            clientsQuery = clientsQuery.Where(u =>
                u.Email.ToLower().Contains(needle) ||
                u.FullName.ToLower().Contains(needle));
        }

        var total = await clientsQuery.CountAsync();
        var clients = await clientsQuery
            .OrderBy(u => u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new { u.Id, u.FullName, u.Email, u.PhoneNumber })
            .ToListAsync();

        var clientIds = clients.Select(c => c.Id).ToList();
        var purchases = await _db.Purchases
            .Include(p => p.Membership)
            .Where(p => clientIds.Contains(p.UserId))
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.UserId,
                p.Status,
                MembershipName = p.Membership.Name
            })
            .ToListAsync();

        var latestByClient = purchases
            .GroupBy(p => p.UserId)
            .ToDictionary(g => g.Key, g => g.First());

        var items = clients
            .Select(c =>
            {
                latestByClient.TryGetValue(c.Id, out var latest);
                var status = latest == null
                    ? "None"
                    : latest.Status == Models.PurchaseStatus.Paid ? "Paid" : "Reserved";
                return new ClientListItemDto(
                    c.Id,
                    c.FullName,
                    c.Email,
                    c.PhoneNumber,
                    status,
                    latest?.MembershipName);
            })
            .ToList();

        return Ok(new PagedResult<ClientListItemDto>(items, total, page, pageSize));
    }

    [HttpGet("overview-stats")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminOverviewStatsDto>> GetOverviewStats()
    {
        var clientsCount = await _db.Users.CountAsync(u => u.Role == "User" || u.Role == "Client");
        var trainersCount = await _db.Users.CountAsync(u => u.Role == "Trainer");
        var managersCount = await _db.Users.CountAsync(u => u.Role == "Manager");
        var from = DateTime.UtcNow.AddHours(-24);
        var auditLogsLast24hCount = await _db.AuditLogs.CountAsync(a => a.Timestamp >= from);

        return Ok(new AdminOverviewStatsDto(
            clientsCount,
            trainersCount,
            managersCount,
            auditLogsLast24hCount));
    }


    /// Смена роли пользователя

    [HttpPut("users/{id}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] string role)
    {
        if (role != "Admin" && role != "User" && role != "Trainer" && role != "Manager")
            return BadRequest("Допустимые роли: Admin, User, Trainer, Manager");

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = role;
        if (role != "Trainer") user.TrainerRank = null;
        if (role == "Trainer" && user.TrainerRank == null) user.TrainerRank = 1;
        await _db.SaveChangesAsync();
        return Ok(new UserDto(
            user.Id, user.Email, user.FullName, user.Role, user.PhoneNumber, user.PhotoUrl, user.TrainerRank, user.CreatedAt));
    }

    [HttpPost("users")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<UserDto>> CreateManagedUser(CreateManagedUserDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest("Пользователь с таким email уже существует");

        var normalizedPhone = string.IsNullOrWhiteSpace(dto.PhoneNumber)
            ? null
            : new string(dto.PhoneNumber.Where(c => char.IsDigit(c) || c == '+').ToArray());

        var user = new Models.User
        {
            Id = Guid.NewGuid(),
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLowerInvariant(),
            PhoneNumber = normalizedPhone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Ok(new UserDto(
            user.Id, user.Email, user.FullName, user.Role, user.PhoneNumber, user.PhotoUrl, user.TrainerRank, user.CreatedAt));
    }

    [HttpPost("users/{id:guid}/password")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> SetUserPassword(Guid id, AdminSetUserPasswordDto dto)
    {
        var target = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && (u.Role == "User" || u.Role == "Client"))
            ?? throw new KeyNotFoundException("Клиент не найден");

        target.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("personal-workouts")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<PagedResult<PersonalWorkoutSlotDto>>> GetPersonalWorkouts(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        return Ok(await _personalWorkoutService.GetAllForAdminAsync(page, pageSize));
    }

    [HttpDelete("personal-workouts/{slotId:int}/cancel")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> CancelPersonalWorkout(int slotId)
    {
        await _personalWorkoutService.CancelByAdminAsync(slotId);
        return NoContent();
    }

    [HttpPost("personal-workouts/assign")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<PersonalWorkoutSlotDto>> AssignPersonalWorkout(ManagerAssignPersonalWorkoutDto dto)
    {
        var slot = await _db.PersonalWorkouts
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == dto.SlotId && w.TrainerId == dto.TrainerId)
            ?? throw new KeyNotFoundException("Слот тренера не найден");

        var result = await _personalWorkoutService.AssignClientToSlotByManagerAsync(slot.Id, dto.ClientId);
        return Ok(result);
    }

    [HttpPost("personal-workouts/{slotId:int}/confirm-payment")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<PersonalWorkoutSlotDto>> ConfirmPersonalWorkoutPayment(int slotId)
    {
        var result = await _personalWorkoutService.ConfirmPaymentByManagerAsync(slotId);
        return Ok(result);
    }

    [HttpPost("group-bookings/assign")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<BookingDto>> AssignGroupBooking(ManagerAssignGroupBookingDto dto)
    {
        var result = await _bookingService.CreateForUserByManagerAsync(dto.UserId, new CreateBookingDto(dto.TrainingId));
        return Ok(result);
    }

    [HttpPost("memberships/assign")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<PurchaseDto>> AssignMembership(ManagerAssignPurchaseDto dto)
    {
        var result = await _purchaseService.CreateForUserAsync(dto.UserId, dto.MembershipId, markAsPaid: true);
        return Ok(result);
    }

    [HttpPost("memberships/{purchaseId:int}/confirm-payment")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<PurchaseDto>> ConfirmMembershipPayment(int purchaseId)
    {
        var result = await _purchaseService.ConfirmPaymentAsync(purchaseId);
        return Ok(result);
    }

    [HttpGet("audit-logs")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PagedResult<AuditLogListItemDto>>> GetAuditLogs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.AuditLogs
            .AsNoTracking()
            .Include(a => a.User)
            .OrderByDescending(a => a.Timestamp);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogListItemDto(
                a.Id,
                a.Timestamp,
                a.UserId,
                a.User != null ? $"{a.User.FullName} ({a.User.Email})" : "System",
                a.EntityName,
                a.Action))
            .ToListAsync();

        return Ok(new PagedResult<AuditLogListItemDto>(items, total, page, pageSize));
    }

    [HttpGet("audit-logs/{id:long}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AuditLogDetailsDto>> GetAuditLogById(long id)
    {
        var log = await _db.AuditLogs
            .AsNoTracking()
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (log == null) return NotFound();

        return Ok(new AuditLogDetailsDto(
            log.Id,
            log.Timestamp,
            log.UserId,
            log.User != null ? $"{log.User.FullName} ({log.User.Email})" : "System",
            log.EntityName,
            log.Action,
            log.OldValues,
            log.NewValues));
    }
}
