using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a work experience entry for a candidate.
/// </summary>
[Table("candidate_experience")]
public class CandidateExperience
{
    [Key]
    [Column("experience_id")]
    public Guid ExperienceId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("company")]
    public string Company { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("position")]
    public string Position { get; set; } = string.Empty;

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Column("duration_months")]
    public int? DurationMonths { get; set; }

    // Navigation property
    [ForeignKey(nameof(CandidateId))]
    public Candidate? Candidate { get; set; }
}
