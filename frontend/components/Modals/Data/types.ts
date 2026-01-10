import type { BaseModalProps } from '@/types/modalTypes';
import type { Variable } from '@/types/Variable';

/**
 * VariableListProps - Props for components that display variable lists
 */
export interface VariableListProps {
  variables: Variable[];
  selectedVariables?: string[];
  onSelect?: (variable: Variable) => void;
  onDeselect?: (variable: Variable) => void;
  onDoubleClick?: (variable: Variable) => void;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
  maxHeight?: string;
  headerText?: string;
}

/**
 * DropZoneProps - Props for variable drop zone components
 */
export interface DropZoneProps {
  title: string;
  variables: Variable[];
  onAdd: (variable: Variable) => void;
  onRemove: (variable: Variable) => void;
  onReorder?: (newOrder: Variable[]) => void;
  maxItems?: number;
  className?: string;
  disabled?: boolean;
  tooltipText?: string;
}

/**
 * DataModalContentProps - Common props for data modal content components
 * 
 * Extends BaseModalProps with additional props specific to data modals
 */
export interface DataModalContentProps extends BaseModalProps {
  onSubmit?: (data: any) => void;
  isProcessing?: boolean;
  defaultValues?: any;
  mode?: 'create' | 'edit';
}

/**
 * SortDirection - Sort direction options
 */
export type SortDirection = 'ascending' | 'descending';

/**
 * ValidationRule - Interface for data validation rules
 */
export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  variableIds: string[];
  condition: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
}

/**
 * WeightOption - Options for weight application
 */
export type WeightOption = 'off' | 'on' | 'temporaryOn'; 