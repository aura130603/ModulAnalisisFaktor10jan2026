// utils/workerRegistry.ts

// Central registry + simple pool for Web Workers used in statistical analyses.
// Keeps workers alive for reuse, minimising startup overhead when multiple jobs of the
// same type are executed (e.g., Descriptives processing many variables).

// Map analysisType -> public worker URL.
const ANALYSIS_WORKERS: Record<string, string> = {
  // Map each statistical analysis to its own dedicated worker script
  descriptives: "/workers/DescriptiveStatistics/descriptives.worker.js",
  frequencies: "/workers/DescriptiveStatistics/frequencies.worker.js",
  crosstabs: "/workers/DescriptiveStatistics/crosstabs.worker.js",
  examine: "/workers/DescriptiveStatistics/examine.worker.js", // Used by Explore dialog
  // Add more analysis categories here when needed
};

// Maximum number of live workers kept per analysis type.
const MAX_POOL = 2;

// Internal pool store: { [type]: Worker[] }
const pools: Record<string, Worker[]> = {};

export function getWorker(type: string): Worker {
  if (!ANALYSIS_WORKERS[type]) {
    throw new Error(`WorkerRegistry: unknown analysis type \"${type}\"`);
  }

  pools[type] = pools[type] || [];

  // Try to find an idle worker
  const idle = pools[type].find((w: any) => !(w as any).__busy);
  if (idle) {
    (idle as any).__busy = true;
    return idle;
  }

  // No idle worker, spawn new one
  const workerUrl = ANALYSIS_WORKERS[type];
  const worker = new Worker(workerUrl);
  (worker as any).__busy = true;
  pools[type].push(worker);

  // Limit pool size
  if (pools[type].length > MAX_POOL) {
    const [old] = pools[type].splice(0, 1);
    old.terminate();
  }

  return worker;
}

export function releaseWorker(type: string, worker: Worker) {
  if (!worker) return;

  // Mark as idle so it can be reused.
  (worker as any).__busy = false;
} 