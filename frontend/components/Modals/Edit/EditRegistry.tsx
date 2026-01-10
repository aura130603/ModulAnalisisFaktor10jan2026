import React from 'react';
import type { BaseModalProps } from '@/types/modalTypes';
import { ModalType } from '@/types/modalTypes';

// Import edit modal components
import { FindAndReplaceModal } from './FindReplace';
import { FindReplaceMode } from './FindReplace/types';
import GoToModal, { GoToMode } from './GoTo';

/**
 * Pre-defined modal components
 * 
 * Define components outside the registry to maintain stable references and preserve state
 */
// Find and Replace Modal
const FindAndReplaceModalWrapper: React.FC<BaseModalProps & { initialTab?: FindReplaceMode }> = (props) => {
  // Extract initialTab from props if it exists
  const { initialTab, ...otherProps } = props;
  return <FindAndReplaceModal {...otherProps} initialTab={initialTab} defaultTab={FindReplaceMode.FIND} />;
};
FindAndReplaceModalWrapper.displayName = 'FindAndReplaceModal';

// Go To Modal
const GoToModalWrapper: React.FC<BaseModalProps & { initialMode?: GoToMode }> = (props) => {
  // Extract initialMode from props if it exists
  const { initialMode, ...otherProps } = props;
  return <GoToModal {...otherProps} initialMode={initialMode} defaultMode={GoToMode.CASE} />;
};
GoToModalWrapper.displayName = 'GoToModal';

/**
 * EDIT_MODAL_COMPONENTS - Registry for edit modal components
 * 
 * Maps each edit-related ModalType to its corresponding React component
 * Using stable component references to preserve state during re-renders
 */
export const EDIT_MODAL_COMPONENTS: Record<string, React.ComponentType<BaseModalProps>> = {
  [ModalType.FindAndReplace]: FindAndReplaceModalWrapper,
  [ModalType.GoTo]: GoToModalWrapper
};

/**
 * getEditModalComponent - Get an edit modal component by type
 * 
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getEditModalComponent(type: ModalType): React.ComponentType<BaseModalProps> | null {
  const Component = EDIT_MODAL_COMPONENTS[type];
  
  if (!Component) {
    console.warn(`No edit modal component registered for type: ${type}`);
    return null;
  }
  
  return Component;
}

/**
 * EDIT_MODAL_CONTAINER_PREFERENCES - Container preferences for edit modals
 * 
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const EDIT_MODAL_CONTAINER_PREFERENCES: Partial<Record<ModalType, "dialog" | "sidebar">> = {
  [ModalType.FindAndReplace]: "sidebar",
  [ModalType.GoTo]: "sidebar",
};

/**
 * Helper function to check if a modal is an edit modal
 */
export const isEditModal = (type: ModalType): boolean => {
  return [
    ModalType.FindAndReplace,
    ModalType.GoTo
  ].includes(type);
}; 