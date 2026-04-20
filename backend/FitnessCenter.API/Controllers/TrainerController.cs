using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Trainer")]
public class TrainerController : ControllerBase
{
    private readonly PersonalWorkoutService _svc;

    public TrainerController(PersonalWorkoutService svc) => _svc = svc;

    [HttpGet("my-workouts")]
    public async Task<ActionResult<List<PersonalWorkoutSlotDto>>> GetMyWorkouts([FromQuery] bool history = false)
    {
        return Ok(await _svc.GetTrainerWorkoutsAsync(GetUserId(), history));
    }

    [HttpPost("slots")]
    public async Task<ActionResult<PersonalWorkoutSlotDto>> CreateSlot(CreatePersonalWorkoutSlotDto dto)
    {
        return Ok(await _svc.CreateTrainerSlotAsync(GetUserId(), dto));
    }

    [HttpGet("client-progress/{clientId:guid}")]
    public async Task<ActionResult<List<ProgressTrackerDto>>> GetClientProgress(Guid clientId)
    {
        return Ok(await _svc.GetClientProgressForTrainerAsync(GetUserId(), clientId));
    }

    [HttpGet("client-progress/{clientId:guid}/trackers/{trackerId:int}/entries")]
    public async Task<ActionResult<List<ProgressEntryDto>>> GetClientTrackerEntries(Guid clientId, int trackerId)
    {
        return Ok(await _svc.GetClientTrackerEntriesAsync(GetUserId(), clientId, trackerId));
    }

    [HttpPost("update-progress")]
    public async Task<ActionResult<List<ProgressTrackerDto>>> UpdateProgress(TrainerUpdateProgressDto dto)
    {
        return Ok(await _svc.UpdateClientProgressAsync(GetUserId(), dto));
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
}
