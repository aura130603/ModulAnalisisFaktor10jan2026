// Types mirroring backend SAV upload response, kept forward-compatible

export interface SavMetaHeader {
  n_cases?: number;
  n_vars?: number;
  // Common optional fields surfaced by sav-reader
  created?: string | number | Date;
  [key: string]: unknown;
}

export interface SavSysVarPrintFormat {
  type?: number;
  typestr?: string; // 'A', 'F', 'DATE', etc.
  width?: number;
  nbdec?: number;
  [key: string]: unknown;
}

export interface SavSysVarWriteFormat {
  type?: number;
  typestr?: string;
  width?: number;
  nbdec?: number;
  [key: string]: unknown;
}

export type SavMissingSpec =
  | number[]
  | { min?: number; max?: number }
  | string
  | number
  | null
  | undefined;

export interface SavSysVar {
  name: string;
  // sav-reader often exposes 0 (numeric) / 1 (string)
  type?: 0 | 1;
  label?: string;
  printFormat?: SavSysVarPrintFormat;
  writeFormat?: SavSysVarWriteFormat;
  measurementLevel?: string; // 'scale', 'ordinal', 'nominal', etc.
  missing?: SavMissingSpec;
  [key: string]: unknown;
}

export interface SavValueLabelEntry {
  val: string | number;
  label: string;
}

export interface SavValueLabelsForVariable {
  appliesToNames?: string[];
  entries: SavValueLabelEntry[];
}

export interface SavMeta {
  header?: SavMetaHeader;
  sysvars?: SavSysVar[];
  valueLabels?: SavValueLabelsForVariable[];
  [key: string]: unknown;
}

export interface SavUploadResponse {
  meta: SavMeta;
  rows: Record<string, unknown>[];
}
