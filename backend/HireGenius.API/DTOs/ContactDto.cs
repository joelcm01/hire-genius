using System.ComponentModel.DataAnnotations;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for creating an email contact event.
/// </summary>
public class CreateEmailContactDto
{
    public Guid? VacancyId { get; set; }

    [MaxLength(255)]
    public string? Responsible { get; set; }

    public string? Notes { get; set; }
}

/// <summary>
/// DTO for creating a WhatsApp contact event.
/// </summary>
public class CreateWhatsAppContactDto
{
    public Guid? VacancyId { get; set; }

    [MaxLength(255)]
    public string? Responsible { get; set; }

    public string? Notes { get; set; }

    [MaxLength(500)]
    public string? CustomMessage { get; set; }
}

/// <summary>
/// DTO for returning contact data.
/// </summary>
public class ContactDto
{
    public Guid ContactId { get; set; }
    public Guid CandidateId { get; set; }
    public string CandidateName { get; set; } = string.Empty;
    public Guid? VacancyId { get; set; }
    public string? VacancyTitle { get; set; }
    public string ContactMethod { get; set; } = string.Empty;
    public DateTime ContactDate { get; set; }
    public string? Responsible { get; set; }
    public string? Notes { get; set; }
    public string? WhatsAppUrl { get; set; }
}
