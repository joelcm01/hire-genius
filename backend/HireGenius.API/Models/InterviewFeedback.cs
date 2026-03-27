using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents post-interview feedback submitted by an interviewer.
/// </summary>
[Table("interview_feedback")]
public class InterviewFeedback
{
    [Key]
    [Column("feedback_id")]
    public Guid FeedbackId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; }

    [Required]
    [Column("vacancy_id")]
    public Guid VacancyId { get; set; }

    [Range(1, 5)]
    [Column("rating")]
    public int Rating { get; set; }

    [Column("strengths", TypeName = "TEXT")]
    public string? Strengths { get; set; }

    [Column("areas_for_improvement", TypeName = "TEXT")]
    public string? AreasForImprovement { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("recommendation")]
    public string Recommendation { get; set; } = "Maybe"; // Hire, Reject, Maybe

    [Column("notes", TypeName = "TEXT")]
    public string? Notes { get; set; }

    [MaxLength(255)]
    [Column("interviewer")]
    public string? Interviewer { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CandidateId))]
    public Candidate? Candidate { get; set; }

    [ForeignKey(nameof(VacancyId))]
    public Vacancy? Vacancy { get; set; }
}
