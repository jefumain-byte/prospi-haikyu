import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppData } from '../types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let client: SupabaseClient | null = null

if (url && anonKey) {
  client = createClient(url, anonKey)
}

export function getSupabase() {
  return client
}

export function isCloudSyncEnabled(): boolean {
  return client !== null
}

/** ログイン中の自動クラウドバックアップ間隔（3分） */
export const AUTO_CLOUD_BACKUP_INTERVAL_MS = 3 * 60 * 1000

interface SyncRow {
  sync_id: string
  payload: AppData
  updated_at: string
}

export async function pullCloudData(syncId: string): Promise<AppData | null> {
  if (!client) return null

  const { data, error } = await client
    .from('prospi_sync')
    .select('payload')
    .eq('sync_id', syncId)
    .maybeSingle()

  if (error) throw error
  if (!data?.payload) return null
  return data.payload as AppData
}

export async function pushCloudData(syncId: string, data: AppData): Promise<void> {
  if (!client) return

  const { error } = await client.from('prospi_sync').upsert({
    sync_id: syncId,
    payload: data,
    updated_at: new Date().toISOString(),
  })

  if (error) throw error
}

export function subscribeCloudChanges(syncId: string, onUpdate: (data: AppData) => void) {
  if (!client) return () => {}

  const channel = client
    .channel(`prospi-sync-${syncId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'prospi_sync',
        filter: `sync_id=eq.${syncId}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as SyncRow | null
        if (row?.payload) onUpdate(row.payload)
      },
    )
    .subscribe()

  return () => {
    void client.removeChannel(channel)
  }
}
