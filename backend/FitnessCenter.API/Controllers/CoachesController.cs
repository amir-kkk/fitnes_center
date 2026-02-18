using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

/// <summary>
/// Полный CRUD тренеров + загрузка фото из локального файла
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CoachesController : ControllerBase
{
    private readonly TrainingService _svc;
    private readonly IWebHostEnvironment _env;

    public CoachesController(TrainingService svc, IWebHostEnvironment env)
    {
        _svc = svc;
        _env = env;
    }

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

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<ActionResult<CoachDto>> Update(int id, UpdateCoachDto dto)
    {
        var result = await _svc.UpdateCoachAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _svc.DeleteCoachAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Загрузка фото тренера из файла (multipart/form-data).
    /// Допустимые форматы: jpg, png, webp. Макс. 5 МБ.
    /// </summary>
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/photo")]
    public async Task<ActionResult<CoachDto>> UploadPhoto(int id, IFormFile file)
    {
        if (file.Length == 0)
            return BadRequest(new { detail = "Файл пуст" });
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { detail = "Файл слишком большой (макс. 5 МБ)" });

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { detail = "Допустимые форматы: jpg, png, webp" });

        var webRootPath = _env.WebRootPath
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        var result = await _svc.UploadCoachPhotoAsync(id, file, webRootPath);
        return Ok(result);
    }
}
