using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a job candidate in the system.
/// </summary>
[Table("candidates")]
public class Candidate
{
    [Key]
    [Column("candidate_id")]
    public Guid CandidateId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [MaxLength(50)]
    [Column("phone")]
    public string? Phone { get; set; }

    [MaxLength(255)]
    [Column("location")]
    public string? Location { get; set; }

    [MaxLength(255)]
    [Column("gdrive_file_id")]
    public string? GDriveFileId { get; set; }

    [MaxLength(500)]
    [Column("cv_s3_path")]
    public string? CvS3Path { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<CandidateSkill> Skills { get; set; } = new List<CandidateSkill>();
    public ICollection<CandidateExperience> Experiences { get; set; } = new List<CandidateExperience>();
    public ICollection<Evaluation> Evaluations { get; set; } = new List<Evaluation>();
    public ICollection<Contact> Contacts { get; set; } = new List<Contact>();
    public ICollection<InterviewFeedback> InterviewFeedbacks { get; set; } = new List<InterviewFeedback>();
    public ICollection<CandidateStatus> Statuses { get; set; } = new List<CandidateStatus>();
}
