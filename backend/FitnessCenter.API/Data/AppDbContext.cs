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
    public DbSet<Coach> Coaches => Set<Coach>();
    public DbSet<Membership> Memberships => Set<Membership>();
    public DbSet<MembershipOption> MembershipOptions => Set<MembershipOption>();
    public DbSet<Training> Trainings => Set<Training>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<ProgressTracker> ProgressTrackers => Set<ProgressTracker>();
    public DbSet<ProgressEntry> ProgressEntries => Set<ProgressEntry>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ─── User ───
        mb.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasMaxLength(20);
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
            e.HasOne(t => t.Category).WithMany(c => c.Trainings).HasForeignKey(t => t.CategoryId);
            e.HasOne(t => t.Coach).WithMany(c => c.Trainings).HasForeignKey(t => t.CoachId);
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
    }
}
