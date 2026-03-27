using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a skill associated with a candidate.
/// </summary>
[Table("candidate_skills")]
public class CandidateSkill
{
    [Key]
    [Column("skill_id")]
    public Guid SkillId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("skill_name")]
    public string SkillName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("skill_type")]
    public string SkillType { get; set; } = "Technical"; // Technical or Soft

    [MaxLength(50)]
    [Column("proficiency_level")]
    public string? ProficiencyLevel { get; set; }

    // Navigation property
    [ForeignKey(nameof(CandidateId))]
    public Candidate? Candidate { get; set; }
}
