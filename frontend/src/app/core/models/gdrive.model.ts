export interface GDriveFolder {
  folderId: string;
  gdriveFolderId: string;
  folderName: string;
  isActive: boolean;
  createdAt: string;
}

export interface SyncStatus {
  lastSync?: string;
  filesProcessed: number;
  filesNew: number;
  filesUpdated: number;
  errorsCount: number;
  durationSeconds: number;
}

export interface AddFolderDto {
  gdriveFolderId: string;
  folderName: string;
}
