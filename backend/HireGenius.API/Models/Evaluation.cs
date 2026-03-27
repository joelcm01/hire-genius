using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents an AI-generated evaluation of a candidate for a vacancy.
/// </summary>
[Table("evaluations")]
public class Evaluation
{
    [Key]
    [Column("evaluation_id")]
    public Guid EvaluationId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; }

    [Required]
    [Column("vacancy_id")]
    public Guid VacancyId { get; set; }

    [Column("compatibility_score", TypeName = "decimal(5,2)")]
    public decimal CompatibilityScore { get; set; }

    [Column("reasoning", TypeName = "TEXT")]
    public string? Reasoning { get; set; }

    /// <summary>
    /// JSON array of candidate strengths relative to the vacancy.
    /// </summary>
    [Column("strengths", TypeName = "TEXT")]
    public string? Strengths { get; set; }

    /// <summary>
    /// JSON array of candidate gaps relative to the vacancy.
    /// </summary>
    [Column("gaps", TypeName = "TEXT")]
    public string? Gaps { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CandidateId))]
    public Candidate? Candidate { get; set; }

    [ForeignKey(nameof(VacancyId))]
    public Vacancy? Vacancy { get; set; }
}
