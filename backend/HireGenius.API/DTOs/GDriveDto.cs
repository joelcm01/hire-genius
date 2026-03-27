using System.ComponentModel.DataAnnotations;

namespace HireGenius.API.DTOs;

/// <summary>
/// DTO for adding a Google Drive folder.
/// </summary>
public class CreateGDriveFolderDto
{
    [Required]
    [MaxLength(255)]
    public string GDriveFolderId { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string FolderName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
}

/// <summary>
/// DTO for returning Google Drive folder data.
/// </summary>
public class GDriveFolderDto
{
    public Guid FolderId { get; set; }
    public string GDriveFolderId { get; set; } = string.Empty;
    public string FolderName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public GDriveSyncLogDto? LastSync { get; set; }
}

/// <summary>
/// DTO for returning sync log data.
/// </summary>
public class GDriveSyncLogDto
{
    public Guid SyncId { get; set; }
    public Guid FolderId { get; set; }
    public DateTime SyncDate { get; set; }
    public int FilesProcessed { get; set; }
    public int FilesNew { get; set; }
    public int FilesUpdated { get; set; }
    public int ErrorsCount { get; set; }
    public double DurationSeconds { get; set; }
    public List<string> ErrorDetails { get; set; } = new();
}

/// <summary>
/// DTO for the overall GDrive sync status.
/// </summary>
public class GDriveSyncStatusDto
{
    public bool IsAuthenticated { get; set; }
    public DateTime? LastSyncDate { get; set; }
    public int ActiveFolders { get; set; }
    public int TotalSyncs { get; set; }
    public List<GDriveFolderDto> Folders { get; set; } = new();
}

/// <summary>
/// DTO for the Google Drive OAuth2 auth URL response.
/// </summary>
public class GDriveAuthUrlDto
{
    public string AuthUrl { get; set; } = string.Empty;
}

/// <summary>
/// DTO for the Google Drive OAuth2 callback.
/// </summary>
public class GDriveAuthCallbackDto
{
    [Required]
    public string Code { get; set; } = string.Empty;
}

/// <summary>
/// DTO for the result of a manual sync trigger.
/// </summary>
public class SyncTriggerResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? JobId { get; set; }
}
