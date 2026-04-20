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
[Authorize(Roles = "Admin")]
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


    /// Смена роли пользователя

    [HttpPut("users/{id}/role")]
    public async Task<IActionResult> UpdateRole(Guid id, [FromBody] string role)
    {
        if (role != "Admin" && role != "User" && role != "Trainer")
            return BadRequest("Допустимые роли: Admin, User, Trainer");

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
    public async Task<ActionResult<PagedResult<PersonalWorkoutSlotDto>>> GetPersonalWorkouts(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        return Ok(await _personalWorkoutService.GetAllForAdminAsync(page, pageSize));
    }

    [HttpDelete("personal-workouts/{slotId:int}/cancel")]
    public async Task<IActionResult> CancelPersonalWorkout(int slotId)
    {
        await _personalWorkoutService.CancelByAdminAsync(slotId);
        return NoContent();
    }
}
