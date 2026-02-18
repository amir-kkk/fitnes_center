using FitnessCenter.API.DTOs;
using FluentValidation;

namespace FitnessCenter.API.Validators;

// ─── Аутентификация ───

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("Некорректный email");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6).WithMessage("Пароль должен быть не менее 6 символов");
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200).WithMessage("Укажите имя");
    }
}

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

// ─── Абонементы ───

public class CreateMembershipDtoValidator : AbstractValidator<CreateMembershipDto>
{
    public CreateMembershipDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Price).GreaterThan(0).WithMessage("Цена должна быть положительной");
        RuleFor(x => x.DurationDays).GreaterThan(0).WithMessage("Длительность должна быть положительной");
    }
}

public class UpdateMembershipDtoValidator : AbstractValidator<UpdateMembershipDto>
{
    public UpdateMembershipDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.DurationDays).GreaterThan(0);
    }
}

// ─── Тренировки ───

public class CreateTrainingDtoValidator : AbstractValidator<CreateTrainingDto>
{
    public CreateTrainingDtoValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.CoachId).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.MaxParticipants).GreaterThan(0).WithMessage("Количество участников должно быть положительным");
        RuleFor(x => x.StartTime).GreaterThan(DateTime.UtcNow).WithMessage("Дата должна быть в будущем");
    }
}

public class UpdateTrainingDtoValidator : AbstractValidator<UpdateTrainingDto>
{
    public UpdateTrainingDtoValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0);
        RuleFor(x => x.CoachId).GreaterThan(0);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.MaxParticipants).GreaterThan(0);
    }
}

// ─── Прогресс ───

public class CreateTrackerDtoValidator : AbstractValidator<CreateTrackerDto>
{
    public CreateTrackerDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.GoalValue).GreaterThan(0).WithMessage("Цель должна быть положительной");
        RuleFor(x => x.Unit).NotEmpty().MaximumLength(50);
    }
}

public class CreateEntryDtoValidator : AbstractValidator<CreateEntryDto>
{
    public CreateEntryDtoValidator()
    {
        RuleFor(x => x.Value).GreaterThanOrEqualTo(0).WithMessage("Значение не может быть отрицательным");
    }
}

// ─── Категории / Тренеры ───

public class CreateCategoryDtoValidator : AbstractValidator<CreateCategoryDto>
{
    public CreateCategoryDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class CreateCoachDtoValidator : AbstractValidator<CreateCoachDto>
{
    public CreateCoachDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
    }
}

public class UpdateCoachDtoValidator : AbstractValidator<UpdateCoachDto>
{
    public UpdateCoachDtoValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
    }
}
