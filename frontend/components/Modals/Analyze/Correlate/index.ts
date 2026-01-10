import { ModalType } from "@/types/modalTypes";

// Export components from NonparametricTestRegistry
export {
  CORRELATE_MODAL_COMPONENTS,
  CORRELATE_MODAL_CONTAINER_PREFERENCES,
  getCorrelateModalComponent
} from './CorrelateRegistry';

// Export the menu
export { default as CorrelateMenu } from './CorrelateMenu';

// Export modal components
export { default as Bivariate } from './Bivariate';

// Helper function to identify Correlate modals
export const isCorrelateModal = (type: ModalType): boolean => {
    return [
        ModalType.Bivariate
    ].includes(type);
};