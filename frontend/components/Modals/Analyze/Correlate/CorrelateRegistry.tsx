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
    <p className="text-sm text-muted-foreground">Loading correlate modal...</p>
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

// Lazy load Correlate modals
const BivariateModal = lazy(() => import('@/components/Modals/Analyze/Correlate/Bivariate'));

/**
 * CORRELATE_MODAL_COMPONENTS - Registry for correlate modal components
 * 
 * Maps each correlate related ModalType to its corresponding React component
 */
export const CORRELATE_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  [ModalType.Bivariate]: withSuspense(BivariateModal as any) as React.ComponentType<BaseModalProps>,
};

/**
 * getCorrelateModalComponent - Get a correlate modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getCorrelateModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = CORRELATE_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No correlate modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * CORRELATE_MODAL_CONTAINER_PREFERENCES - Container preferences for correlate modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const CORRELATE_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  [ModalType.Bivariate]: "sidebar",
};
