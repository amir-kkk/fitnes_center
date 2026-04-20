using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User,Admin")]
public class BookingsController : ControllerBase
{
    private readonly BookingService _svc;
    public BookingsController(BookingService svc) => _svc = svc;

    [HttpGet("my")]
    public async Task<ActionResult<List<BookingDto>>> GetMy()
    {
        return Ok(await _svc.GetByUserAsync(GetUserId()));
    }

    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<ActionResult<PagedResult<BookingDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        return Ok(await _svc.GetAllAsync(page, pageSize));
    }

    [HttpPost]
    public async Task<ActionResult<BookingDto>> Create(CreateBookingDto dto)
    {
        var result = await _svc.CreateAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Cancel(int id)
    {
        await _svc.CancelAsync(id, GetUserId());
        return NoContent();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
}
