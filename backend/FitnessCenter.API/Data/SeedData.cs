using FitnessCenter.API.Models;

namespace FitnessCenter.API.Data;


/// Начальные данные: администратор, категории, тренеры, абонементы, тренировки

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        var changed = false;

        // ─── Администратор ───
        if (!context.Users.Any(u => u.Role == "Admin"))
        {
            context.Users.Add(new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                Role = "Admin",
                FullName = "Администратор",
                CreatedAt = DateTime.UtcNow
            });
            changed = true;
        }

        // ─── Категории ───
        if (!context.Categories.Any())
        {
            context.Categories.AddRange(
                new Category { Name = "Йога" },
                new Category { Name = "Кроссфит" },
                new Category { Name = "Пилатес" },
                new Category { Name = "Бокс" },
                new Category { Name = "Танцы" }
            );
            changed = true;
        }

        // ─── Тренеры ───
        if (!context.Coaches.Any())
        {
            context.Coaches.AddRange(
                new Coach { FullName = "Иванов Иван Иванович", Specialization = "Йога, Пилатес" },
                new Coach { FullName = "Петрова Анна Сергеевна", Specialization = "Кроссфит, Бокс" },
                new Coach { FullName = "Сидоров Виктор Михайлович", Specialization = "Танцы" }
            );
            changed = true;
        }

        // ─── Абонементы ───
        if (!context.Memberships.Any())
        {
            context.Memberships.AddRange(
                new Membership
                {
                    Name = "Базовый",
                    Description = "Доступ к тренажёрному залу в дневное время",
                    Price = 2500m,
                    DurationDays = 30,
                    Options = new List<MembershipOption>
                    {
                        new() { OptionText = "Тренажёрный зал (8:00–16:00)" },
                        new() { OptionText = "Раздевалка с душем" }
                    }
                },
                new Membership
                {
                    Name = "Стандарт",
                    Description = "Полный доступ к залу и групповым занятиям",
                    Price = 4500m,
                    DurationDays = 30,
                    Options = new List<MembershipOption>
                    {
                        new() { OptionText = "Тренажёрный зал (весь день)" },
                        new() { OptionText = "Групповые занятия" },
                        new() { OptionText = "Раздевалка с сауной" }
                    }
                },
                new Membership
                {
                    Name = "Премиум",
                    Description = "VIP-доступ ко всем услугам фитнес-центра",
                    Price = 8000m,
                    DurationDays = 30,
                    Options = new List<MembershipOption>
                    {
                        new() { OptionText = "Тренажёрный зал 24/7" },
                        new() { OptionText = "Все групповые занятия" },
                        new() { OptionText = "Персональный тренер (2 занятия)" },
                        new() { OptionText = "СПА-зона и бассейн" },
                        new() { OptionText = "Полотенца и напитки" }
                    }
                }
            );
            changed = true;
        }

        if (changed) await context.SaveChangesAsync();

        // ─── Тренировки (после сохранения категорий/тренеров) ───
        if (!context.Trainings.Any())
        {
            var cats = context.Categories.ToList();
            var coaches = context.Coaches.ToList();
            var tomorrow = DateTime.UtcNow.Date.AddDays(1);

            context.Trainings.AddRange(
                new Training { CategoryId = cats[0].Id, CoachId = coaches[0].Id, Description = "Утренняя йога для начинающих", StartTime = tomorrow.AddHours(8), MaxParticipants = 20 },
                new Training { CategoryId = cats[1].Id, CoachId = coaches[1].Id, Description = "Кроссфит: интенсив", StartTime = tomorrow.AddHours(10), MaxParticipants = 15 },
                new Training { CategoryId = cats[2].Id, CoachId = coaches[0].Id, Description = "Пилатес: укрепление core", StartTime = tomorrow.AddHours(12), MaxParticipants = 18 },
                new Training { CategoryId = cats[3].Id, CoachId = coaches[1].Id, Description = "Бокс: основы и техника", StartTime = tomorrow.AddHours(14), MaxParticipants = 12 },
                new Training { CategoryId = cats[4].Id, CoachId = coaches[2].Id, Description = "Зумба: танцевальная тренировка", StartTime = tomorrow.AddHours(16), MaxParticipants = 25 },
                new Training { CategoryId = cats[0].Id, CoachId = coaches[0].Id, Description = "Вечерняя йога: расслабление", StartTime = tomorrow.AddHours(19), MaxParticipants = 20 }
            );
            await context.SaveChangesAsync();
        }
    }
}
