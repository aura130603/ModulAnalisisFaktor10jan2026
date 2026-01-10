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
    <p className="text-sm text-muted-foreground">Loading compare means modal...</p>
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

// Lazy load Compare Means modals
const OneSampleTTestModal = lazy(() => import('@/components/Modals/Analyze/CompareMeans/OneSampleTTest'));
const IndependentSamplesTTestModal = lazy(() => import('@/components/Modals/Analyze/CompareMeans/IndependentSamplesTTest'));
const PairedSamplesTTestModal = lazy(() => import('@/components/Modals/Analyze/CompareMeans/PairedSamplesTTest'));
const OneWayANOVAModal = lazy(() => import('@/components/Modals/Analyze/CompareMeans/OneWayAnova'));

/**
 * COMPARE_MEANS_MODAL_COMPONENTS - Registry for compare means modal components
 * 
 * Maps each compare means related ModalType to its corresponding React component
 */
export const COMPARE_MEANS_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  [ModalType.OneSampleTTest]: withSuspense(OneSampleTTestModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.IndependentSamplesTTest]: withSuspense(IndependentSamplesTTestModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.PairedSamplesTTest]: withSuspense(PairedSamplesTTestModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.OneWayANOVA]: withSuspense(OneWayANOVAModal as any) as React.ComponentType<BaseModalProps>,
};

/**
 * getCompareMeansModalComponent - Get a compare means modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getCompareMeansModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = COMPARE_MEANS_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No compare means modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * COMPARE_MEANS_MODAL_CONTAINER_PREFERENCES - Container preferences for compare means modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const COMPARE_MEANS_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  [ModalType.OneSampleTTest]: "sidebar",
  [ModalType.IndependentSamplesTTest]: "sidebar",
  [ModalType.PairedSamplesTTest]: "sidebar",
  [ModalType.OneWayANOVA]: "sidebar",
};
