using Microsoft.EntityFrameworkCore;
using FitnessCenter.API.Models;

namespace FitnessCenter.API.Data;

/// <summary>
/// Контекст БД — конфигурация сущностей и связей через Fluent API
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<MembershipOption> MembershipOptions => Set<MembershipOption>();
    public DbSet<Training> Trainings => Set<Training>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<PersonalWorkout> PersonalWorkouts => Set<PersonalWorkout>();
    public DbSet<AiTrainerUsage> AiTrainerUsages => Set<AiTrainerUsage>();
    public DbSet<AiTrainerMessage> AiTrainerMessages => Set<AiTrainerMessage>();
    public DbSet<ProgressTracker> ProgressTrackers => Set<ProgressTracker>();
    public DbSet<ProgressEntry> ProgressEntries => Set<ProgressEntry>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ─── User ───
        mb.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(20);
            e.Property(u => u.PhotoUrl).HasMaxLength(500);
        });

        // ─── Membership ───
        mb.Entity<Membership>(e =>
        {
            e.HasIndex(m => m.Price);
            e.Property(m => m.Price).HasColumnType("decimal(10,2)");
        });

        mb.Entity<MembershipOption>(e =>
        {
            e.HasOne(o => o.Membership)
                .WithMany(m => m.Options)
                .HasForeignKey(o => o.MembershipId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Training ───
        mb.Entity<Training>(e =>
        {
            e.HasIndex(t => t.StartTime);
            e.HasIndex(t => t.CategoryId);
            e.HasIndex(t => t.TrainerId);
            e.HasOne(t => t.Category).WithMany(c => c.Trainings).HasForeignKey(t => t.CategoryId);
            e.HasOne(t => t.Trainer)
                .WithMany(u => u.TrainerTrainings)
                .HasForeignKey(t => t.TrainerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ─── Purchase ───
        mb.Entity<Purchase>(e =>
        {
            e.Property(p => p.PriceAtPurchase).HasColumnType("decimal(10,2)");
            e.HasOne(p => p.User).WithMany(u => u.Purchases).HasForeignKey(p => p.UserId);
            e.HasOne(p => p.Membership).WithMany(m => m.Purchases).HasForeignKey(p => p.MembershipId);
        });

        // ─── Booking: уникальный индекс только для активных записей ───
        mb.Entity<Booking>(e =>
        {
            e.HasIndex(b => new { b.TrainingId, b.UserId })
                .IsUnique()
                .HasFilter("\"Status\" = 0");
            e.HasOne(b => b.Training).WithMany(t => t.Bookings).HasForeignKey(b => b.TrainingId);
            e.HasOne(b => b.User).WithMany(u => u.Bookings).HasForeignKey(b => b.UserId);
        });

        // ─── PersonalWorkout ───
        mb.Entity<PersonalWorkout>(e =>
        {
            e.HasIndex(pw => new { pw.TrainerId, pw.DateTime }).IsUnique();
            e.Property(pw => pw.Price).HasColumnType("decimal(10,2)");
            e.HasOne(pw => pw.Trainer)
                .WithMany(u => u.TrainerPersonalWorkouts)
                .HasForeignKey(pw => pw.TrainerId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(pw => pw.Client)
                .WithMany(u => u.ClientPersonalWorkouts)
                .HasForeignKey(pw => pw.ClientId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ─── AI Trainer usage limits ───
        mb.Entity<AiTrainerUsage>(e =>
        {
            e.Property(x => x.UsageDate).HasColumnType("date");
            e.HasIndex(x => new { x.UserId, x.UsageDate }).IsUnique();
            e.HasOne(x => x.User)
                .WithMany(u => u.AiTrainerUsages)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── AI Trainer successful messages ───
        mb.Entity<AiTrainerMessage>(e =>
        {
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasOne(x => x.User)
                .WithMany(u => u.AiTrainerMessages)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Progress ───
        mb.Entity<ProgressTracker>(e =>
        {
            e.HasOne(pt => pt.User).WithMany(u => u.ProgressTrackers).HasForeignKey(pt => pt.UserId);
        });

        mb.Entity<ProgressEntry>(e =>
        {
            e.HasOne(pe => pe.Tracker)
                .WithMany(pt => pt.Entries)
                .HasForeignKey(pe => pe.TrackerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ─── AuditLog ───
        mb.Entity<AuditLog>(e =>
        {
            e.HasIndex(a => a.Timestamp);
            e.HasIndex(a => a.EntityName);
            e.HasIndex(a => a.Action);
            e.Property(a => a.Action).HasMaxLength(16);
            e.Property(a => a.EntityName).HasMaxLength(128);
            e.HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
