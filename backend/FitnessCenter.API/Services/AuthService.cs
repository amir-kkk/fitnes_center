using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FitnessCenter.API.Data;
using FitnessCenter.API.DTOs;
using FitnessCenter.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FitnessCenter.API.Services;

/// <summary>
/// Сервис аутентификации: регистрация, логин, генерация JWT
/// </summary>
public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            throw new InvalidOperationException("Пользователь с таким email уже существует");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName,
            Role = "User",
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(GenerateToken(user), MapUser(user));
    }

    public async Task<AuthResponse> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email)
            ?? throw new KeyNotFoundException("Неверный email или пароль");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new KeyNotFoundException("Неверный email или пароль");

        return new AuthResponse(GenerateToken(user), MapUser(user));
    }

    public async Task<UserDto> GetByIdAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден");
        return MapUser(user);
    }

    public async Task<UserDto> UploadUserPhotoAsync(Guid userId, IFormFile file, string webRootPath)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new KeyNotFoundException("Пользователь не найден");

        if (user.Role == "Trainer")
            throw new InvalidOperationException("Фото тренера задается администратором");

        var uploadsDir = Path.Combine(webRootPath, "uploads", "users");
        Directory.CreateDirectory(uploadsDir);

        if (!string.IsNullOrEmpty(user.PhotoUrl) && user.PhotoUrl.StartsWith("/uploads/"))
        {
            var oldPath = Path.Combine(webRootPath, user.PhotoUrl.TrimStart('/'));
            if (File.Exists(oldPath)) File.Delete(oldPath);
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{user.Id}_{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        user.PhotoUrl = $"/uploads/users/{fileName}";
        await _db.SaveChangesAsync();

        return MapUser(user);
    }

    /// <summary>
    /// Генерация JWT-токена с claims: sub, email, role
    /// </summary>
    private string GenerateToken(User user)
    {
        var jwt = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("fullName", user.FullName)
        };

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(jwt["ExpireMinutes"]!)),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static UserDto MapUser(User u) =>
        new(u.Id, u.Email, u.FullName, u.Role, u.PhotoUrl, u.TrainerRank, u.CreatedAt);
}
