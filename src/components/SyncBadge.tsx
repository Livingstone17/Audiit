import { AlertTriangle, Check, Cloud, CloudOff, Database, RefreshCw } from 'lucide-react'
import { useAppStore, type SyncStatus } from '../store/app'
import { Badge } from './ui/badge'
import { cn } from '../lib/utils'

type Variant = 'success' | 'info' | 'warning' | 'danger' | 'muted'

const STATUS: Record<SyncStatus, { label: string; variant: Variant; icon: typeof Cloud }> = {
  disabled: { label: 'Local only', variant: 'muted', icon: Database },
  idle: { label: 'Cloud ready', variant: 'muted', icon: Cloud },
  syncing: { label: 'Syncing…', variant: 'info', icon: RefreshCw },
  synced: { label: 'Synced', variant: 'success', icon: Check },
  offline: { label: 'Offline — will sync', variant: 'warning', icon: CloudOff },
  error: { label: 'Sync error', variant: 'danger', icon: AlertTriangle },
}

/** Compact cloud-status pill. Click to flush immediately when signed in. */
export function SyncBadge({ className }: { className?: string }) {
  const status = useAppStore((s) => s.syncStatus)
  const pending = useAppStore((s) => s.pendingSync)
  const cloudUserId = useAppStore((s) => s.cloudUserId)
  const syncNow = useAppStore((s) => s.syncNow)
  const { label, variant, icon: Icon } = STATUS[status]

  return (
    <button
      type="button"
      onClick={() => {
        if (cloudUserId) void syncNow()
      }}
      disabled={!cloudUserId || status === 'syncing'}
      title={
        cloudUserId
          ? 'Sync progress with Supabase'
          : 'Add Supabase credentials to .env to sync progress'
      }
      className={cn('inline-flex shrink-0 disabled:cursor-default', className)}
    >
      <Badge variant={variant}>
        <Icon size={11} className={status === 'syncing' ? 'animate-spin' : undefined} />
        {label}
        {pending && status !== 'syncing' ? ' •' : ''}
      </Badge>
    </button>
  )
}
