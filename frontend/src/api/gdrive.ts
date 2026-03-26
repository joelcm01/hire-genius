import client from './client'
import type { SyncStatus, GDriveFolder, AddFolderPayload } from './types'
import type { AxiosResponse } from 'axios'

export const getAuthUrl = (): Promise<
  AxiosResponse<{ auth_url: string; is_connected: boolean }>
> => client.get('/gdrive/auth-url')

export const handleOAuthCallback = (
  code: string,
): Promise<AxiosResponse<{ success: boolean }>> =>
  client.post('/gdrive/oauth-callback', { code })

export const triggerSync = (): Promise<AxiosResponse<SyncStatus>> =>
  client.post('/gdrive/sync')

export const getSyncStatus = (): Promise<AxiosResponse<SyncStatus>> =>
  client.get('/gdrive/sync-status')

export const getSyncHistory = (): Promise<AxiosResponse<SyncStatus[]>> =>
  client.get('/gdrive/sync-history')

export const getFolders = (): Promise<AxiosResponse<GDriveFolder[]>> =>
  client.get('/gdrive/folders')

export const addFolder = (
  data: AddFolderPayload,
): Promise<AxiosResponse<GDriveFolder>> =>
  client.post('/gdrive/folders', data)

export const removeFolder = (
  folderId: string,
): Promise<AxiosResponse<void>> =>
  client.delete(`/gdrive/folders/${folderId}`)
