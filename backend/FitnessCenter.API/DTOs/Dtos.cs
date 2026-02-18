namespace FitnessCenter.API.DTOs;

// ════════════════════════════════════════
// Общий контейнер для постраничной выдачи
// ════════════════════════════════════════
public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);

// ════════════════════════════════════════
// Аутентификация
// ════════════════════════════════════════
public record RegisterDto(string Email, string Password, string FullName);
public record LoginDto(string Email, string Password);
public record AuthResponse(string Token, UserDto User);
public record UserDto(Guid Id, string Email, string FullName, string Role, DateTime CreatedAt);

// ════════════════════════════════════════
// Абонементы
// ════════════════════════════════════════
public record MembershipDto(
    int Id, string Name, string Description, decimal Price,
    int DurationDays, DateTime CreatedAt, List<string> Options);

public record CreateMembershipDto(
    string Name, string Description, decimal Price,
    int DurationDays, List<string>? Options);

public record UpdateMembershipDto(
    string Name, string Description, decimal Price,
    int DurationDays, List<string>? Options);

// ════════════════════════════════════════
// Тренировки, категории, тренеры
// ════════════════════════════════════════
public record TrainingDto(
    int Id, string Description, DateTime StartTime, int MaxParticipants,
    int CurrentParticipants, string CategoryName, string CoachName,
    string? CoachPhotoUrl, int CategoryId, int CoachId);

public record CreateTrainingDto(
    int CategoryId, int CoachId, string Description,
    string? CoachPhotoUrl, DateTime StartTime, int MaxParticipants);

public record UpdateTrainingDto(
    int CategoryId, int CoachId, string Description,
    string? CoachPhotoUrl, DateTime StartTime, int MaxParticipants);

public record CategoryDto(int Id, string Name);
public record CoachDto(int Id, string FullName, string? PhotoUrl, string? Specialization);
public record CreateCategoryDto(string Name);
public record CreateCoachDto(string FullName, string? PhotoUrl, string? Specialization);

// ════════════════════════════════════════
// Покупки и бронирования
// ════════════════════════════════════════
public record PurchaseDto(
    int Id, Guid UserId, string UserEmail, int MembershipId,
    string MembershipName, decimal PriceAtPurchase, string Status, DateTime CreatedAt);

public record CreatePurchaseDto(int MembershipId);

public record BookingDto(
    int Id, int TrainingId, string TrainingDescription,
    DateTime TrainingStartTime, string CoachName,
    Guid UserId, string UserEmail, string Status);

public record CreateBookingDto(int TrainingId);

// ════════════════════════════════════════
// Прогресс
// ════════════════════════════════════════
public record ProgressTrackerDto(
    int Id, string Title, double GoalValue, string Unit,
    DateTime CreatedAt, double? LastValue, double? ChangePercent);

public record CreateTrackerDto(string Title, double GoalValue, string Unit);
public record ProgressEntryDto(int Id, double Value, DateTime DateRecorded);
public record CreateEntryDto(double Value);
