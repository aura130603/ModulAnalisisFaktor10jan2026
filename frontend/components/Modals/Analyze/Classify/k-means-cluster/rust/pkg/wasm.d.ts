/* tslint:disable */
/* eslint-disable */
export class KMeansClusterAnalysis {
  free(): void;
  constructor(target_data: any, case_data: any, target_data_defs: any, case_data_defs: any, config_data: any);
  get_results(): any;
  get_formatted_results(): any;
  get_all_log(): any;
  get_all_errors(): any;
  clear_errors(): any;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_kmeansclusteranalysis_free: (a: number, b: number) => void;
  readonly kmeansclusteranalysis_new: (a: any, b: any, c: any, d: any, e: any) => [number, number, number];
  readonly kmeansclusteranalysis_get_results: (a: number) => [number, number, number];
  readonly kmeansclusteranalysis_get_formatted_results: (a: number) => [number, number, number];
  readonly kmeansclusteranalysis_get_all_log: (a: number) => [number, number, number];
  readonly kmeansclusteranalysis_get_all_errors: (a: number) => any;
  readonly kmeansclusteranalysis_clear_errors: (a: number) => any;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_4: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
