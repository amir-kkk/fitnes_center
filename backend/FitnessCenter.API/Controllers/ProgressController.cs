using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "User,Admin")]
public class ProgressController : ControllerBase
{
    private readonly ProgressService _svc;
    public ProgressController(ProgressService svc) => _svc = svc;

    [HttpGet("trackers")]
    public async Task<ActionResult<List<ProgressTrackerDto>>> GetTrackers()
    {
        return Ok(await _svc.GetTrackersAsync(GetUserId()));
    }

    [HttpPost("trackers")]
    public async Task<ActionResult<ProgressTrackerDto>> CreateTracker(CreateTrackerDto dto)
    {
        var result = await _svc.CreateTrackerAsync(GetUserId(), dto);
        return Ok(result);
    }

    [HttpDelete("trackers/{id}")]
    public async Task<IActionResult> DeleteTracker(int id)
    {
        await _svc.DeleteTrackerAsync(id, GetUserId());
        return NoContent();
    }

    [HttpGet("trackers/{trackerId}/entries")]
    public async Task<ActionResult<List<ProgressEntryDto>>> GetEntries(int trackerId)
    {
        return Ok(await _svc.GetEntriesAsync(trackerId, GetUserId()));
    }

    [HttpPost("trackers/{trackerId}/entries")]
    public async Task<ActionResult<ProgressEntryDto>> AddEntry(int trackerId, CreateEntryDto dto)
    {
        var result = await _svc.AddEntryAsync(trackerId, GetUserId(), dto);
        return Ok(result);
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
}
