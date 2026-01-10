import React, {lazy, Suspense} from "react";
import {BaseModalProps, ModalType} from "@/types/modalTypes";

/**
 * LoadingModal - Displayed while modal components are loading
 */
const LoadingModal: React.FC<BaseModalProps> = ({ onClose }) => (
    <div className="p-6 text-center">
        <div className="animate-pulse mx-auto h-8 w-8 rounded-full bg-primary/20 mb-4" />
        <p className="text-sm text-muted-foreground">
            Loading general linear model modal...
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

// Lazy load General Linear Model modals
const UnivariateModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/general-linear-model/univariate/dialogs/univariate-main"
    ).then((module) => ({ default: module.UnivariateContainer }))
);
const MultivariateModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/general-linear-model/multivariate/dialogs/multivariate-main"
    ).then((module) => ({ default: module.MultivariateContainer }))
);
const RepeatedMeasuresModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/general-linear-model/repeated-measures/dialogs/repeated-measures-main"
    ).then((module) => ({ default: module.RepeatedMeasuresContainer }))
);
const VarianceComponentsModal = lazy(() =>
    import(
        "@/components/Modals/Analyze/general-linear-model/variance-components/dialogs/variance-components-main"
    ).then((module) => ({ default: module.VarianceCompsContainer }))
);

/**
 * GENERAL_LINEAR_MODEL_MODAL_COMPONENTS - Registry for general linear model modal components
 *
 * Maps each general linear model-related ModalType to its corresponding React component
 */
export const GENERAL_LINEAR_MODEL_MODAL_COMPONENTS: Record<
    string,
    React.ComponentType<BaseModalProps>
> = {
    [ModalType.ModalUnivariate]: withSuspense(
        UnivariateModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalMultivariate]: withSuspense(
        MultivariateModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalRepeatedMeasures]: withSuspense(
        RepeatedMeasuresModal as any
    ) as React.ComponentType<BaseModalProps>,
    [ModalType.ModalVarianceComponents]: withSuspense(
        VarianceComponentsModal as any
    ) as React.ComponentType<BaseModalProps>,
};

/**
 * getGeneralLinearModelModalComponent - Get a general linear model modal component by type
 *
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getGeneralLinearModelModalComponent(
    type: ModalType
): React.ComponentType<BaseModalProps> | null {
    const Component = GENERAL_LINEAR_MODEL_MODAL_COMPONENTS[type];

    if (!Component) {
        console.warn(
            `No general linear model modal component registered for type: ${type}`
        );
        return null;
    }

    return Component;
}

/**
 * GENERAL_LINEAR_MODEL_MODAL_CONTAINER_PREFERENCES - Container preferences for general linear model modals
 *
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const GENERAL_LINEAR_MODEL_MODAL_CONTAINER_PREFERENCES: Partial<
    Record<ModalType, "dialog" | "sidebar">
> = {
    [ModalType.ModalUnivariate]: "sidebar",
    [ModalType.ModalMultivariate]: "sidebar",
    [ModalType.ModalRepeatedMeasures]: "sidebar",
    [ModalType.ModalVarianceComponents]: "sidebar",
};
