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

    public AdminController(AppDbContext db, PersonalWorkoutService personalWorkoutService)
    {
        _db = db;
        _personalWorkoutService = personalWorkoutService;
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
                u.Id, u.Email, u.FullName, u.Role, u.PhotoUrl, u.TrainerRank, u.CreatedAt))
            .ToListAsync();

        return Ok(new PagedResult<UserDto>(items, total, page, pageSize));
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
            user.Id, user.Email, user.FullName, user.Role, user.PhotoUrl, user.TrainerRank, user.CreatedAt));
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
