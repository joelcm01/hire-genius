using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a log entry for a Google Drive synchronization run.
/// </summary>
[Table("gdrive_sync_log")]
public class GDriveSyncLog
{
    [Key]
    [Column("sync_id")]
    public Guid SyncId { get; set; } = Guid.NewGuid();

    [Required]
    [Column("folder_id")]
    public Guid FolderId { get; set; }

    [Column("sync_date")]
    public DateTime SyncDate { get; set; } = DateTime.UtcNow;

    [Column("files_processed")]
    public int FilesProcessed { get; set; }

    [Column("files_new")]
    public int FilesNew { get; set; }

    [Column("files_updated")]
    public int FilesUpdated { get; set; }

    [Column("errors_count")]
    public int ErrorsCount { get; set; }

    [Column("duration_seconds")]
    public double DurationSeconds { get; set; }

    /// <summary>
    /// JSON array of error detail strings.
    /// </summary>
    [Column("error_details", TypeName = "TEXT")]
    public string? ErrorDetails { get; set; }

    // Navigation property
    [ForeignKey(nameof(FolderId))]
    public GDriveFolder? Folder { get; set; }
}
