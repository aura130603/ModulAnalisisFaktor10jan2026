// Re-export from AnalyzeRegistry
export {
    ANALYZE_MODAL_COMPONENTS,
    ANALYZE_MODAL_CONTAINER_PREFERENCES,
    getAnalyzeModalComponent,
    isAnalyzeModal
} from './AnalyzeRegistry';

// Also re-export descriptive components for backward compatibility
export { 
    DESCRIPTIVE_MODAL_COMPONENTS,
    DESCRIPTIVE_MODAL_CONTAINER_PREFERENCES,
    getDescriptiveModalComponent
} from './Descriptive/DescriptiveRegistry'; 