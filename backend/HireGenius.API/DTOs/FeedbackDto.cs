using System.ComponentModel.DataAnnotations;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for creating interview feedback.
/// </summary>
public class CreateFeedbackDto
{
    [Required]
    public Guid CandidateId { get; set; }

    [Required]
    public Guid VacancyId { get; set; }

    [Required]
    [Range(1, 5)]
    public int Rating { get; set; }

    public string? Strengths { get; set; }

    public string? AreasForImprovement { get; set; }

    [Required]
    [MaxLength(50)]
    public string Recommendation { get; set; } = "Maybe"; // Hire, Reject, Maybe

    public string? Notes { get; set; }

    [MaxLength(255)]
    public string? Interviewer { get; set; }
}

/// <summary>
/// DTO for returning interview feedback data.
/// </summary>
public class FeedbackDto
{
    public Guid FeedbackId { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public Guid VacancyId { get; set; }
    public string VacancyTitle { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Strengths { get; set; }
    public string? AreasForImprovement { get; set; }
    public string Recommendation { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string? Interviewer { get; set; }
    public DateTime CreatedAt { get; set; }
}
