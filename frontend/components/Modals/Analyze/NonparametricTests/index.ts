import { ModalType } from "@/types/modalTypes";

// Export components from NonparametricTestRegistry
export {
  NONPARAMETRIC_TEST_MODAL_COMPONENTS,
  NONPARAMETRIC_TEST_MODAL_CONTAINER_PREFERENCES,
  getNonparametricTestModalComponent
} from './NonparametricTestRegistry';

// Export the menu
export { default as NonparametricTestsMenu } from './NonparametricTestMenu';

// Export modal components
export { default as ChiSquare } from './LegacyDialogs/ChiSquare';
export { default as Runs } from './LegacyDialogs/Runs';
export { default as TwoIndependentSamples } from './LegacyDialogs/TwoIndependentSamples';
export { default as KIndependentSamples } from './LegacyDialogs/KIndependentSamples';
export { default as TwoRelatedSamples } from './LegacyDialogs/TwoRelatedSamples';
export { default as KRelatedSamples } from './LegacyDialogs/KRelatedSamples';

// Helper function to identify Nonparametric Test modals
export const isNonparametricTestModal = (type: ModalType): boolean => {
    return [
        ModalType.ChiSquare,
        ModalType.Runs,
        ModalType.TwoIndependentSamples,
        ModalType.KIndependentSamples,
        ModalType.TwoRelatedSamples,
        ModalType.KRelatedSamples
    ].includes(type);
};