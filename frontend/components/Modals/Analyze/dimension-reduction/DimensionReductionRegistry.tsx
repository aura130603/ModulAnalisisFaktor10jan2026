import React, {lazy, Suspense} from "react";
import {BaseModalProps, ModalType} from "@/types/modalTypes";

/**
 * LoadingModal - Displayed while modal components are loading
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
    <div className="p-6 text-center">
        <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" />
        <p className="text-sm text-muted-foreground">
            Loading dimension reduction modal...
        </p>
    </div>
);

/**
 * withSuspense - HOC for wrapping lazy-loaded components with Suspense
 */
function withSuspense(
    Component: React.ComponentType<BaseModalProps>
): React.ComponentType<BaseModalProps> {
    const WrappedComponent = (props: BaseModalProps) => (
        <Suspense fallback={<LoadingModal onClose={props.onClose} />}>
            <Component {...props} />
        </Suspense>
    );

    WrappedComponent.displayName = `withSuspense(${
        Component.displayName || Component.name || "Component"
    })`;
    return WrappedComponent;
}

// Lazy load Dimension Reduction modals
const FactorModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/dimension-reduction/factor/dialogs/factor-main"
    ).then((module) => ({ default: module.FactorContainer }))
);
const CorrespondenceAnalysisModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/dimension-reduction/correspondence-analysis/dialogs/correspondence-analysis-main"
    ).then((module) => ({ default: module.CorrespondenceContainer }))
);
const OptimalScalingModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/optimal-scaling-main"
    ).then((module) => ({ default: module.OptScaContainer }))
);
const OptimalScalingCatpcaModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/catpca/dialogs/optimal-scaling-catpca-main"
    ).then((module) => ({ default: module.OptScaCatpcaContainer }))
);
const OptimalScalingOveralsModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/overals/dialogs/optimal-scaling-overals-main"
    ).then((module) => ({ default: module.OptScaOveralsContainer }))
);
const OptimalScalingMcaModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/dimension-reduction/optimal-scaling/mca/dialogs/optimal-scaling-mca-main"
    ).then((module) => ({ default: module.OptScaMCAContainer }))
);

/**
 * DIMENSION_REDUCTION_MODAL_COMPONENTS - Registry for dimension reduction modal components
 *
 * Maps each dimension reduction-related ModalType to its corresponding React component
 */
export const DIMENSION_REDUCTION_MODAL_COMPONENTS: Record<
    string,
    React.ComponentType<BaseModalProps>
> = {
    [ModalType.ModalFactor]: withSuspense(
        FactorModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalCorrespondenceAnalysis]: withSuspense(
        CorrespondenceAnalysisModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalDROptimalScaling]: withSuspense(
        OptimalScalingModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalOptimalScalingCATPCA]: withSuspense(
        OptimalScalingCatpcaModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalOptimalScalingOVERALS]: withSuspense(
        OptimalScalingOveralsModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalOptimalScalingMCA]: withSuspense(
        OptimalScalingMcaModal as any
    ) as React.ComponentType<BaseModalProps>,
};

/**
 * getDimensionReductionModalComponent - Get a dimension reduction modal component by type
 *
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getDimensionReductionModalComponent(
    type: ModalType
): React.ComponentType<BaseModalProps> | null {
    const Component = DIMENSION_REDUCTION_MODAL_COMPONENTS[type];

    if (!Component) {
        console.warn(
            `No dimension reduction modal component registered for type: ${type}`
        );
        return null;
    }

    return Component;
}

/**
 * DIMENSION_REDUCTION_MODAL_CONTAINER_PREFERENCES - Container preferences for dimension reduction modals
 *
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const DIMENSION_REDUCTION_MODAL_CONTAINER_PREFERENCES: Partial<
    Record<ModalType, "dialog" | "sidebar">
> = {
    [ModalType.ModalFactor]: "sidebar",
    [ModalType.ModalCorrespondenceAnalysis]: "sidebar",
    [ModalType.ModalDROptimalScaling]: "sidebar",
    [ModalType.ModalOptimalScalingCATPCA]: "sidebar",
    [ModalType.ModalOptimalScalingOVERALS]: "sidebar",
    [ModalType.ModalOptimalScalingMCA]: "sidebar",
};
