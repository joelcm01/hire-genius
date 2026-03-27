using System.ComponentModel.DataAnnotations;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for requesting a new AI evaluation.
/// </summary>
public class CreateEvaluationDto
{
    [Required]
    public Guid CandidateId { get; set; }

    [Required]
    public Guid VacancyId { get; set; }
}

/// <summary>
/// DTO for returning evaluation data.
/// </summary>
public class EvaluationDto
{
    public Guid EvaluationId { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public Guid VacancyId { get; set; }
    public string VacancyTitle { get; set; } = string.Empty;
    public decimal CompatibilityScore { get; set; }
    public string? Reasoning { get; set; }
    public List<string> Strengths { get; set; } = new();
    public List<string> Gaps { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO for a ranked candidate result within a vacancy evaluation list.
/// </summary>
public class RankedCandidateDto
{
    public int Rank { get; set; }
    public EvaluationDto Evaluation { get; set; } = new();
    public CandidateDto Candidate { get; set; } = new();
}
