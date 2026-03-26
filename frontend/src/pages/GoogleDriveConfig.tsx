import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  HardDrive,
  RefreshCw,
  Plus,
  ExternalLink,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format, formatDistanceToNow } from 'date-fns'
import {
  getAuthUrl,
  triggerSync,
  getSyncStatus,
  getSyncHistory,
  getFolders,
  addFolder,
  removeFolder,
} from '../api/gdrive'

const GoogleDriveConfig: React.FC = () => {
  const queryClient = useQueryClient()
  const [folderIdInput, setFolderIdInput] = useState('')
  const [addingFolder, setAddingFolder] = useState(false)

  const { data: authData, isLoading: loadingAuth } = useQuery({
    queryKey: ['gdrive-auth'],
    queryFn: () => getAuthUrl().then((r) => r.data),
  })

  const { data: syncStatus, isLoading: loadingSync } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => getSyncStatus().then((r) => r.data),
    refetchInterval: 15_000,
  })

  const { data: syncHistory } = useQuery({
    queryKey: ['sync-history'],
    queryFn: () => getSyncHistory().then((r) => r.data),
  })

  const { data: folders, isLoading: loadingFolders } = useQuery({
    queryKey: ['gdrive-folders'],
    queryFn: () => getFolders().then((r) => r.data),
  })

  const syncMutation = useMutation({
    mutationFn: () => triggerSync().then((r) => r.data),
    onSuccess: (result) => {
      toast.success(
        `Sync completed: ${result.files_processed} files processed${result.errors_count > 0 ? `, ${result.errors_count} errors` : ''}`,
      )
      queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      queryClient.invalidateQueries({ queryKey: ['sync-history'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: () => {
      toast.error('Sync failed. Make sure Google Drive is connected.')
    },
  })

  const addFolderMutation = useMutation({
    mutationFn: (folderId: string) =>
      addFolder({ folder_id: folderId }).then((r) => r.data),
    onSuccess: (folder) => {
      toast.success(`Folder "${folder.folder_name || folder.folder_id}" added!`)
      queryClient.invalidateQueries({ queryKey: ['gdrive-folders'] })
      setFolderIdInput('')
      setAddingFolder(false)
    },
    onError: () => {
      toast.error('Failed to add folder. Check the folder ID and permissions.')
    },
  })

  const removeFolderMutation = useMutation({
    mutationFn: (folderId: string) => removeFolder(folderId),
    onSuccess: () => {
      toast.success('Folder removed.')
      queryClient.invalidateQueries({ queryKey: ['gdrive-folders'] })
    },
    onError: () => {
      toast.error('Failed to remove folder.')
    },
  })

  const handleAddFolder = () => {
    const trimmed = folderIdInput.trim()
    if (!trimmed) {
      toast.error('Please enter a valid folder ID')
      return
    }
    addFolderMutation.mutate(trimmed)
  }

  const isConnected = authData?.is_connected ?? false

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Drive Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect your Google Drive to automatically import candidate CVs
        </p>
      </div>

      {/* Connection Status */}
      <div className={`card p-5 border-l-4 ${isConnected ? 'border-l-green-500' : 'border-l-orange-400'}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle size={24} className="text-green-500 shrink-0" />
            ) : (
              <AlertCircle size={24} className="text-orange-400 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {isConnected ? 'Google Drive Connected' : 'Google Drive Not Connected'}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {isConnected
                  ? 'Your account is linked. CVs from configured folders will be synced automatically.'
                  : 'Connect your Google Drive account to start importing CVs.'}
              </p>
            </div>
          </div>
          {!isConnected && !loadingAuth && authData?.auth_url && (
            <a
              href={authData.auth_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary shrink-0"
            >
              <ExternalLink size={15} />
              Connect Google Drive
            </a>
          )}
          {loadingAuth && (
            <Loader2 size={20} className="animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* Sync Now + Status */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <h2 className="font-semibold text-gray-900">Manual Sync</h2>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !isConnected}
            className="btn-primary"
            title={!isConnected ? 'Connect Google Drive first' : ''}
          >
            <RefreshCw
              size={15}
              className={syncMutation.isPending ? 'animate-spin' : ''}
            />
            {syncMutation.isPending ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>

        {loadingSync ? (
          <div className="text-sm text-gray-400">Loading sync status…</div>
        ) : syncStatus ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-gray-900">
                {syncStatus.files_processed}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Files Processed</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700">
                {syncStatus.files_new}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">New Files</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700">
                {syncStatus.files_updated}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Updated</p>
            </div>
            <div
              className={`p-3 rounded-lg text-center ${
                syncStatus.errors_count > 0 ? 'bg-red-50' : 'bg-gray-50'
              }`}
            >
              <p
                className={`text-2xl font-bold ${
                  syncStatus.errors_count > 0 ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {syncStatus.errors_count}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Errors</p>
            </div>
          </div>
        ) : null}

        {syncStatus?.last_sync && (
          <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
            <Clock size={12} />
            Last sync:{' '}
            {formatDistanceToNow(new Date(syncStatus.last_sync), {
              addSuffix: true,
            })}{' '}
            ({format(new Date(syncStatus.last_sync), 'MMM d, yyyy HH:mm')}) &middot;{' '}
            {syncStatus.duration_seconds.toFixed(1)}s
          </p>
        )}
      </div>

      {/* Folders */}
      <div className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Watched Folders</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              CVs from these folders will be imported during sync
            </p>
          </div>
          <button
            onClick={() => setAddingFolder((v) => !v)}
            className="btn-secondary text-sm"
          >
            <Plus size={14} />
            Add Folder
          </button>
        </div>

        {addingFolder && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <label className="label">Google Drive Folder ID</label>
            <p className="text-xs text-gray-400 mb-2">
              Copy the folder ID from the URL:{' '}
              <code className="bg-gray-200 px-1 rounded text-gray-600">
                drive.google.com/drive/folders/[FOLDER_ID]
              </code>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderIdInput}
                onChange={(e) => setFolderIdInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                placeholder="Paste folder ID here…"
                className="input flex-1"
                autoFocus
              />
              <button
                onClick={handleAddFolder}
                disabled={addFolderMutation.isPending}
                className="btn-primary text-sm"
              >
                {addFolderMutation.isPending ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setAddingFolder(false)
                  setFolderIdInput('')
                }}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loadingFolders ? (
          <div className="text-sm text-gray-400 py-4 text-center">
            Loading folders…
          </div>
        ) : !folders || folders.length === 0 ? (
          <div className="py-8 text-center">
            <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No folders configured yet</p>
            <p className="text-xs text-gray-300 mt-0.5">
              Add a folder to start syncing CVs
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {folders.map((folder) => (
              <div
                key={folder.folder_id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      folder.is_active
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <HardDrive size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {folder.folder_name || folder.folder_id}
                    </p>
                    <p className="text-xs text-gray-400 font-mono truncate">
                      {folder.folder_id}
                    </p>
                    {folder.last_sync_date && (
                      <p className="text-xs text-gray-400">
                        Last synced{' '}
                        {formatDistanceToNow(new Date(folder.last_sync_date), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {folder.is_active ? (
                    <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Remove folder "${folder.folder_name || folder.folder_id}"?`,
                        )
                      ) {
                        removeFolderMutation.mutate(folder.folder_id)
                      }
                    }}
                    disabled={removeFolderMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove folder"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync History */}
      {syncHistory && syncHistory.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Sync History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Files</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">New</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Updated</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Errors</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {syncHistory.map((entry, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">
                      {entry.last_sync
                        ? format(new Date(entry.last_sync), 'MMM d, yyyy HH:mm')
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-700">
                      {entry.files_processed}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-green-600 font-medium">
                        +{entry.files_new}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-blue-600 font-medium">
                        ~{entry.files_updated}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {entry.errors_count > 0 ? (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle size={12} />
                          {entry.errors_count}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle size={12} />0
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 flex items-center gap-1">
                      <FileText size={12} />
                      {entry.duration_seconds.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoogleDriveConfig
