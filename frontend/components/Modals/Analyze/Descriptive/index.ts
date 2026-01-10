import { ModalType } from "@/types/modalTypes";

// Export registry from DescriptiveRegistry
export { 
    DESCRIPTIVE_MODAL_COMPONENTS,
    DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES,
    getDescriptiveModalComponent
} from './DescriptiveRegistry';

// Export menu component
export { default as DescriptiveMenu } from './DescriptiveMenu';

// Export direct components (lazyload handled in ModalRegistry)
export { default as Descriptives } from './Descriptive';
export { default as Explore } from './Explore';
export { default as Frequencies } from './Frequencies';
export { default as Crosstabs } from './Crosstabs';

// Helper function to identify Descriptive modals
export const isDescriptiveModal = (type: ModalType): boolean => {
    return [
        ModalType.Descriptives,
        ModalType.Explore,
        ModalType.Frequencies,
        ModalType.Crosstabs
    ].includes(type);
}; 