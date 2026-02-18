using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoachesController : ControllerBase
{
    private readonly TrainingService _svc;
    public CoachesController(TrainingService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<List<CoachDto>>> GetAll()
    {
        return Ok(await _svc.GetCoachesAsync());
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<CoachDto>> Create(CreateCoachDto dto)
    {
        var result = await _svc.CreateCoachAsync(dto);
        return Ok(result);
    }
}
