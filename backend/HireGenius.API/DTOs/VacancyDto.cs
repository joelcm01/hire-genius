using System.ComponentModel.DataAnnotations;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for creating or updating a vacancy.
/// </summary>
public class CreateVacancyDto
{
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Department { get; set; }

    public string? Description { get; set; }

    public List<string>? Requirements { get; set; }

    public List<string>? Values { get; set; }

    public int? RequiredExperienceYears { get; set; }

    [Range(1, int.MaxValue)]
    public int OpenPositions { get; set; } = 1;

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for returning vacancy data.
/// </summary>
public class VacancyDto
{
    public Guid VacancyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string? Description { get; set; }
    public List<string> Requirements { get; set; } = new();
    public List<string> Values { get; set; } = new();
    public int? RequiredExperienceYears { get; set; }
    public int OpenPositions { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
