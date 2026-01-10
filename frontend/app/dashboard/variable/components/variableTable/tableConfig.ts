import type Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import type { VariableType, Variable } from '@/types/Variable';
import { nullSafeEnhancedRenderer } from './utils/utils';

// Default UI constants
export const DEFAULT_MIN_ROWS = 50;
export const DEFAULT_VARIABLE_TYPE: Variable['type'] = "NUMERIC";
export const DEFAULT_VARIABLE_WIDTH = 8;
export const DEFAULT_VARIABLE_DECIMALS = 2;

// Updated headers: Measure after Decimals; last columns: Role, Columns, Align
export const colHeaders = [
    'Name',
    'Type',
    'Width',
    'Decimals',
    'Measure',
    'Label',
    'Values',
    'Missing',
    'Role',
    'Align'
];

// SPSS Variable Types list
export const DATE_VARIABLE_TYPES: VariableType[] = [
  'DATE','ADATE','EDATE','SDATE','JDATE','QYR','MOYR',
  'WKYR','DATETIME','TIME','DTIME','WKDAY','MONTH'
];

// Column index mapping & field map
export const COLUMN_INDEX: Record<string, number> = {
    NAME: 0,
    TYPE: 1,
    WIDTH: 2,
    DECIMALS: 3,
    MEASURE: 4,
    LABEL: 5,
    VALUES: 6,
    MISSING: 7,
    ROLE: 8,
    ALIGN: 9,
};
export const COLUMN_INDEX_TO_FIELD_MAP: (keyof Variable | string)[] = [
    "name", "type", "width", "decimals", "measure",
    "label", "values", "missing", "role", "align"
];

// Updated column configs to match new order and data indices
export const columns: Handsontable.GridSettings['columns'] = [
    { data: COLUMN_INDEX.NAME, type: 'text', renderer: nullSafeEnhancedRenderer, numericFormat: undefined, width: 200 },
    {
      data: COLUMN_INDEX.TYPE,
      type: 'text',
      readOnly: true,
      width: 125,
      className: 'htDropdownCell',
    },
    { data: COLUMN_INDEX.WIDTH, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },
    { data: COLUMN_INDEX.DECIMALS, type: 'numeric', numericFormat: { pattern: '0' }, width: 100 },
    { data: COLUMN_INDEX.MEASURE, type: 'dropdown', width: 125, className: 'htDropdownCell' },
    { data: COLUMN_INDEX.LABEL, type: 'text', renderer: nullSafeEnhancedRenderer, width: 175 },
    { data: COLUMN_INDEX.VALUES, type: 'text', renderer: nullSafeEnhancedRenderer, readOnly: true, width: 175, className: 'htDropdownCell' },
    { data: COLUMN_INDEX.MISSING, type: 'text', renderer: nullSafeEnhancedRenderer, readOnly: true, width: 175, className: 'htDropdownCell' },
    { data: COLUMN_INDEX.ROLE, type: 'dropdown', source: ['input','target','both','none','partition','split'], strict: true, allowInvalid: false, width: 125, className: 'htDropdownCell' },
    { data: COLUMN_INDEX.ALIGN, type: 'dropdown', source: ['left','right','center'], width: 125, className: 'htDropdownCell' }
];

// Dialog and validation triggers
export const DIALOG_TRIGGER_COLUMNS = [
    COLUMN_INDEX.TYPE,
    COLUMN_INDEX.VALUES,
    COLUMN_INDEX.MISSING
];
export const VALIDATION_TRIGGER_FIELDS: (keyof Variable | string)[] = [
    "type", "width", "decimals"
];