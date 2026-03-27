using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HireGenius.API.Models;

/// <summary>
/// Represents a Google Drive folder registered for CV syncing.
/// </summary>
[Table("gdrive_folders")]
public class GDriveFolder
{
    [Key]
    [Column("folder_id")]
    public Guid FolderId { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(255)]
    [Column("gdrive_folder_id")]
    public string GDriveFolderId { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("folder_name")]
    public string FolderName { get; set; } = string.Empty;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<GDriveSyncLog> SyncLogs { get; set; } = new List<GDriveSyncLog>();
}
