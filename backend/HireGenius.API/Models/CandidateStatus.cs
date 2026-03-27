using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents the current recruitment status of a candidate for a specific vacancy.
/// </summary>
[Table("candidate_status")]
public class CandidateStatus
{
    [Key]
    [Column("status_id")]
    public Guid StatusId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; }

    [Required]
    [Column("vacancy_id")]
    public Guid VacancyId { get; set; }

    [Required]
    [MaxLength(50)]
    [Column("status")]
    public string Status { get; set; } = CandidateStatusEnum.EnProceso;

    [Column("hire_date")]
    public DateOnly? HireDate { get; set; }

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey(nameof(CandidateId))]
    public Candidate? Candidate { get; set; }

    [ForeignKey(nameof(VacancyId))]
    public Vacancy? Vacancy { get; set; }
}

/// <summary>
/// Enumeration constants for candidate status values.
/// </summary>
public static class CandidateStatusEnum
{
    public const string EnProceso = "en_proceso";
    public const string Contratado = "contratado";
    public const string NoApto = "no_apto";
    public const string EnEspera = "en_espera";
    public const string Descartado = "descartado";

    public static readonly string[] AllValues =
    [
        EnProceso, Contratado, NoApto, EnEspera, Descartado
    ];
}
