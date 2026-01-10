import React, { lazy, Suspense } from 'react';
import { ModalType, BaseModalProps } from '@/types/modalTypes';

/**
 * LoadingModal - Displayed while modal components are loading
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
  <div className="p-6 text-center">
    <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" />
    <p className="text-sm text-muted-foreground">Loading nonparametric test modal...</p>
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

// Lazy load Nonparametric Tests modals
const ChiSquareModal = lazy(() => import('@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/ChiSquare'));
const RunsModal = lazy(() => import('@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/Runs'));
const TwoIndependentSamplesModal = lazy(() => import('@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/TwoIndependentSamples'));
const KIndependentSamplesModal = lazy(() => import('@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/KIndependentSamples'));
const TwoRelatedSamplesModal = lazy(() => import('@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/TwoRelatedSamples'));
const KRelatedSamplesModal = lazy(() => import('@/components/Modals/Analyze/NonparametricTests/LegacyDialogs/KRelatedSamples'));

/**
 * NONPARAMETRIC_TEST_MODAL_COMPONENTS - Registry for nonparametric test modal components
 * 
 * Maps each nonparametric test related ModalType to its corresponding React component
 */
export const NONPARAMETRIC_TEST_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  [ModalType.ChiSquare]: withSuspense(ChiSquareModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.Runs]: withSuspense(RunsModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.TwoIndependentSamples]: withSuspense(TwoIndependentSamplesModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.KIndependentSamples]: withSuspense(KIndependentSamplesModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.TwoRelatedSamples]: withSuspense(TwoRelatedSamplesModal as any) as React.ComponentType<BaseModalProps>,
  [ModalType.KRelatedSamples]: withSuspense(KRelatedSamplesModal as any) as React.ComponentType<BaseModalProps>,
};

/**
 * getNonparametricTestModalComponent - Get a nonparametric test modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getNonparametricTestModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = NONPARAMETRIC_TEST_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No nonparametric test modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * NONPARAMETRIC_TEST_MODAL_CONTAINER_PREFERENCES - Container preferences for nonparametric test modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const NONPARAMETRIC_TEST_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  [ModalType.ChiSquare]: "sidebar",
  [ModalType.Runs]: "sidebar",
  [ModalType.TwoIndependentSamples]: "sidebar",
  [ModalType.KIndependentSamples]: "sidebar",
  [ModalType.TwoRelatedSamples]: "sidebar",
  [ModalType.KRelatedSamples]: "sidebar",
};
