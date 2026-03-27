using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a job vacancy/opening.
/// </summary>
[Table("vacancies")]
public class Vacancy
{
    [Key]
    [Column("vacancy_id")]
    public Guid VacancyId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(255)]
    [Column("department")]
    public string? Department { get; set; }

    [Column("description", TypeName = "TEXT")]
    public string? Description { get; set; }

    /// <summary>
    /// JSON array of requirement strings stored as TEXT.
    /// </summary>
    [Column("requirements", TypeName = "TEXT")]
    public string? Requirements { get; set; }

    /// <summary>
    /// JSON array of company value strings stored as TEXT.
    /// </summary>
    [Column("values", TypeName = "TEXT")]
    public string? Values { get; set; }

    [Column("required_experience_years")]
    public int? RequiredExperienceYears { get; set; }

    [Column("open_positions")]
    public int OpenPositions { get; set; } = 1;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<InterviewFeedback> InterviewFeedbacks { get; set; } = new List<InterviewFeedback>();
    public ICollection<CandidateStatus> Statuses { get; set; } = new List<CandidateStatus>();
}
