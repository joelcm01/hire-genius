using System.ComponentModel.DataAnnotations;
using HireGenius.API.Models;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for updating a candidate's recruitment status.
/// </summary>
public class UpdateStatusDto
{
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = CandidateStatusEnum.EnProceso;

    [Required]
    public Guid VacancyId { get; set; }

    public DateOnly? HireDate { get; set; }
}

/// <summary>
/// DTO for returning candidate status data.
/// </summary>
public class StatusDto
{
    public Guid StatusId { get; set; }
    public Guid CandidateId { get; set; }
    public Guid VacancyId { get; set; }
    public string VacancyTitle { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateOnly? HireDate { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for dashboard statistics.
/// </summary>
public class DashboardStatsDto
{
    public int TotalCandidates { get; set; }
    public int TotalVacancies { get; set; }
    public int ActiveVacancies { get; set; }
    public int TotalEvaluations { get; set; }
    public int HiredCandidates { get; set; }
    public int InProcessCandidates { get; set; }
    public int RejectedCandidates { get; set; }
    public double AverageCompatibilityScore { get; set; }
    public int TotalContacts { get; set; }
    public int TotalFeedbacks { get; set; }
    public List<VacancySummaryDto> TopVacancies { get; set; } = new();
}

/// <summary>
/// Summary DTO for vacancy statistics.
/// </summary>
public class VacancySummaryDto
{
    public Guid VacancyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Department { get; set; }
    public int CandidateCount { get; set; }
    public double AverageScore { get; set; }
}
