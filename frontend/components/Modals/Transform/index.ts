import { ModalType } from "@/types/modalTypes";

// Main exports from TransformRegistry
export {
  TRANSFORM_MODAL_COMPONENTS,
  TRANSFORM_MODAL_CONTAINER_PREFERENCES,
  getTransformModalComponent,
  isTransformModal,
} from "./TransformRegistry";

// Export transform modal components for direct usage
export { default as ComputeVariableModal } from "./ComputeVariable/ComputeVariableModal";
export { RecodeSameVariablesModal } from "./recode/RecodeSameVariables/index";
export { RecodeDifferentVariablesModal } from "./recode/RecodeDifferentVariables/index";
