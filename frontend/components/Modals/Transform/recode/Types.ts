import { Variable } from "@/types/Variable";

export interface RecodeRule {
  id: string;
  oldValueType:
    | "value"
    | "systemMissing"
    | "systemOrUserMissing"
    | "range"
    | "rangeLowest"
    | "rangeHighest"
    | "else";
  oldValue: string | number | [number | null, number | null] | null;
  oldValueDisplay: string;
  newValueType: "value" | "systemMissing";
  newValue: string | number | null;
  newValueDisplay: string;
}

export interface RecodeMapping {
  sourceVariable: Variable;
  targetName: string;
  targetLabel: string;
}
