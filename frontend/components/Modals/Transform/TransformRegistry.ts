import type { ComponentType } from "react";
import { ModalType, BaseModalProps } from "@/types/modalTypes";
import {
  RecodeSameVariablesModal,
  RecodeDifferentVariablesModal,
} from "./recode";
import ComputeVariableModal from "./ComputeVariable/ComputeVariableModal";
import RankCasesModal from "./RankCases/RankCasesModal";

/**
 * TRANSFORM_MODAL_COMPONENTS - Registry for transform modal components
 *
 * Maps each transform-related ModalType to its corresponding React component
 */
export const TRANSFORM_MODAL_COMPONENTS: Record<
  string,
  ComponentType<BaseModalProps>
> = {
  [ModalType.RecodeSameVariables]: RecodeSameVariablesModal,
  [ModalType.RecodeDifferentVariables]: RecodeDifferentVariablesModal,
  [ModalType.ComputeVariable]: ComputeVariableModal,
  [ModalType.RankCases]: RankCasesModal,

  // Add more transform modal components here as needed
};

/**
 * getTransformModalComponent - Get a transform modal component by type
 *
 * @param type - The type of modal to retrieve
 * @returns The React component for the specified modal type, or null if not found
 */
export function getTransformModalComponent(
  type: ModalType
): ComponentType<BaseModalProps> | null {
  const Component = TRANSFORM_MODAL_COMPONENTS[type];

  if (!Component) {
    console.warn(`No transform modal component registered for type: ${type}`);
    return null;
  }

  return Component;
}

/**
 * TRANSFORM_MODAL_CONTAINER_PREFERENCES - Container preferences for transform modals
 *
 * Some modals work better in specific container types based on their complexity
 * and screen space requirements.
 */
export const TRANSFORM_MODAL_CONTAINER_PREFERENCES: Partial<
  Record<ModalType, "dialog" | "sidebar">
> = {
  [ModalType.RecodeSameVariables]: "sidebar",
  [ModalType.RecodeDifferentVariables]: "sidebar",
  [ModalType.ComputeVariable]: "sidebar",
  [ModalType.RankCases]: "dialog",
};

/**
 * Helper function to check if a modal is a transform modal
 */
export const isTransformModal = (type: ModalType): boolean => {
  return [
    ModalType.RecodeSameVariables,
    ModalType.RecodeDifferentVariables,
    ModalType.ComputeVariable,
    ModalType.RankCases,
    // Add more transform types as they are added
  ].includes(type);
};
