using System.Text;
using System.Text.Json.Serialization;
using FitnessCenter.API.Data;
using FitnessCenter.API.Middleware;
using FitnessCenter.API.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ═══ PostgreSQL ═══
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ═══ JWT-аутентификация ═══
var jwt = builder.Configuration.GetSection("JwtSettings");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!))
        };
    });
builder.Services.AddAuthorization();

// ═══ Бизнес-сервисы ═══
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<MembershipService>();
builder.Services.AddScoped<TrainingService>();
builder.Services.AddScoped<PurchaseService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<ProgressService>();
builder.Services.AddScoped<PersonalWorkoutService>();
builder.Services.AddScoped<MembershipAccessService>();
builder.Services.AddScoped<AiTrainerService>();

// ═══ FluentValidation ═══
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

// ═══ Controllers + JSON (enum как строки) ═══
builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// ═══ Swagger с поддержкой JWT ═══
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "FitnessCenter API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Введите JWT: Bearer {token}",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        BearerFormat = "JWT",
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// ═══ CORS ═══
builder.Services.AddCors(o =>
    o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// ═══ Создание схемы БД и наполнение начальными данными ═══
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await SeedData.InitializeAsync(db);
}

// ═══ Каталоги для загрузки аватаров ═══
var webRoot = app.Environment.WebRootPath
    ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "users"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "trainers"));
app.Environment.WebRootPath = webRoot;

// ═══ Pipeline ═══
app.UseMiddleware<ExceptionMiddleware>();
app.UseStaticFiles();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// SPA fallback: все маршруты, не совпавшие с API или статикой,
// отдают index.html — дальше React Router обрабатывает роутинг на клиенте
app.MapFallbackToFile("index.html");

app.Run();
