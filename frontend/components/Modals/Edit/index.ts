// components/Modals/Edit/index.ts
import { ModalType } from "@/types/modalTypes";

// Export registry
export { 
    EDIT_MODAL_COMPONENTS,
    EDIT_MODAL_CONTAINER_PREFERENCES,
    getEditModalComponent,
    isEditModal
} from './EditRegistry';

// Export menu component
export { default as EditMenu } from './EditMenu';

// Export FindReplace components and types
export { FindAndReplaceModal, isFindReplaceModalType } from './FindReplace';
export { FindReplaceMode } from './FindReplace/types';

// Export GoTo components and types
export { default as GoToModal, GoToMode } from './GoTo';
