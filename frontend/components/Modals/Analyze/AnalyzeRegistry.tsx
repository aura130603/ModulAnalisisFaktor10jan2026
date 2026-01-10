import { ModalType, BaseModalProps } from "@/types/modalTypes";

// Import from Descriptive registry via index.ts
import {
    DESCRIPTIVE_MODAL_COMPONENTS,
    DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES,
    getDescriptiveModalComponent,
} from "./Descriptive";
import {
    CLASSIFY_MODAL_COMPONENTS,
    CLASSIFY_MODAL_CONTAINER_PREFERENCES,
} from "./Classify";
import {
    DIMENSION_REDUCTION_MODAL_COMPONENTS,
    DIMENSION_REDUCTION_MODAL_CONTAINER_PREFERENCES,
} from "./dimension-reduction";
import {
    GENERAL_LINEAR_MODEL_MODAL_COMPONENTS,
    GENERAL_LINEAR_MODEL_MODAL_CONTAINER_PREFERENCES,
} from "./general-linear-model";

// Import from TimeSeries registry 
import {
    TIME_SERIES_MODAL_COMPONENTS,
    TIME_SERIES_MODAL_CONTAINER_PREFERENCES,
    isTimeSeriesModal
} from './TimeSeries';

// Import from CompareMeans registry via index.ts
import {
    COMPARE_MEANS_MODAL_COMPONENTS,
    COMPARE_MEANS_MODAL_CONTAINER_PREFERENCES,
    getCompareMeansModalComponent
} from './CompareMeans';

// Import from NonparametricTests registry via index.ts
import {
    NONPARAMETRIC_TEST_MODAL_COMPONENTS,
    NONPARAMETRIC_TEST_MODAL_CONTAINER_PREFERENCES,
    getNonparametricTestModalComponent
} from './NonparametricTests';

// Import from Correlate registry via index.ts
import {
    CORRELATE_MODAL_COMPONENTS,
    CORRELATE_MODAL_CONTAINER_PREFERENCES,
    getCorrelateModalComponent
} from './Correlate';

/**
 * ANALYZE_MODAL_COMPONENTS - Central registry for all Analyze modals
 *
 * This will gradually be expanded to include other analyze categories beyond Descriptive
 */
export const ANALYZE_MODAL_COMPONENTS: Record<
    string,
    React.ComponentType<BaseModalProps>
> = {
    // Descriptive modals
    ...DESCRIPTIVE_MODAL_COMPONENTS,
    ...CLASSIFY_MODAL_COMPONENTS,
    ...DIMENSION_REDUCTION_MODAL_COMPONENTS,
    ...GENERAL_LINEAR_MODEL_MODAL_COMPONENTS,

    
    // Time Series modals
    ...TIME_SERIES_MODAL_COMPONENTS,
    
    // Compare Means modals
    ...COMPARE_MEANS_MODAL_COMPONENTS,

    // Correlate modals
    ...CORRELATE_MODAL_COMPONENTS,
    
    // Nonparametric Tests modals
    ...NONPARAMETRIC_TEST_MODAL_COMPONENTS,
    
    // Future categories will be added here
    // ...NONPARAMETRIC_MODAL_COMPONENTS,
    // etc.
};

/**
 * getAnalyzeModalComponent - Get an analyze modal component by type
 *
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getAnalyzeModalComponent(
    type: ModalType
): React.ComponentType<BaseModalProps> | null {
    const Component = ANALYZE_MODAL_COMPONENTS[type];

    if (!Component) {
        console.warn(`No analyze modal component registered for type: ${type}`);
        return null;
    }

    return Component;
}

/**
 * ANALYZE_MODAL_CONTAINER_PREFERENCES - Container preferences for analyze modals
 *
 * Combines preferences from all analyze sub-categories
 */
export const ANALYZE_MODAL_CONTAINER_PREFERENCES: Partial<
    Record<ModalType, "dialog" | "sidebar">
> = {
    // Descriptive modals
    ...DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES,
    ...CLASSIFY_MODAL_CONTAINER_PREFERENCES,
    ...DIMENSION_REDUCTION_MODAL_CONTAINER_PREFERENCES,
    ...GENERAL_LINEAR_MODEL_MODAL_CONTAINER_PREFERENCES,

    
    // Time Series modals
    ...TIME_SERIES_MODAL_CONTAINER_PREFERENCES,
    
    // Compare Means modals
    ...COMPARE_MEANS_MODAL_CONTAINER_PREFERENCES,
    
    // Nonparametric Tests modals
    ...NONPARAMETRIC_TEST_MODAL_CONTAINER_PREFERENCES,

    // Correlate modals
    ...CORRELATE_MODAL_CONTAINER_PREFERENCES,
    
    // Future categories will be added here
};

/**
 * isAnalyzeModal - Check if a modal type belongs to the Analyze category
 *
 * @param type - The modal type to check
 * @returns Whether the modal is an Analyze modal
 */
export const isAnalyzeModal = (type: ModalType): boolean => {
    return type in ANALYZE_MODAL_COMPONENTS || isTimeSeriesModal(type);
}; 