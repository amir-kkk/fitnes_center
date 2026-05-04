using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

/// <summary>
/// Управление тренерами на базе User.Role = Trainer:
/// просмотр, обновление ранга/имени, загрузка фото.
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

    [Authorize(Roles = "Manager")]
    [HttpPut("{id}")]
    public async Task<ActionResult<CoachDto>> Update(Guid id, UpdateCoachDto dto)
    {
        var result = await _svc.UpdateCoachAsync(id, dto);
        return Ok(result);
    }

    [Authorize(Roles = "Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _svc.DeleteCoachAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Загрузка фото тренера из файла (multipart/form-data).
    /// Допустимые форматы: jpg, png, webp. Макс. 5 МБ.
    /// </summary>
    [Authorize(Roles = "Manager")]
    [HttpPost("{id}/photo")]
    public async Task<ActionResult<CoachDto>> UploadPhoto(Guid id, IFormFile file)
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
