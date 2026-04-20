using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkoutsController : ControllerBase
{
    private readonly PersonalWorkoutService _svc;

    public WorkoutsController(PersonalWorkoutService svc) => _svc = svc;

    [HttpGet("trainers")]
    public async Task<ActionResult<List<TrainerListItemDto>>> GetTrainers()
    {
        return Ok(await _svc.GetTrainersAsync());
    }

    [HttpGet("trainer/{trainerId:guid}/slots")]
    public async Task<ActionResult<List<PersonalWorkoutSlotDto>>> GetTrainerSlots(Guid trainerId)
    {
        return Ok(await _svc.GetAvailableSlotsByTrainerAsync(trainerId));
    }

    [Authorize(Roles = "User,Admin")]
    [HttpGet("my")]
    public async Task<ActionResult<List<PersonalWorkoutSlotDto>>> GetMy([FromQuery] bool history = false)
    {
        return Ok(await _svc.GetClientWorkoutsAsync(GetUserId(), history));
    }

    [HttpPost("buy/{slotId:int}")]
    [Authorize(Roles = "User,Admin")]
    public async Task<ActionResult<PersonalWorkoutSlotDto>> Buy(int slotId)
    {
        var result = await _svc.BuySlotAsync(slotId, GetUserId());
        return Ok(result);
    }

    [Authorize(Roles = "User,Admin")]
    [HttpDelete("my/{slotId:int}")]
    public async Task<IActionResult> CancelMy(int slotId)
    {
        await _svc.CancelClientWorkoutAsync(slotId, GetUserId());
        return NoContent();
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
}
