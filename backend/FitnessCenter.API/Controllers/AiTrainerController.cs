using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/ai-trainer")]
[Authorize(Roles = "User,Client")]
public class AiTrainerController : ControllerBase
{
    private readonly AiTrainerService _aiTrainerService;

    public AiTrainerController(AiTrainerService aiTrainerService)
    {
        _aiTrainerService = aiTrainerService;
    }

    [HttpGet("status")]
    public async Task<ActionResult<AiTrainerStatusDto>> GetStatus()
    {
        return Ok(await _aiTrainerService.GetStatusAsync(GetUserId()));
    }

    [HttpPost("chat")]
    public async Task<ActionResult<AiTrainerChatResponseDto>> Chat(AiTrainerChatRequestDto request)
    {
        return Ok(await _aiTrainerService.SendMessageAsync(GetUserId(), request));
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
}
