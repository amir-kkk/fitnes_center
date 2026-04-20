using System.Security.Claims;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitnessCenter.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly IWebHostEnvironment _env;

    public AuthController(AuthService auth, IWebHostEnvironment env)
    {
        _auth = auth;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterDto dto)
    {
        var result = await _auth.RegisterAsync(dto);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginDto dto)
    {
        var result = await _auth.LoginAsync(dto);
        return Ok(result);
    }


    /// Текущий пользователь по JWT-токену

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);
        var user = await _auth.GetByIdAsync(userId);
        return Ok(user);
    }

    [Authorize]
    [HttpPost("me/photo")]
    public async Task<ActionResult<UserDto>> UploadMyPhoto(IFormFile file)
    {
        if (file.Length == 0)
            return BadRequest(new { detail = "Файл пуст" });
        if (file.Length > 5 * 1024 * 1024)
            return BadRequest(new { detail = "Файл слишком большой (макс. 5 МБ)" });

        var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp" };
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowed.Contains(ext))
            return BadRequest(new { detail = "Допустимые форматы: jpg, png, webp" });

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")!);

        var webRootPath = _env.WebRootPath
            ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        var result = await _auth.UploadUserPhotoAsync(userId, file, webRootPath);
        return Ok(result);
    }
}
