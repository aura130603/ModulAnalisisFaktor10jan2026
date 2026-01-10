import { ModalType } from '@/types/modalTypes';

// Export registry
export {
    COMPARE_MEANS_MODAL_COMPONENTS,
    COMPARE_MEANS_MODAL_CONTAINER_PREFERENCES,
    getCompareMeansModalComponent
} from './CompareMeansRegistry';

// Export menu
export { default as CompareMeansMenu } from './CompareMeansMenu';

// Export modal components
export { default as OneSampleTTest } from './OneSampleTTest';
export { default as IndependentSamplesTTest } from './IndependentSamplesTTest';
export { default as PairedSamplesTTest } from './PairedSamplesTTest';
// export { default as OneWayANOVA } from './OneWayANOVA';

// Helper function to identify Compare Means modals
export const isCompareMeansModal = (type: ModalType): boolean => {
    return [
        ModalType.OneSampleTTest,
        ModalType.IndependentSamplesTTest,
        ModalType.PairedSamplesTTest,
        ModalType.OneWayANOVA
    ].includes(type);
}; 