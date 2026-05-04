namespace FitnessCenter.API.DTOs;

// Общий контейнер для постраничной выдачи

public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);


// Аутентификация

public record RegisterDto(string Email, string Password, string FullName);
public record LoginDto(string Email, string Password);
public record AuthResponse(string Token, UserDto User);
public record UserDto(
    Guid Id, string Email, string FullName, string Role,
    string? PhotoUrl, int? TrainerRank, DateTime CreatedAt);

// Абонементы

public record MembershipDto(
    int Id, string Name, string Description, decimal Price,
    int DurationDays, DateTime CreatedAt, List<string> Options);

public record CreateMembershipDto(
    string Name, string Description, decimal Price,
    int DurationDays, List<string>? Options);

public record UpdateMembershipDto(
    string Name, string Description, decimal Price,
    int DurationDays, List<string>? Options);


// Тренировки, категории, тренеры

public record TrainingDto(
    int Id, string Description, DateTime StartTime, int MaxParticipants,
    int CurrentParticipants, string CategoryName, string TrainerName,
    string? TrainerPhotoUrl, int CategoryId, Guid TrainerId);

public record CreateTrainingDto(
    int CategoryId, Guid TrainerId, string Description,
    DateTime StartTime, int MaxParticipants);

public record UpdateTrainingDto(
    int CategoryId, Guid TrainerId, string Description,
    DateTime StartTime, int MaxParticipants);

public record CategoryDto(int Id, string Name);
public record CoachDto(Guid Id, string FullName, string Email, string? PhotoUrl, int TrainerRank);
public record CreateCategoryDto(string Name);
public record UpdateCoachDto(string FullName, int TrainerRank);

// Покупки и бронирования

public record PurchaseDto(
    int Id, Guid UserId, string UserEmail, int MembershipId,
    string MembershipName, decimal PriceAtPurchase, string Status, DateTime CreatedAt);

public record CreatePurchaseDto(int MembershipId);

public record BookingDto(
    int Id, int TrainingId, string TrainingDescription,
    DateTime TrainingStartTime, string TrainerName,
    Guid UserId, string UserEmail, string Status);

public record CreateBookingDto(int TrainingId);


// Персональные тренировки

public record TrainerListItemDto(Guid Id, string FullName, string Email, string? PhotoUrl, int TrainerRank);
public record PersonalWorkoutSlotDto(
    int Id, Guid TrainerId, string TrainerName, Guid? ClientId, string? ClientName,
    DateTime DateTime, decimal Price, bool IsBooked);
public record CreatePersonalWorkoutSlotDto(DateTime DateTime);
public record CreatePersonalWorkoutRangeDto(DateTime StartDateTime, DateTime EndDateTime);
public record TrainerProgressUpdateItemDto(int? TrackerId, string? Title, string? Unit, double Value);
public record TrainerUpdateProgressDto(Guid ClientId, List<TrainerProgressUpdateItemDto> Updates);


// Прогресс

public record ProgressTrackerDto(
    int Id, string Title, double GoalValue, string Unit,
    DateTime CreatedAt, double? LastValue, double? ChangePercent);

public record CreateTrackerDto(string Title, double GoalValue, string Unit);
public record ProgressEntryDto(int Id, double Value, DateTime DateRecorded);
public record CreateEntryDto(double Value);

// AI Trainer

public record AiChatMessageDto(string Role, string Content);
public record AiTrainerChatRequestDto(string Message, List<AiChatMessageDto>? History);
public record AiTrainerChatResponseDto(string Reply, int RemainingMessages);
public record AiTrainerStatusDto(bool HasActiveMembership, int RemainingMessages, bool CanUseChat, DateTime? MembershipExpiresAt);

// Audit logs
public record AuditLogListItemDto(
    long Id,
    DateTime Timestamp,
    Guid? UserId,
    string UserDisplayName,
    string EntityName,
    string Action);

public record AuditLogDetailsDto(
    long Id,
    DateTime Timestamp,
    Guid? UserId,
    string UserDisplayName,
    string EntityName,
    string Action,
    string? OldValues,
    string? NewValues);

public record AdminOverviewStatsDto(
    int ClientsCount,
    int TrainersCount,
    int ManagersCount,
    int AuditLogsLast24hCount);
