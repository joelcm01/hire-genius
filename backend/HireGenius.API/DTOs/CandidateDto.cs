using System.ComponentModel.DataAnnotations;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for creating or updating a candidate.
/// </summary>
public class CreateCandidateDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(255)]
    public string? Location { get; set; }

    [MaxLength(255)]
    public string? GDriveFileId { get; set; }

    public List<CreateSkillDto>? Skills { get; set; }
    public List<CreateExperienceDto>? Experiences { get; set; }
}

/// <summary>
/// DTO for returning candidate data.
/// </summary>
public class CandidateDto
{
    public Guid CandidateId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Location { get; set; }
    public string? GDriveFileId { get; set; }
    public string? CvS3Path { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<SkillDto> Skills { get; set; } = new();
    public List<ExperienceDto> Experiences { get; set; } = new();
}

/// <summary>
/// DTO for creating a skill.
/// </summary>
public class CreateSkillDto
{
    [Required]
    [MaxLength(255)]
    public string SkillName { get; set; } = string.Empty;

    [MaxLength(50)]
    public string SkillType { get; set; } = "Technical";

    [MaxLength(50)]
    public string? ProficiencyLevel { get; set; }
}

/// <summary>
/// DTO for returning skill data.
/// </summary>
public class SkillDto
{
    public Guid SkillId { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string SkillType { get; set; } = string.Empty;
    public string? ProficiencyLevel { get; set; }
}

/// <summary>
/// DTO for creating a work experience entry.
/// </summary>
public class CreateExperienceDto
{
    [Required]
    [MaxLength(255)]
    public string Company { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string Position { get; set; } = string.Empty;

    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? DurationMonths { get; set; }
}

/// <summary>
/// DTO for returning work experience data.
/// </summary>
public class ExperienceDto
{
    public Guid ExperienceId { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public int? DurationMonths { get; set; }
}
