using HireGenius.API.Models;

namespace HireGenius.API.Services;

/// <summary>
/// Service interface for AI-powered CV processing and candidate evaluation.
/// </summary>
public interface IAIService
{
    /// <summary>
    /// Extracts structured candidate data from raw CV text using Claude AI.
    /// </summary>
    /// <param name="cvText">Raw text content of the CV.</param>
    /// <returns>Extracted candidate data as a structured object.</returns>
    Task<ExtractedCvData> ExtractCvDataAsync(string cvText);

    /// <summary>
    /// Evaluates a candidate's compatibility with a vacancy using Claude AI.
    /// </summary>
    /// <param name="candidate">The candidate to evaluate.</param>
    /// <param name="vacancy">The vacancy to evaluate against.</param>
    /// <returns>Evaluation result with score, reasoning, strengths, and gaps.</returns>
    Task<EvaluationResult> EvaluateCandidateAsync(Candidate candidate, Vacancy vacancy);
}

/// <summary>
/// Data extracted from a CV by the AI service.
/// </summary>
public class ExtractedCvData
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public List<ExtractedSkill> Skills { get; set; } = new();
    public List<ExtractedExperience> Experiences { get; set; } = new();
}

public class ExtractedSkill
{
    public string SkillName { get; set; } = string.Empty;
    public string SkillType { get; set; } = "Technical";
    public string? ProficiencyLevel { get; set; }
}

public class ExtractedExperience
{
    public string Company { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public int? DurationMonths { get; set; }
}

/// <summary>
/// Result of an AI evaluation of a candidate against a vacancy.
/// </summary>
public class EvaluationResult
{
    public decimal CompatibilityScore { get; set; }
    public string Reasoning { get; set; } = string.Empty;
    public List<string> Strengths { get; set; } = new();
    public List<string> Gaps { get; set; } = new();
}
