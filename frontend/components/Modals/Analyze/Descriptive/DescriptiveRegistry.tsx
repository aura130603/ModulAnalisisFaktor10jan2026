import React, { lazy, Suspense } from 'react';
import { ModalType, BaseModalProps } from '@/types/modalTypes';

// Import directly-loaded descriptive modals
// For now, we're creating a minimal registry structure

/**
 * LoadingModal - Displayed while modal components are loading
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
  <div className="p-6 text-center">
    <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" />
    <p className="text-sm text-muted-foreground">Loading descriptive statistics modal...</p>
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

// Lazy load Descriptive modals
const DescriptivesModal = lazy(() => import('@/components/Modals/Analyze/Descriptive/Descriptive'));
const ExploreModal = lazy(() => import('@/components/Modals/Analyze/Descriptive/Explore'));
const FrequenciesModal = lazy(() => import('@/components/Modals/Analyze/Descriptive/Frequencies'));
const CrosstabsModal = lazy(() => import('@/components/Modals/Analyze/Descriptive/Crosstabs'));

/**
 * DESCRIPTIVE_MODAL_COMPONENTS - Registry for descriptive statistics modal components
 * 
 * Maps each descriptive-related ModalType to its corresponding React component
 */
export const DESCRIPTIVE_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  [ModalType.Descriptives]: withSuspense(DescriptivesModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Explore]: withSuspense(ExploreModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Frequencies]: withSuspense(FrequenciesModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Crosstabs]: withSuspense(CrosstabsModal as any) as React.ComponentType<BaseModalProps>,
};

/**
 * getDescriptiveModalComponent - Get a descriptive modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getDescriptiveModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = DESCRIPTIVE_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No descriptive modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES - Container preferences for descriptive modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  [ModalType.Descriptives]: "sidebar",
  [ModalType.Explore]: "sidebar",
  [ModalType.Frequencies]: "sidebar",
  [ModalType.Crosstabs]: "sidebar",
}; 