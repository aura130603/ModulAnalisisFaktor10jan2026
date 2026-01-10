import { useState, useEffect, useRef } from 'react';
import { useDataStore } from '@/stores/useDataStore';

export type SyncStatusType = 'idle' | 'syncing' | 'error';

// Sync after user stops editing for a minute
export default function useAutoSync(debounceMs: number = 60000) {
  const hasUnsavedChanges = useDataStore((s) => s.hasUnsavedChanges);
  const saveData = useDataStore((s) => s.saveData);

  const [status, setStatus] = useState<SyncStatusType>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus('syncing');
      try {
        await saveData();
        setStatus('idle');
        setLastSyncedAt(new Date());
        setError(null);
      } catch (e: any) {
        setStatus('error');
        setError(e.message || 'Sync failed');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hasUnsavedChanges, debounceMs, saveData]);

  return { status, lastSyncedAt, error };
}
