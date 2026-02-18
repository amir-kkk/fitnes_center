using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitnessCenter.API.Controllers;

/// <summary>
/// Административные операции — управление пользователями
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    public AdminController(AppDbContext db) => _db = db;

    [HttpGet("users")]
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
            .Select(u => new UserDto(u.Id, u.Email, u.FullName, u.Role, u.CreatedAt))
            .ToListAsync();

        return Ok(new PagedResult<UserDto>(items, total, page, pageSize));
    }

    /// <summary>
    /// Смена роли пользователя
    /// </summary>
    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] string role)
    {
        if (role != "Admin" && role != "User")
            return BadRequest("Допустимые роли: Admin, User");

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.Role = role;
        await _db.SaveChangesAsync();
        return Ok(new UserDto(user.Id, user.Email, user.FullName, user.Role, user.CreatedAt));
    }
}
