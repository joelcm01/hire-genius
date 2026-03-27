import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { GDriveFolder, SyncStatus, AddFolderDto } from '../models/gdrive.model';

export interface FoldersResponse {
  folders: GDriveFolder[];
}

export interface SyncResponse {
  message: string;
  status: SyncStatus;
}

export interface AuthStatusResponse {
  isConnected: boolean;
  email?: string;
  accountName?: string;
}

@Injectable({ providedIn: 'root' })
export class GDriveService extends ApiService {

  getAuthStatus(): Observable<AuthStatusResponse> {
    return this.get<AuthStatusResponse>('/gdrive/auth-status');
  }

  getFolders(): Observable<FoldersResponse> {
    return this.get<FoldersResponse>('/gdrive/folders');
  }

  addFolder(data: AddFolderDto): Observable<GDriveFolder> {
    return this.post<GDriveFolder>('/gdrive/folders', data);
  }

  removeFolder(folderId: string): Observable<void> {
    return this.delete<void>(`/gdrive/folders/${folderId}`);
  }

  toggleFolder(folderId: string, isActive: boolean): Observable<GDriveFolder> {
    return this.patch<GDriveFolder>(`/gdrive/folders/${folderId}`, { isActive });
  }

  triggerSync(): Observable<SyncResponse> {
    return this.post<SyncResponse>('/gdrive/sync', {});
  }

  getSyncStatus(): Observable<SyncStatus> {
    return this.get<SyncStatus>('/gdrive/sync/status');
  }

  getSyncHistory(): Observable<SyncStatus[]> {
    return this.get<SyncStatus[]>('/gdrive/sync/history');
  }
}
