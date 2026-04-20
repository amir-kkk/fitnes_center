using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrainingsController : ControllerBase
{
    private readonly TrainingService _svc;
    public TrainingsController(TrainingService svc) => _svc = svc;

    [HttpGet]
    public async Task<ActionResult<PagedResult<TrainingDto>>> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] int? categoryId = null, [FromQuery] Guid? trainerId = null,
        [FromQuery] DateTime? date = null, [FromQuery] string? search = null)
    {
        var result = await _svc.GetAllAsync(page, pageSize, categoryId, trainerId, date, search);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TrainingDto>> GetById(int id)
    {
        var result = await _svc.GetByIdAsync(id);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<ActionResult<TrainingDto>> Create(CreateTrainingDto dto)
    {
        var result = await _svc.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<TrainingDto>> Update(int id, UpdateTrainingDto dto)
    {
        var result = await _svc.UpdateAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _svc.DeleteAsync(id);
        return NoContent();
    }
}
