using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a contact event with a candidate.
/// </summary>
[Table("contacts")]
public class Contact
{
    [Key]
    [Column("contact_id")]
    public Guid ContactId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; }

    [Column("vacancy_id")]
    public Guid? VacancyId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("contact_method")]
    public string ContactMethod { get; set; } = "Email"; // Email, WhatsApp, Phone

    [Column("contact_date")]
    public DateTime ContactDate { get; set; } = DateTime.UtcNow;

    [MaxLength(255)]
    [Column("responsible")]
    public string? Responsible { get; set; }

    [Column("notes", TypeName = "TEXT")]
    public string? Notes { get; set; }

    [MaxLength(500)]
    [Column("whatsapp_url")]
    public string? WhatsAppUrl { get; set; }

    // Navigation properties
    [ForeignKey(nameof(CandidateId))]
    public Candidate? Candidate { get; set; }

    [ForeignKey(nameof(VacancyId))]
    public Vacancy? Vacancy { get; set; }
}
