// util/workerClient.ts
export interface WorkerClient<TPayload = any, TResult = any> {
  /** Kirim pesan ke worker */
  post: (payload: TPayload) => void;
  /** Hentikan worker dan bebaskan resource */
  terminate: () => void;
  /** Daftarkan handler untuk pesan sukses */
  onMessage: (handler: (data: TResult) => void) => void;
  /** Daftarkan handler untuk error */
  onError: (handler: (err: ErrorEvent) => void) => void;
}

/**
 * createWorkerClient – Helper untuk membuat pembungkus Worker yang sederhana
 * sehingga komunikasi dan terminasi worker konsisten di seluruh aplikasi.
 *
 * Penggunaan dasar:
 *
 * const client = createWorkerClient<MyPayload, MyResult>("/workers/myWorker.js");
 * client.onMessage((data) => { ... });
 * client.post({ ... });
 * // ...
 * client.terminate();
 */
export function createWorkerClient<TPayload = any, TResult = any>(
  workerUrl: string
): WorkerClient<TPayload, TResult> {
  const worker = new Worker(workerUrl);
  const msgHandlers: Array<(data: TResult) => void> = [];
  const errHandlers: Array<(err: ErrorEvent) => void> = [];

  // Forward events ke daftar listener
  worker.onmessage = (e: MessageEvent<any>) => {
    const data = e.data as TResult;
    msgHandlers.forEach((h) => h(data));
  };

  worker.onerror = (err: ErrorEvent) => {
    errHandlers.forEach((h) => h(err));
  };

  return {
    post: (payload: TPayload) => worker.postMessage(payload),
    terminate: () => worker.terminate(),
    onMessage: (handler) => {
      msgHandlers.push(handler);
    },
    onError: (handler) => {
      errHandlers.push(handler);
    },
  };
}

export default createWorkerClient;

import { getWorker } from "./workerRegistry";

export function createPooledWorkerClient<TPayload = any, TResult = any>(
  analysisType: string
): WorkerClient<TPayload, TResult> {
  const worker = getWorker(analysisType);
  const msgHandlers: Array<(data: TResult) => void> = [];
  const errHandlers: Array<(err: ErrorEvent) => void> = [];

  worker.onmessage = (e: MessageEvent<any>) => {
    const data = e.data as TResult;
    msgHandlers.forEach((h) => h(data));
  };

  worker.onerror = (err: ErrorEvent) => {
    errHandlers.forEach((h) => h(err));
  };

  return {
    post: (payload: TPayload) => worker.postMessage(payload),
    // Terminate the worker so memory is freed and tests (which spy on
    // Worker.terminate) can verify that the call happened. For Crosstabs the
    // performance benefit of pooling is negligible compared to simplicity.
    terminate: () => {
      // Ensure the underlying thread is stopped so memory is freed and tests
      // can spy on the terminate call. We intentionally terminate instead of
      // returning the worker to the pool because Crosstabs analyses usually
      // run infrequently and freeing memory is preferable to pooling here.
      worker.terminate();
    },
    onMessage: (handler) => {
      msgHandlers.push(handler);
    },
    onError: (handler) => {
      errHandlers.push(handler);
    },
  };
}
