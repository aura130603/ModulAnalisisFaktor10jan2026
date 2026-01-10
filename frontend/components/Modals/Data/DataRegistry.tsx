import React, { lazy, Suspense } from 'react';
import type { BaseModalProps } from '@/types/modalTypes';
import { ModalType } from '@/types/modalTypes';

// Import data modals directly - prioritize commonly used modals
import DefineVariableProperties from '@/components/Modals/Data/DefineVarProps';
import PropertiesEditor from '@/components/Modals/Data/DefineVarProps/PropertiesEditor';
import SetMeasurementLevel from '@/components/Modals/Data/SetMeasurementLevel';

// Lazy load less frequently used modals
const DefineDateTime = lazy(() => import('@/components/Modals/Data/DefineDateTime'));
const SortCases = lazy(() => import('@/components/Modals/Data/SortCases'));
const SortVariables = lazy(() => import('@/components/Modals/Data/SortVars'));
const Transpose = lazy(() => import('@/components/Modals/Data/Transpose'));
const Restructure = lazy(() => import('@/components/Modals/Data/Restructure'));
const Aggregate = lazy(() => import('@/components/Modals/Data/Aggregate'));
const WeightCases = lazy(() => import('@/components/Modals/Data/WeightCases'));
const DuplicateCases = lazy(() => import('@/components/Modals/Data/DuplicateCases'));
const SelectCases = lazy(() => import('@/components/Modals/Data/SelectCases'));

/**
 * LoadingModal - Displayed while modal components are loading
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
  <div className="p-6 text-center" data-testid="data-modal-loading">
    <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" data-testid="data-modal-loading-spinner" />
    <p className="text-sm text-muted-foreground" data-testid="data-modal-loading-text">Loading data modal...</p>
  </div>
);

/**
 * withSuspense - HOC for wrapping lazy-loaded components with Suspense
 */
function withSuspense(Component: React.ComponentType<BaseModalProps>): React.ComponentType<BaseModalProps> {
  const WrappedComponent = (props: BaseModalProps) => (
    <Suspense fallback={<LoadingModal onClose={props.onClose} />}>
      <Component {...props} />
    </Suspense>
  );
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

/**
 * DATA_MODAL_COMPONENTS - Registry for data modal components
 * 
 * Maps each data-related ModalType to its corresponding React component
 */
export const DATA_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  // Variable properties related
  [ModalType.DefineVarProps]: DefineVariableProperties as React.ComponentType<BaseModalProps>,
  [ModalType.VarPropsEditor]: PropertiesEditor as React.ComponentType<BaseModalProps>,
  [ModalType.SetMeasurementLevel]: SetMeasurementLevel as React.ComponentType<BaseModalProps>,
  [ModalType.DefineDateTime]: withSuspense(DefineDateTime as any),
  
  // Case operations
  [ModalType.SortCases]: withSuspense(SortCases as any),
  [ModalType.DuplicateCases]: withSuspense(DuplicateCases as any),
  [ModalType.SelectCases]: withSuspense(SelectCases as any),
  [ModalType.WeightCases]: withSuspense(WeightCases as any),
  
  // Structure operations
  [ModalType.SortVars]: withSuspense(SortVariables as any),
  [ModalType.Transpose]: withSuspense(Transpose as any),
  [ModalType.Restructure]: withSuspense(Restructure as any),
  [ModalType.Aggregate]: withSuspense(Aggregate as any),
};

/**
 * getDataModalComponent - Get a data modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getDataModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = DATA_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No data modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * DATA_MODAL_CONTAINER_PREFERENCES - Container preferences for data modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const DATA_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  // Variable property modals - typically complex forms
  [ModalType.DefineVarProps]: "sidebar",
  [ModalType.VarPropsEditor]: "sidebar",
  [ModalType.SetMeasurementLevel]: "sidebar",
  [ModalType.DefineDateTime]: "sidebar",
  
  // Case operations - typically forms with selection lists
  [ModalType.SortCases]: "sidebar",
  [ModalType.DuplicateCases]: "sidebar",
  [ModalType.SelectCases]: "sidebar",
  [ModalType.WeightCases]: "sidebar",
  
  // Structure operations - typically more complex forms
  [ModalType.SortVars]: "sidebar",
  [ModalType.Transpose]: "sidebar",
  [ModalType.Restructure]: "sidebar",
  [ModalType.Aggregate]: "sidebar",
}; 