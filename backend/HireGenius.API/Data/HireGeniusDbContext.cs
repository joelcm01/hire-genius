using HireGenius.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Newtonsoft.Json;

namespace HireGenius.API.Data;

/// <summary>
/// Entity Framework Core database context for HireGenius.
/// </summary>
public class HireGeniusDbContext : DbContext
{
    public HireGeniusDbContext(DbContextOptions<HireGeniusDbContext> options) : base(options)
    {
    }

    public DbSet<Candidate> Candidates => Set<Candidate>();
    public DbSet<CandidateSkill> CandidateSkills => Set<CandidateSkill>();
    public DbSet<CandidateExperience> CandidateExperiences => Set<CandidateExperience>();
    public DbSet<Vacancy> Vacancies => Set<Vacancy>();
    public DbSet<Evaluation> Evaluations => Set<Evaluation>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<InterviewFeedback> InterviewFeedbacks => Set<InterviewFeedback>();
    public DbSet<CandidateStatus> CandidateStatuses => Set<CandidateStatus>();
    public DbSet<GDriveFolder> GDriveFolders => Set<GDriveFolder>();
    public DbSet<GDriveSyncLog> GDriveSyncLogs => Set<GDriveSyncLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // JSON list converter for TEXT columns
        var stringListConverter = new ValueConverter<List<string>, string>(
            v => JsonConvert.SerializeObject(v),
            v => JsonConvert.DeserializeObject<List<string>>(v) ?? new List<string>()
        );

        // ── Candidate ────────────────────────────────────────────────────────
        modelBuilder.Entity<Candidate>(entity =>
        {
            entity.HasKey(e => e.CandidateId);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.GDriveFileId);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        });

        // ── CandidateSkill ───────────────────────────────────────────────────
        modelBuilder.Entity<CandidateSkill>(entity =>
        {
            entity.HasKey(e => e.SkillId);
            entity.HasIndex(e => e.CandidateId);
            entity.HasOne(e => e.Candidate)
                  .WithMany(c => c.Skills)
                  .HasForeignKey(e => e.CandidateId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── CandidateExperience ──────────────────────────────────────────────
        modelBuilder.Entity<CandidateExperience>(entity =>
        {
            entity.HasKey(e => e.ExperienceId);
            entity.HasIndex(e => e.CandidateId);
            entity.HasOne(e => e.Candidate)
                  .WithMany(c => c.Experiences)
                  .HasForeignKey(e => e.CandidateId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Vacancy ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Vacancy>(entity =>
        {
            entity.HasKey(e => e.VacancyId);
            entity.HasIndex(e => e.IsActive);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            // JSON arrays stored as TEXT
            entity.Property(e => e.Requirements).HasColumnType("TEXT");
            entity.Property(e => e.Values).HasColumnType("TEXT");
        });

        // ── Evaluation ───────────────────────────────────────────────────────
        modelBuilder.Entity<Evaluation>(entity =>
        {
            entity.HasKey(e => e.EvaluationId);
            entity.HasIndex(e => e.CandidateId);
            entity.HasIndex(e => e.VacancyId);
            entity.HasIndex(e => new { e.CandidateId, e.VacancyId });
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.CompatibilityScore).HasColumnType("decimal(5,2)");
            entity.HasOne(e => e.Candidate)
                  .WithMany(c => c.Evaluations)
                  .HasForeignKey(e => e.CandidateId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Vacancy)
                  .WithMany(v => v.Evaluations)
                  .HasForeignKey(e => e.VacancyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── Contact ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Contact>(entity =>
        {
            entity.HasKey(e => e.ContactId);
            entity.HasIndex(e => e.CandidateId);
            entity.HasIndex(e => e.VacancyId);
            entity.HasOne(e => e.Candidate)
                  .WithMany(c => c.Contacts)
                  .HasForeignKey(e => e.CandidateId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Vacancy)
                  .WithMany(v => v.Contacts)
                  .HasForeignKey(e => e.VacancyId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── InterviewFeedback ────────────────────────────────────────────────
        modelBuilder.Entity<InterviewFeedback>(entity =>
        {
            entity.HasKey(e => e.FeedbackId);
            entity.HasIndex(e => e.CandidateId);
            entity.HasIndex(e => e.VacancyId);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Candidate)
                  .WithMany(c => c.InterviewFeedbacks)
                  .HasForeignKey(e => e.CandidateId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Vacancy)
                  .WithMany(v => v.InterviewFeedbacks)
                  .HasForeignKey(e => e.VacancyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── CandidateStatus ──────────────────────────────────────────────────
        modelBuilder.Entity<CandidateStatus>(entity =>
        {
            entity.HasKey(e => e.StatusId);
            entity.HasIndex(e => new { e.CandidateId, e.VacancyId });
            entity.Property(e => e.Status)
                  .HasConversion<string>()
                  .HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
            entity.HasOne(e => e.Candidate)
                  .WithMany(c => c.Statuses)
                  .HasForeignKey(e => e.CandidateId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Vacancy)
                  .WithMany(v => v.Statuses)
                  .HasForeignKey(e => e.VacancyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── GDriveFolder ─────────────────────────────────────────────────────
        modelBuilder.Entity<GDriveFolder>(entity =>
        {
            entity.HasKey(e => e.FolderId);
            entity.HasIndex(e => e.GDriveFolderId).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // ── GDriveSyncLog ────────────────────────────────────────────────────
        modelBuilder.Entity<GDriveSyncLog>(entity =>
        {
            entity.HasKey(e => e.SyncId);
            entity.HasIndex(e => e.FolderId);
            entity.HasIndex(e => e.SyncDate);
            entity.HasOne(e => e.Folder)
                  .WithMany(f => f.SyncLogs)
                  .HasForeignKey(e => e.FolderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<Candidate>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        var statusEntries = ChangeTracker.Entries<CandidateStatus>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in statusEntries)
        {
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
    }
}
