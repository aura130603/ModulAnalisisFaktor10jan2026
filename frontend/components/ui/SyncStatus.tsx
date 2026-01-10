"use client";
import React from 'react';
import { useDataStore } from '@/stores/useDataStore';

export default function SyncStatus() {
  const syncStatus = useDataStore((s) => s.syncStatus);
  const pendingUpdates = useDataStore((s) => s.pendingUpdates);

  // Display priority: syncing > unsaved > error > all saved
  if (syncStatus === 'syncing') {
    return <div className="text-sm text-muted flex items-center">⏳ Syncing...</div>;
  }
  if (pendingUpdates.length > 0) {
    return <div className="text-sm text-warning flex items-center">⚠️ Unsaved changes</div>;
  }
  if (syncStatus === 'error') {
    return <div className="text-sm text-error flex items-center">❌ Sync failed</div>;
  }
  return <div className="text-sm text-success flex items-center">✓ All changes saved</div>;
}
